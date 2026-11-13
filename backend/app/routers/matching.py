from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.skill_catalog import PREDEFINED_ROLES
from app.services.matcher import match_candidate_to_job

router = APIRouter(prefix="/matching", tags=["Skill Matching & Gap Analysis"])

@router.get("/roles")
def get_catalog_roles():
    """Return catalog of standardized benchmark industry roles with descriptions and skills."""
    roles_list = []
    for role_name, details in PREDEFINED_ROLES.items():
        roles_list.append({
            "role_name": role_name,
            "description": details["description"],
            "required_skills": details["required_skills"],
            "preferred_skills": details["preferred_skills"],
            "learning_pathway": details["learning_pathway"],
            "project_recommendations": details["project_recommendations"]
        })
    return roles_list

@router.post("/analyze-role")
def analyze_predefined_role(
    role_name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze student profile against a predefined benchmark role."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Student access only.")
        
    if role_name not in PREDEFINED_ROLES:
        raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found in role catalog.")
        
    sp = current_user.student_profile
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")
        
    role_info = PREDEFINED_ROLES[role_name]
    
    cand_profile_dict = {
        "headline": sp.headline,
        "bio": sp.bio,
        "skills": sp.skills or [],
        "projects": sp.projects or [],
        "experience": sp.experience or [],
        "resume_raw_text": sp.resume_raw_text or ""
    }
    
    job_req_dict = {
        "title": role_name,
        "description": role_info["description"],
        "required_skills": role_info["required_skills"],
        "preferred_skills": role_info["preferred_skills"]
    }
    
    result = match_candidate_to_job(cand_profile_dict, job_req_dict)
    
    # Merge catalog learning pathway
    result["curated_pathway"] = role_info.get("learning_pathway", [])
    result["curated_project_ideas"] = role_info.get("project_recommendations", [])
    result["role_name"] = role_name
    
    return result

@router.post("/analyze-custom")
def analyze_custom_description(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze student profile against any recruiter job posting or custom JD text.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Student access only.")
        
    sp = current_user.student_profile
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")
        
    cand_profile_dict = {
        "headline": sp.headline,
        "bio": sp.bio,
        "skills": sp.skills or [],
        "projects": sp.projects or [],
        "experience": sp.experience or [],
        "resume_raw_text": sp.resume_raw_text or ""
    }
    
    job_req_dict = {
        "title": payload.get("title", "Custom Position"),
        "description": payload.get("description", ""),
        "required_skills": payload.get("required_skills", []),
        "preferred_skills": payload.get("preferred_skills", [])
    }
    
    result = match_candidate_to_job(cand_profile_dict, job_req_dict)
    return result
