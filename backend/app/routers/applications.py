from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.notification import Notification
from app.models.ml_model import TrainedModel
from app.schemas.application import (
    ApplicationCreate, ApplicationStatusUpdate,
    ApplicationStudentResponse, ApplicationRecruiterResponse
)
from app.routers.auth import get_current_user, require_role
from app.services.matcher import match_candidate_to_job
from app.services.ml_service import explain_prediction

router = APIRouter(prefix="/applications", tags=["Applications & Candidates"])

def evaluate_candidate_readiness(db: Session, sp, cand_match: Dict[str, Any]) -> Tuple[Optional[str], Optional[float], Optional[str]]:
    """Helper to check if active ML model exists and score candidate readiness."""
    active_model = db.query(TrainedModel).filter(TrainedModel.status == "active").first()
    if not active_model or not active_model.artifact_path:
        return None, None, None
        
    try:
        # Extract features
        scores = sp.assessment_scores or {}
        feat_dict = {
            "coding_score": float(scores.get("coding_score", 70.0)),
            "dsa_score": float(scores.get("dsa_score", 65.0)),
            "mock_interview_score": float(scores.get("mock_interview_score", 70.0)),
            "skill_coverage": float(cand_match.get("required_coverage", 70.0)),
            "project_count": float(len(sp.projects or [])),
            "experience_years": float(len(sp.experience or []) * 0.5),
            "system_design_score": float(scores.get("system_design_score", 60.0))
        }
        res = explain_prediction(active_model.artifact_path, feat_dict)
        return res["readiness_label"], res["pass_probability"], active_model.version
    except Exception:
        return None, None, None

@router.post("/express-interest")
def express_interest(
    req: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student expresses interest in an active job posting."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can apply or express interest in jobs.")
        
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")
        
    if job.status != "active":
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications.")
        
    # Check duplicate
    existing = db.query(Application).filter(
        Application.job_id == job.id,
        Application.student_id == current_user.id
    ).first()
    if existing:
        if existing.status == "Withdrawn":
            existing.status = "Interested"
            existing.applied_at = datetime.now(timezone.utc)
            db.commit()
            return {"message": "Application re-activated successfully."}
        raise HTTPException(status_code=400, detail="You have already expressed interest in this job.")
        
    sp = current_user.student_profile
    if not sp:
        raise HTTPException(status_code=400, detail="Please complete your student profile before applying.")
        
    # Compute transparent match
    cand_dict = {
        "headline": sp.headline,
        "bio": sp.bio,
        "skills": sp.skills or [],
        "projects": sp.projects or [],
        "experience": sp.experience or [],
        "resume_raw_text": sp.resume_raw_text or ""
    }
    match_res = match_candidate_to_job(cand_dict, {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or []
    })
    
    # ML readiness
    r_label, r_prob, r_version = evaluate_candidate_readiness(db, sp, match_res)
    
    now = datetime.now(timezone.utc)
    app = Application(
        job_id=job.id,
        student_id=current_user.id,
        status="Interested",
        match_score=match_res["overall_score"],
        required_coverage=match_res["required_coverage"],
        preferred_coverage=match_res["preferred_coverage"],
        text_similarity=match_res["text_similarity"],
        readiness_prediction=r_label,
        readiness_probability=r_prob,
        model_version_used=r_version,
        match_breakdown=match_res,
        recruiter_notes="",
        status_history=[{
            "status": "Interested",
            "timestamp": now.isoformat(),
            "note": "Candidate expressed interest in the position"
        }],
        applied_at=now
    )
    db.add(app)
    
    # Notify recruiter
    recruiter_notif = Notification(
        user_id=job.recruiter_id,
        title=f"New Candidate Interest: {job.title}",
        message=f"{current_user.full_name} has expressed interest in your job '{job.title}' with a {match_res['overall_score']}% match score.",
        notification_type="job_match",
        link=f"/recruiter/jobs/{job.id}/candidates"
    )
    db.add(recruiter_notif)
    
    db.commit()
    return {"message": "Interest expressed successfully.", "match_score": match_res["overall_score"]}

@router.post("/withdraw/{job_id}")
def withdraw_application(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student withdraws their interest."""
    app = db.query(Application).filter(
        Application.job_id == job_id,
        Application.student_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    app.status = "Withdrawn"
    history = list(app.status_history or [])
    history.append({
        "status": "Withdrawn",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Withdrawn by candidate"
    })
    app.status_history = history
    db.commit()
    return {"message": "Application withdrawn successfully."}

@router.get("/student/my-applications", response_model=List[ApplicationStudentResponse])
def get_student_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student views all their applications and current statuses (no recruiter notes)."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Student access only.")
        
    apps = db.query(Application).filter(Application.student_id == current_user.id).order_by(Application.applied_at.desc()).all()
    result = []
    for a in apps:
        j = a.job
        result.append(ApplicationStudentResponse(
            id=a.id,
            job_id=a.job_id,
            job_title=j.title if j else "Position",
            organization=j.organization if j else "Company",
            location=j.location if j else "Remote",
            work_mode=j.work_mode if j else "Hybrid",
            status=a.status,
            match_score=a.match_score,
            required_coverage=a.required_coverage,
            preferred_coverage=a.preferred_coverage,
            text_similarity=a.text_similarity,
            applied_at=a.applied_at,
            updated_at=a.updated_at,
            status_history=a.status_history or []
        ))
    return result

@router.get("/recruiter/job/{job_id}", response_model=List[ApplicationRecruiterResponse])
def get_job_candidates(
    job_id: int,
    status_filter: Optional[str] = None,
    sort_by: Optional[str] = "match_score", # "match_score" or "readiness" or "applied_at"
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Recruiter views and ranks all candidates who applied to their job.
    Includes full profile, skills, match breakdown, and confidential recruiter notes.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    query = db.query(Application).filter(Application.job_id == job_id)
    if status_filter:
        query = query.filter(Application.status == status_filter)
        
    apps = query.all()
    
    # Sort
    if sort_by == "readiness":
        apps.sort(key=lambda a: (a.readiness_probability or 0.0), reverse=True)
    elif sort_by == "applied_at":
        apps.sort(key=lambda a: a.applied_at, reverse=True)
    else:
        apps.sort(key=lambda a: a.match_score, reverse=True)
        
    result = []
    for a in apps:
        student = a.student
        sp = student.student_profile if student else None

        # Check if student has a resume_analysis report
        from app.models.report import Report
        resume_rep = db.query(Report).filter(
            Report.user_id == a.student_id,
            Report.report_type == "resume_analysis"
        ).first() if a.student_id else None

        result.append(ApplicationRecruiterResponse(
            id=a.id,
            job_id=a.job_id,
            student_id=a.student_id,
            student_name=student.full_name if student else "Candidate",
            student_email=student.email if student else "",
            student_headline=sp.headline if sp else "",
            location=sp.location if sp else "Remote",
            target_role=sp.target_role if sp else "Software Engineer",
            cgpa=sp.cgpa if sp else None,
            is_discoverable=sp.is_discoverable if sp else True,
            status=a.status,
            match_score=a.match_score,
            required_coverage=a.required_coverage,
            preferred_coverage=a.preferred_coverage,
            text_similarity=a.text_similarity,
            readiness_prediction=a.readiness_prediction,
            readiness_probability=a.readiness_probability,
            model_version_used=a.model_version_used,
            match_breakdown=a.match_breakdown or {},
            recruiter_notes=a.recruiter_notes or "",
            status_history=a.status_history or [],
            applied_at=a.applied_at,
            updated_at=a.updated_at,
            student_skills=sp.skills if sp else [],
            student_projects=sp.projects if sp else [],
            student_experience=sp.experience if sp else [],
            student_education=sp.education if sp else [],
            assessment_scores=sp.assessment_scores if sp else {},
            resume_parsed_data=sp.resume_parsed_data if sp else None,
            resume_filename=sp.resume_filename if sp else None,
            resume_report_id=resume_rep.id if resume_rep else None
        ))
    return result

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    req: ApplicationStatusUpdate,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Recruiter updates candidate application status, notes, and triggers an in-app candidate notification.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    job = app.job
    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    old_status = app.status
    app.status = req.status
    if req.recruiter_notes is not None:
        app.recruiter_notes = req.recruiter_notes
        
    now = datetime.now(timezone.utc)
    app.updated_at = now
    
    # Audit trail
    history = list(app.status_history or [])
    history.append({
        "status": req.status,
        "previous_status": old_status,
        "updated_by": current_user.full_name,
        "timestamp": now.isoformat(),
        "note": f"Recruiter changed recruitment status to {req.status}"
    })
    app.status_history = history
    
    # Send in-app notification to candidate
    msg = req.notification_message or f"Your application for '{job.title}' at {job.organization} has been updated to: {req.status}."
    cand_notif = Notification(
        user_id=app.student_id,
        title=f"Application Update: {req.status}",
        message=msg,
        notification_type="status_change",
        link=f"/student/jobs"
    )
    db.add(cand_notif)
    
    db.commit()
    return {"message": "Application status updated successfully."}

@router.get("/recruiter/compare")
def compare_candidates(
    app_ids: str = Query(..., description="Comma-separated application IDs, e.g. '1,2,3'"),
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Side-by-side comparison matrix for multiple candidates on a job."""
    id_list = [int(i.strip()) for i in app_ids.split(",") if i.strip().isdigit()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 candidate application IDs for comparison.")
        
    apps = db.query(Application).filter(Application.id.in_(id_list)).all()
    matrix = []
    
    for a in apps:
        student = a.student
        sp = student.student_profile if student else None
        job = a.job
        
        matrix.append({
            "application_id": a.id,
            "student_id": a.student_id,
            "student_name": student.full_name if student else "Candidate",
            "job_title": job.title if job else "",
            "match_score": a.match_score,
            "required_coverage": a.required_coverage,
            "preferred_coverage": a.preferred_coverage,
            "text_similarity": a.text_similarity,
            "readiness_prediction": a.readiness_prediction or "Advisory Model Uncalibrated",
            "readiness_probability": a.readiness_probability,
            "status": a.status,
            "verified_skills": [s["name"] for s in (sp.skills or []) if s.get("verified")],
            "all_skills_count": len(sp.skills or []),
            "projects_count": len(sp.projects or []),
            "coding_score": sp.assessment_scores.get("coding_score") if sp and sp.assessment_scores else None,
            "dsa_score": sp.assessment_scores.get("dsa_score") if sp and sp.assessment_scores else None
        })
        
    return {"candidates": matrix}
