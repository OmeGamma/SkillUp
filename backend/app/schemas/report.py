from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ReportCreate(BaseModel):
    report_type: str # "skill_gap", "resume_analysis", "candidate_readiness"
    title: str
    target_role_or_job: str
    overall_score: float
    summary: str
    methodology: str
    data: Dict[str, Any]

class ReportResponse(BaseModel):
    id: int
    user_id: int
    report_type: str
    title: str
    target_role_or_job: str
    overall_score: float
    summary: str
    methodology: str
    data: Dict[str, Any]
    pdf_filename: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    link: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool
