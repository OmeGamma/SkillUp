from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.ml_model import TrainedModel
from app.routers.auth import require_role

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.get("/stats")
def get_system_stats(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve actual production metrics across users, postings, and models."""
    student_count = db.query(User).filter(User.role == "student").count()
    recruiter_count = db.query(User).filter(User.role == "recruiter").count()
    pending_recruiters = db.query(User).filter(
        User.role == "recruiter",
        User.recruiter_status == "pending"
    ).count()
    job_count = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "active").count()
    applications_count = db.query(Application).count()
    models_count = db.query(TrainedModel).count()
    active_model = db.query(TrainedModel).filter(TrainedModel.status == "active").first()
    
    return {
        "total_students": student_count,
        "total_recruiters": recruiter_count,
        "pending_recruiter_approvals": pending_recruiters,
        "total_jobs": job_count,
        "active_jobs": active_jobs,
        "total_applications": applications_count,
        "total_models": models_count,
        "active_model_version": active_model.version if active_model else "None",
        "active_model_algorithm": active_model.algorithm if active_model else "None"
    }

@router.get("/recruiters")
def list_recruiters(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """List all recruiter accounts with their onboarding approval status."""
    recruiters = db.query(User).filter(User.role == "recruiter").all()
    result = []
    for r in recruiters:
        rp = r.recruiter_profile
        result.append({
            "id": r.id,
            "email": r.email,
            "full_name": r.full_name,
            "recruiter_status": r.recruiter_status,
            "is_active": r.is_active,
            "organization": rp.organization if rp else "Not Specified",
            "designation": rp.designation if rp else "Recruiter",
            "department": rp.department if rp else "",
            "created_at": r.created_at
        })
    return result

@router.put("/recruiters/{user_id}/status")
def update_recruiter_status(
    user_id: int,
    status: str = Body(..., embed=True, pattern="^(approved|rejected|pending)$"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin approves or rejects a recruiter account."""
    user = db.query(User).filter(User.id == user_id, User.role == "recruiter").first()
    if not user:
        raise HTTPException(status_code=404, detail="Recruiter user not found.")
        
    user.recruiter_status = status
    db.commit()
    return {"message": f"Recruiter {user.full_name} status updated to {status}."}
