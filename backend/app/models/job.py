from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    
    # Normalized skill lists
    required_skills = Column(JSON, default=list, nullable=False)   # e.g. ["Python", "FastAPI", "PostgreSQL", "Docker"]
    preferred_skills = Column(JSON, default=list, nullable=False)  # e.g. ["AWS", "Redis", "Kubernetes", "CI/CD"]
    
    # Requirements
    min_experience_years = Column(Float, default=0.0)
    education_level = Column(String(100), default="Bachelor's in Engineering or related")
    
    location = Column(String(100), default="Bangalore / Remote")
    work_mode = Column(String(50), default="Hybrid") # "Remote", "Hybrid", "On-site"
    salary_range = Column(String(100), nullable=True)
    deadline = Column(DateTime, nullable=True)
    
    status = Column(String(50), default="active", nullable=False) # "active", "draft", "closed"
    is_demo = Column(Boolean, default=False, nullable=False) # Clearly labeled demonstration postings
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
