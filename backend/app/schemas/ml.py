from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

class TrainModelRequest(BaseModel):
    algorithm: str = "LogisticRegression" # "LogisticRegression" or "RandomForestClassifier"
    target_column: str = "technical_interview_pass"
    feature_columns: Optional[List[str]] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    version_tag: Optional[str] = None
    dataset_name: Optional[str] = "demo_readiness_dataset.csv"

class FairnessAuditRequest(BaseModel):
    model_id: int
    group_attribute: str = "education_tier" # or "gender_audit"
    dataset_name: Optional[str] = "demo_readiness_dataset.csv"

class PredictCandidateRequest(BaseModel):
    candidate_id: Optional[int] = None
    features: Optional[Dict[str, float]] = None # custom feature values if testing
    job_id: Optional[int] = None

class TrainedModelResponse(BaseModel):
    id: int
    name: str
    version: str
    algorithm: str
    target: str
    features: List[str]
    metrics: Dict[str, Any]
    hyperparameters: Dict[str, Any]
    dataset_info: Dict[str, Any]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
