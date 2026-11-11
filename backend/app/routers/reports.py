import base64
import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.routers.auth import get_current_user
from app.services.pdf_generator import generate_skill_report_pdf
from app.services.mongodb_service import mongodb_service

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.post("", response_model=ReportResponse)
def create_report(
    req: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist an intelligence evaluation report."""
    report = Report(
        user_id=current_user.id,
        report_type=req.report_type,
        title=req.title,
        target_role_or_job=req.target_role_or_job,
        overall_score=req.overall_score,
        summary=req.summary,
        methodology=req.methodology,
        data=req.data
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

@router.get("", response_model=List[ReportResponse])
def get_user_reports(
    report_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve persisted reports for the authenticated user."""
    query = db.query(Report).filter(Report.user_id == current_user.id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    reports = query.order_by(Report.created_at.desc()).all()
    return reports

@router.get("/candidate/{candidate_id}", response_model=List[ReportResponse])
def get_candidate_reports(
    candidate_id: int,
    report_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve candidate intelligence reports (accessible by candidate, interviewers, recruiters, and admins)."""
    if current_user.role not in ["admin", "recruiter"] and current_user.id != candidate_id:
        raise HTTPException(status_code=403, detail="Access restricted to candidate, interviewers, or admins.")
        
    query = db.query(Report).filter(Report.user_id == candidate_id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    return query.order_by(Report.created_at.desc()).all()

@router.get("/{report_id}", response_model=ReportResponse)
def get_report_detail(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a single report by ID (accessible by candidate, interviewers/recruiters, and admins)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
        
    # Enforce ownership, admin, or interviewer/recruiter access
    if current_user.role not in ["admin", "recruiter"] and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this report.")
        
    return report

@router.get("/{report_id}/download-pdf")
def download_report_pdf(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download executive PDF report generated in-memory via ReportLab with zero local disk storage."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
        
    if current_user.role not in ["admin", "recruiter"] and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this report.")
        
    candidate_user = db.query(User).filter(User.id == report.user_id).first()
    cand_name = (report.data.get("candidate_name") if isinstance(report.data, dict) else None) or (candidate_user.full_name if candidate_user else current_user.full_name)
    
    download_filename = f"SkillUp_{report.target_role_or_job.replace(' ', '_')}_Report.pdf"
    payload = {
        "title": report.title,
        "target_role_or_job": report.target_role_or_job,
        "candidate_name": cand_name,
        "overall_score": report.overall_score,
        "created_at": report.created_at.strftime("%B %d, %Y"),
        "data": report.data or {}
    }
    
    # Generate directly in-memory (bytes) with zero local file retention
    pdf_bytes = generate_skill_report_pdf(payload)
    
    # Store metadata and base64 in MongoDB
    report.pdf_filename = download_filename
    report.pdf_path = None
    if isinstance(report.data, dict):
        report.data["pdf_generated"] = True
        report.data["pdf_base64"] = base64.b64encode(pdf_bytes).decode("utf-8")
    db.commit()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"'
        }
    )

@router.get("/mongodb/status")
def get_mongodb_status():
    """Retrieve MongoDB connection status and persisted collections statistics."""
    return mongodb_service.get_status()

@router.post("/mongodb/sync-all")
def sync_reports_to_mongodb(
    current_user: User = Depends(get_current_user),
):
    """Retained for API compatibility; reports now persist directly to MongoDB."""
    return {
        "success": True,
        "message": "Reports are already stored directly in MongoDB.",
        "synced_count": 0,
    }

@router.get("/compare/analyses")
def compare_analyses(
    report_id_1: int = Query(...),
    report_id_2: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two previous reports to illustrate skill progression over time."""
    r1 = db.query(Report).filter(Report.id == report_id_1).first()
    r2 = db.query(Report).filter(Report.id == report_id_2).first()
    
    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both reports not found.")
        
    if current_user.role != "admin" and (r1.user_id != current_user.id or r2.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return {
        "baseline": {
            "id": r1.id,
            "title": r1.title,
            "date": r1.created_at,
            "overall_score": r1.overall_score,
            "required_coverage": r1.data.get("required_coverage", 0),
            "preferred_coverage": r1.data.get("preferred_coverage", 0),
            "text_similarity": r1.data.get("text_similarity", 0)
        },
        "comparison": {
            "id": r2.id,
            "title": r2.title,
            "date": r2.created_at,
            "overall_score": r2.overall_score,
            "required_coverage": r2.data.get("required_coverage", 0),
            "preferred_coverage": r2.data.get("preferred_coverage", 0),
            "text_similarity": r2.data.get("text_similarity", 0)
        },
        "score_delta": round(r2.overall_score - r1.overall_score, 1),
        "progression_summary": f"Overall score {'improved' if r2.overall_score >= r1.overall_score else 'shifted'} by {round(abs(r2.overall_score - r1.overall_score), 1)} points."
    }
