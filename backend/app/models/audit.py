from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FairnessAuditLog(Base):
    __tablename__ = "fairness_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("trained_models.id", ondelete="CASCADE"), nullable=False, index=True)
    
    group_attribute = Column(String(100), nullable=False) # e.g. "education_tier", "experience_level", "gender_proxy_audit"
    
    # Audit metrics:
    # {
    #   groups: {group_name: {count: int, positive_rate: float, tpr: float, fpr: float}},
    #   disparate_impact_ratio: float,
    #   equal_opportunity_difference: float,
    #   average_odds_difference: float
    # }
    metrics = Column(JSON, default=dict, nullable=False)
    
    # Validation & sample size warnings
    warnings = Column(JSON, default=list, nullable=False)
    
    audited_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    model = relationship("TrainedModel", back_populates="audits")
