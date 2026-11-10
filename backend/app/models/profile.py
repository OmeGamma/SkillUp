from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    headline = Column(String(255), default="Aspiring Software Engineer")
    bio = Column(Text, default="")
    phone = Column(String(50), nullable=True)
    location = Column(String(100), default="Bangalore, India")
    target_role = Column(String(100), default="Full Stack Developer")
    
    # CGPA is optional
    cgpa = Column(Float, nullable=True)
    
    # Discoverability control
    is_discoverable = Column(Boolean, default=True, nullable=False)
    
    # Portfolio & links
    portfolio_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    
    # JSON-structured details
    # Education: list of {institution, degree, field_of_study, start_year, end_year, grade}
    education = Column(JSON, default=list)
    
    # Skills: list of {name, category, source ("resume" | "self" | "project" | "assessment"), verified: bool, level: str}
    skills = Column(JSON, default=list)
    
    # Projects: list of {title, description, technologies: [], link, github_url, role, outcome}
    projects = Column(JSON, default=list)
    
    # Experience / Internships: list of {company, role, start_date, end_date, description, technologies: []}
    experience = Column(JSON, default=list)
    
    # Certifications: list of {name, issuer, issue_date, credential_id, url}
    certifications = Column(JSON, default=list)
    
    # Technical Assessments: {coding_score: int, dsa_score: int, mock_interview_score: int, system_design_score: int}
    assessment_scores = Column(JSON, default=dict)
    
    # Resume storage metadata
    resume_filename = Column(String(255), nullable=True)
    resume_file_path = Column(String(500), nullable=True)
    resume_raw_text = Column(Text, nullable=True)
    resume_parsed_data = Column(JSON, default=dict)
    
    # Profile completeness (0-100)
    completeness_score = Column(Integer, default=20)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="student_profile")


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    organization = Column(String(255), nullable=False, default="Tech Innovations Inc")
    designation = Column(String(255), nullable=False, default="Technical Talent Partner")
    department = Column(String(255), nullable=True, default="Engineering Recruiting")
    website = Column(String(255), nullable=True, default="https://example.com")
    bio = Column(Text, default="")
    location = Column(String(100), default="Remote / Hybrid")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="recruiter_profile")
