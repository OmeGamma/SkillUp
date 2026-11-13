from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.profile import StudentProfile, RecruiterProfile
from app.schemas.profile import StudentProfileUpdate, RecruiterProfileUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profiles"])

def calculate_completeness(sp: StudentProfile) -> int:
    score = 15 # Base registration
    if sp.headline and len(sp.headline) > 5:
        score += 10
    if sp.bio and len(sp.bio) > 20:
        score += 10
    if sp.skills and len(sp.skills) >= 3:
        score += 20
    elif sp.skills and len(sp.skills) > 0:
        score += 10
    if sp.projects and len(sp.projects) >= 1:
        score += 15
    if sp.education and len(sp.education) >= 1:
        score += 10
    if sp.experience and len(sp.experience) >= 1:
        score += 10
    if sp.resume_filename:
        score += 10
    return min(100, score)

@router.get("/student")
def get_student_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this student profile endpoint.")
        
    sp = current_user.student_profile
    if not sp:
        sp = StudentProfile(user_id=current_user.id)
        db.add(sp)
        db.commit()
        db.refresh(sp)
        
    return {
        "id": sp.id,
        "user_id": sp.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "headline": sp.headline,
        "bio": sp.bio,
        "phone": sp.phone,
        "location": sp.location,
        "target_role": sp.target_role,
        "cgpa": sp.cgpa,
        "is_discoverable": sp.is_discoverable,
        "portfolio_url": sp.portfolio_url,
        "github_url": sp.github_url,
        "linkedin_url": sp.linkedin_url,
        "education": sp.education or [],
        "skills": sp.skills or [],
        "projects": sp.projects or [],
        "experience": sp.experience or [],
        "certifications": sp.certifications or [],
        "assessment_scores": sp.assessment_scores or {},
        "resume_filename": sp.resume_filename,
        "completeness_score": sp.completeness_score
    }

@router.put("/student")
def update_student_profile(update_data: StudentProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can update this profile.")
        
    sp = current_user.student_profile
    if not sp:
        sp = StudentProfile(user_id=current_user.id)
        db.add(sp)
        
    # Apply updates
    fields = update_data.model_dump(exclude_unset=True)
    for field, val in fields.items():
        setattr(sp, field, val)
        
    sp.completeness_score = calculate_completeness(sp)
    db.commit()
    db.refresh(sp)
    
    return {
        "message": "Profile updated successfully.",
        "completeness_score": sp.completeness_score
    }

@router.get("/recruiter")
def get_recruiter_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Recruiter access only.")
        
    rp = current_user.recruiter_profile
    if not rp:
        rp = RecruiterProfile(user_id=current_user.id)
        db.add(rp)
        db.commit()
        db.refresh(rp)
        
    return {
        "id": rp.id,
        "user_id": rp.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "organization": rp.organization,
        "designation": rp.designation,
        "department": rp.department,
        "website": rp.website,
        "bio": rp.bio,
        "location": rp.location
    }

@router.put("/recruiter")
def update_recruiter_profile(update_data: RecruiterProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Recruiter access only.")
        
    rp = current_user.recruiter_profile
    if not rp:
        rp = RecruiterProfile(user_id=current_user.id)
        db.add(rp)
        
    fields = update_data.model_dump(exclude_unset=True)
    for field, val in fields.items():
        setattr(rp, field, val)
        
    db.commit()
    return {"message": "Recruiter profile updated successfully."}
