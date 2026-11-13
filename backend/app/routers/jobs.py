from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.routers.auth import get_optional_user, require_role
from app.services.skill_catalog import normalize_skill_list
from app.services.matcher import match_candidate_to_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def get_jobs(
    q: Optional[str] = None,
    work_mode: Optional[str] = None,
    status_filter: Optional[str] = "active",
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    List real database job postings with search, filter, and candidate matching scores.
    """
    query = db.query(Job)
    
    # If recruiter, they can see drafts; others only see active
    if not current_user or current_user.role != "recruiter":
        query = query.filter(Job.status == "active")
    elif status_filter:
        query = query.filter(Job.status == status_filter)
        
    if work_mode:
        query = query.filter(Job.work_mode == work_mode)
        
    if q:
        search_pattern = f"%{q.lower()}%"
        query = query.filter(
            (Job.title.ilike(search_pattern)) |
            (Job.organization.ilike(search_pattern)) |
            (Job.description.ilike(search_pattern))
        )
        
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    
    # If student is viewing, compute match scores and interest status
    result = []
    student_profile_dict = None
    applied_jobs_map = {}
    
    if current_user and current_user.role == "student" and current_user.student_profile:
        sp = current_user.student_profile
        student_profile_dict = {
            "headline": sp.headline,
            "bio": sp.bio,
            "skills": sp.skills or [],
            "projects": sp.projects or [],
            "experience": sp.experience or [],
            "resume_raw_text": sp.resume_raw_text or ""
        }
        # Get existing applications
        apps = db.query(Application).filter(Application.student_id == current_user.id).all()
        applied_jobs_map = {a.job_id: a.status for a in apps}
        
    for j in jobs:
        resp = JobResponse.model_validate(j)
        resp.application_count = len(j.applications)
        
        if student_profile_dict:
            resp.student_interest_status = applied_jobs_map.get(j.id)
            match_res = match_candidate_to_job(student_profile_dict, {
                "title": j.title,
                "description": j.description,
                "required_skills": j.required_skills or [],
                "preferred_skills": j.preferred_skills or []
            })
            resp.match_score = match_res["overall_score"]
            
        result.append(resp)
        
    return result

@router.get("/recruiter/my-jobs", response_model=List[JobResponse])
def get_recruiter_jobs(
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve jobs created by the authenticated recruiter."""
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc()).all()
    result = []
    for j in jobs:
        resp = JobResponse.model_validate(j)
        resp.application_count = len(j.applications)
        result.append(resp)
    return result

@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(
    job_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get job details and candidate-specific match info."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")
        
    resp = JobResponse.model_validate(job)
    resp.application_count = len(job.applications)
    
    if current_user and current_user.role == "student" and current_user.student_profile:
        sp = current_user.student_profile
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
        resp.match_score = match_res["overall_score"]
        
        app = db.query(Application).filter(
            Application.job_id == job.id,
            Application.student_id == current_user.id
        ).first()
        if app:
            resp.student_interest_status = app.status
            
    return resp

@router.post("", response_model=JobResponse)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Create and publish a new job posting."""
    req_skills = normalize_skill_list(job_in.required_skills)
    pref_skills = normalize_skill_list(job_in.preferred_skills or [])
    
    job = Job(
        recruiter_id=current_user.id,
        title=job_in.title.strip(),
        organization=job_in.organization.strip(),
        department=job_in.department,
        description=job_in.description.strip(),
        required_skills=req_skills,
        preferred_skills=pref_skills,
        min_experience_years=job_in.min_experience_years or 0.0,
        education_level=job_in.education_level,
        location=job_in.location or "Remote",
        work_mode=job_in.work_mode or "Hybrid",
        salary_range=job_in.salary_range,
        deadline=job_in.deadline,
        status=job_in.status or "active",
        is_demo=job_in.is_demo or False
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    resp = JobResponse.model_validate(job)
    resp.application_count = 0
    return resp

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Update job posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own job postings.")
        
    fields = job_in.model_dump(exclude_unset=True)
    if "required_skills" in fields and fields["required_skills"]:
        fields["required_skills"] = normalize_skill_list(fields["required_skills"])
    if "preferred_skills" in fields and fields["preferred_skills"]:
        fields["preferred_skills"] = normalize_skill_list(fields["preferred_skills"])
        
    for k, v in fields.items():
        setattr(job, k, v)
        
    db.commit()
    db.refresh(job)
    
    resp = JobResponse.model_validate(job)
    resp.application_count = len(job.applications)
    return resp

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Delete a job posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own job postings.")
        
    db.delete(job)
    db.commit()
    return {"message": "Job posting deleted successfully."}
