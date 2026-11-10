from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Interested|Under Review|Shortlisted|Interview Scheduled|Interview Completed|Selected|Not Selected|Withdrawn)$")
    recruiter_notes: Optional[str] = None
    notification_message: Optional[str] = None # Optional message to notify candidate

class ApplicationStudentResponse(BaseModel):
    id: int
    job_id: int
    job_title: str
    organization: str
    location: str
    work_mode: str
    status: str
    match_score: float
    required_coverage: float
    preferred_coverage: float
    text_similarity: float
    applied_at: datetime
    updated_at: datetime
    status_history: List[Dict[str, Any]]

class ApplicationRecruiterResponse(BaseModel):
    id: int
    job_id: int
    student_id: int
    student_name: str
    student_email: str
    student_headline: str
    location: str
    target_role: str
    cgpa: Optional[float]
    is_discoverable: bool
    status: str
    match_score: float
    required_coverage: float
    preferred_coverage: float
    text_similarity: float
    readiness_prediction: Optional[str]
    readiness_probability: Optional[float]
    model_version_used: Optional[str]
    match_breakdown: Dict[str, Any]
    recruiter_notes: str # Visible ONLY to recruiters
    status_history: List[Dict[str, Any]]
    applied_at: datetime
    updated_at: datetime
    student_skills: List[Dict[str, Any]]
    student_projects: List[Dict[str, Any]]
    student_experience: List[Dict[str, Any]]
    student_education: List[Dict[str, Any]]
    assessment_scores: Dict[str, Any]
    resume_parsed_data: Optional[Dict[str, Any]] = None
    resume_filename: Optional[str] = None
    resume_report_id: Optional[int] = None
