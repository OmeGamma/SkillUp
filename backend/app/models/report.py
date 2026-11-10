from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    report_type = Column(String(50), nullable=False) # "skill_gap", "resume_analysis", "candidate_readiness", "recruiter_ranking"
    title = Column(String(255), nullable=False)
    target_role_or_job = Column(String(255), nullable=False)
    
    overall_score = Column(Float, default=0.0)
    summary = Column(Text, nullable=False)
    methodology = Column(Text, nullable=False)
    
    # Detailed structured payload
    # includes: required_coverage, preferred_coverage, text_similarity, evidence_breakdown,
    # prioritized_gaps, learning_activities, project_suggestions, shap_values (if any), warnings
    data = Column(JSON, default=dict, nullable=False)
    
    pdf_filename = Column(String(255), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="reports")
