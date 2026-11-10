from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3)
    organization: str = Field(..., min_length=2)
    department: Optional[str] = None
    description: str = Field(..., min_length=10)
    required_skills: List[str] = Field(..., min_length=1)
    preferred_skills: Optional[List[str]] = []
    min_experience_years: Optional[float] = 0.0
    education_level: Optional[str] = "Bachelor's in CS / IT / Engineering"
    location: Optional[str] = "Bangalore, India"
    work_mode: Optional[str] = "Hybrid" # "Remote", "Hybrid", "On-site"
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = "active" # "active", "draft", "closed"
    is_demo: Optional[bool] = False

class JobUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience_years: Optional[float] = None
    education_level: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    recruiter_id: int
    title: str
    organization: str
    department: Optional[str]
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    min_experience_years: float
    education_level: Optional[str]
    location: str
    work_mode: str
    salary_range: Optional[str]
    deadline: Optional[datetime]
    status: str
    is_demo: bool
    created_at: datetime
    application_count: Optional[int] = 0
    student_interest_status: Optional[str] = None # Filled when requested by a student
    match_score: Optional[float] = None # Calculated for student view

    class Config:
        from_attributes = True
