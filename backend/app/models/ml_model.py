from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TrainedModel(Base):
    __tablename__ = "trained_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False) # e.g. "SkillUp Readiness Predictor"
    version = Column(String(50), nullable=False, unique=True) # e.g. "v1.0.0"
    algorithm = Column(String(100), nullable=False) # "LogisticRegression", "RandomForestClassifier", "GradientBoostingClassifier"
    target = Column(String(100), nullable=False, default="technical_interview_pass")
    
    # Feature list used during training
    features = Column(JSON, default=list, nullable=False)
    
    # Evaluation metrics
    # {accuracy: float, precision: float, recall: float, f1: float, roc_auc: float, pr_auc: float, confusion_matrix: list, cv_mean_f1: float}
    metrics = Column(JSON, default=dict, nullable=False)
    
    # Hyperparameters
    hyperparameters = Column(JSON, default=dict)
    
    # Local artifact file path (.joblib)
    artifact_path = Column(String(500), nullable=False)
    
    # Dataset information and validation report
    # {dataset_name: str, total_samples: int, train_samples: int, test_samples: int, class_distribution: dict, is_synthetic: bool, warnings: list}
    dataset_info = Column(JSON, default=dict, nullable=False)
    
    # Model status: "active", "candidate", "archived"
    # Exactly one model can be active at a time for predictions
    status = Column(String(50), default="candidate", nullable=False)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    creator = relationship("User", back_populates="models_created")
    audits = relationship("FairnessAuditLog", back_populates="model", cascade="all, delete-orphan")
