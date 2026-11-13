from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class EducationItem(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_year: int
    end_year: Optional[int] = None
    grade: Optional[str] = None

class SkillItem(BaseModel):
    name: str
    category: Optional[str] = "Technical"
    source: Optional[str] = "self" # "resume", "self", "project", "assessment"
    verified: Optional[bool] = False
    level: Optional[str] = "intermediate"

class ProjectItem(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    github_url: Optional[str] = None
    link: Optional[str] = None
    role: Optional[str] = None
    outcome: Optional[str] = None

class ExperienceItem(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: Optional[str] = "Present"
    description: str
    technologies: List[str] = []

class CertificationItem(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[str] = None
    credential_id: Optional[str] = None
    url: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    target_role: Optional[str] = None
    cgpa: Optional[float] = None
    is_discoverable: Optional[bool] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    education: Optional[List[EducationItem]] = None
    skills: Optional[List[SkillItem]] = None
    projects: Optional[List[ProjectItem]] = None
    experience: Optional[List[ExperienceItem]] = None
    certifications: Optional[List[CertificationItem]] = None
    assessment_scores: Optional[Dict[str, int]] = None

class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    headline: str
    bio: str
    phone: Optional[str]
    location: str
    target_role: str
    cgpa: Optional[float]
    is_discoverable: bool
    portfolio_url: Optional[str]
    github_url: Optional[str]
    linkedin_url: Optional[str]
    education: List[Dict[str, Any]]
    skills: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    assessment_scores: Dict[str, Any]
    resume_filename: Optional[str]
    completeness_score: int

class RecruiterProfileUpdate(BaseModel):
    organization: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
