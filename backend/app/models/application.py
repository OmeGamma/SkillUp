from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "student_id", name="uq_job_student_application"),
    )

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status lifecycle
    # "Interested", "Under Review", "Shortlisted", "Interview Scheduled", "Interview Completed", "Selected", "Not Selected", "Withdrawn"
    status = Column(String(50), default="Interested", nullable=False)
    
    # Computed match metrics
    match_score = Column(Float, default=0.0) # Transparent composite match percentage
    required_coverage = Column(Float, default=0.0)
    preferred_coverage = Column(Float, default=0.0)
    text_similarity = Column(Float, default=0.0)
    
    # ML readiness prediction (null if no active model)
    readiness_prediction = Column(String(50), nullable=True) # "High Readiness", "Moderate Readiness", "Development Needed"
    readiness_probability = Column(Float, nullable=True)
    model_version_used = Column(String(50), nullable=True)
    
    # Detailed match breakdown (cached JSON)
    match_breakdown = Column(JSON, default=dict)
    
    # Confidential notes for recruiters ONLY (never serialized to student responses)
    recruiter_notes = Column(Text, default="")
    
    # Status audit log: list of {status, timestamp, updated_by_id, note}
    status_history = Column(JSON, default=list)

    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    job = relationship("Job", back_populates="applications")
    student = relationship("User", back_populates="applications")
