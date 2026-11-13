import base64
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.profile import StudentProfile
from app.routers.auth import get_current_user
from app.services.resume_parser import parse_resume
from app.services.skill_catalog import normalize_skill

router = APIRouter(prefix="/resume", tags=["Resume Processing"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Locally upload and extract resume text from PDF or DOCX.
    No external APIs are called.
    Returns extracted structured entities for candidate review and verification.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can upload resumes.")
        
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Only .pdf and .docx files are supported."
        )
        
    # Read file directly into memory - DO NOT store file on local disk
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")
        
    # Parse in-memory locally with zero disk persistence
    try:
        parsed_data = parse_resume(contents, filename=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
        
    sp = current_user.student_profile
    if not sp:
        sp = StudentProfile(user_id=current_user.id)
        db.add(sp)
        
    sp.resume_filename = file.filename
    sp.resume_file_path = None  # No local file stored
    sp.resume_raw_text = parsed_data.get("raw_text", "")
    sp.resume_parsed_data = parsed_data
    
    # If student didn't have phone or links, populate from contact
    contact = parsed_data.get("contact", {})
    if not sp.phone and contact.get("phone"):
        sp.phone = contact["phone"]
    if not sp.github_url and contact.get("github"):
        sp.github_url = contact["github"]
    if not sp.linkedin_url and contact.get("linkedin"):
        sp.linkedin_url = contact["linkedin"]
        
    from app.routers.profile import calculate_completeness
    sp.completeness_score = calculate_completeness(sp)

    # Persist or update Candidate Dossier Report in MongoDB, accessible by candidate & interviewers
    from app.models.report import Report
    report = db.query(Report).filter(
        Report.user_id == current_user.id,
        Report.report_type == "resume_analysis"
    ).first()

    candidate_display_name = parsed_data.get("candidate_name") or current_user.full_name
    report_summary = (
        f"Extracted intelligence profile for {candidate_display_name}. "
        f"Contains {len(parsed_data.get('skills', []))} extracted technical/domain skills, "
        f"{len(parsed_data.get('projects', []))} validated projects, and education credentials. "
        "Processed in-memory with zero local file retention, stored securely in MongoDB for candidate and interviewer access."
    )
    report_data = {
        "candidate_name": candidate_display_name,
        "email": contact.get("email") or current_user.email,
        "phone": sp.phone,
        "github_url": sp.github_url,
        "linkedin_url": sp.linkedin_url,
        "skills": parsed_data.get("skills", []),
        "education": parsed_data.get("education", []),
        "projects": parsed_data.get("projects", []),
        "sections": parsed_data.get("sections", {}),
        "raw_text_preview": parsed_data.get("raw_text", "")[:4000],
        "uploaded_filename": file.filename,
        "storage_mode": "mongodb_document",
        "resume_file_base64": base64.b64encode(contents).decode("utf-8"),
        "accessible_by_interviewers": True
    }

    if not report:
        report = Report(
            user_id=current_user.id,
            report_type="resume_analysis",
            title=f"Resume & Profile Dossier: {candidate_display_name}",
            target_role_or_job=sp.target_role or "Software Engineering",
            overall_score=float(sp.completeness_score or 75.0),
            summary=report_summary,
            methodology="In-Memory Local Document Parsing & Skill Catalog Taxonomy Normalization",
            data=report_data
        )
        db.add(report)
    else:
        report.title = f"Resume & Profile Dossier: {candidate_display_name}"
        report.target_role_or_job = sp.target_role or "Software Engineering"
        report.overall_score = float(sp.completeness_score or 75.0)
        report.summary = report_summary
        report.data = report_data

    db.commit()
    db.refresh(sp)
    db.refresh(report)
    
    return {
        "message": "Resume analyzed in-memory and saved to candidate reports for interviewers.",
        "filename": file.filename,
        "report_id": report.id,
        "extracted_data": parsed_data,
        "action_required": "Please review, edit, and confirm the extracted entities to commit them to your active profile and dossier."
    }

@router.post("/confirm-extraction")
def confirm_extracted_data(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allow candidate to review, correct, and commit extracted skills, projects, and education.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can perform this action.")
        
    sp = current_user.student_profile
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")
        
    confirmed_skills = payload.get("skills", [])
    confirmed_education = payload.get("education", [])
    confirmed_projects = payload.get("projects", [])
    
    # Merge existing skills with new confirmed ones (deduplicating by canonical name)
    existing_skills_map = {s["name"].lower(): s for s in (sp.skills or [])}
    for s in confirmed_skills:
        name = normalize_skill(s.get("name", ""))
        existing_skills_map[name.lower()] = {
            "name": name,
            "category": s.get("category", "Technical"),
            "source": s.get("source", "resume"),
            "verified": s.get("verified", False),
            "level": s.get("level", "intermediate")
        }
    sp.skills = list(existing_skills_map.values())
    
    # Update education if provided
    if confirmed_education:
        sp.education = confirmed_education
        
    # Append new projects
    if confirmed_projects:
        existing_proj_titles = {p["title"].lower() for p in (sp.projects or [])}
        for p in confirmed_projects:
            if p["title"].lower() not in existing_proj_titles:
                sp.projects.append(p)
                
    # Recalculate completeness
    from app.routers.profile import calculate_completeness
    sp.completeness_score = calculate_completeness(sp)
    
    # Synchronize confirmed skills and projects with the Candidate Dossier Report in MongoDB
    from app.models.report import Report
    report = db.query(Report).filter(
        Report.user_id == current_user.id,
        Report.report_type == "resume_analysis"
    ).first()
    if report and isinstance(report.data, dict):
        new_data = dict(report.data)
        new_data["skills"] = sp.skills
        new_data["projects"] = sp.projects
        new_data["education"] = sp.education
        new_data["confirmed_at_profile"] = True
        report.data = new_data
        report.overall_score = float(sp.completeness_score)
    
    db.commit()
    db.refresh(sp)
    if report:
        db.refresh(report)
    
    return {
        "message": "Extracted resume information verified and committed to profile and interviewer reports.",
        "skills_count": len(sp.skills),
        "projects_count": len(sp.projects),
        "completeness_score": sp.completeness_score,
        "report_id": report.id if report else None
    }
