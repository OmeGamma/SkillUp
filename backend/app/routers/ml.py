from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.ml_model import TrainedModel
from app.schemas.ml import (
    TrainModelRequest, PredictCandidateRequest, TrainedModelResponse
)
from app.routers.auth import get_current_user, require_role
from app.services.ml_service import (
    generate_demonstration_dataset, validate_dataset,
    train_and_evaluate_model, explain_prediction, DEFAULT_FEATURE_COLS
)

router = APIRouter(prefix="/ml", tags=["Machine Learning & Explainability"])

@router.get("/models", response_model=List[TrainedModelResponse])
def get_models(
    current_user: User = Depends(require_role(["admin", "recruiter"])),
    db: Session = Depends(get_db)
):
    """List all registered models and their evaluation metrics."""
    models = db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).all()
    return models

@router.get("/active-model")
def get_active_model(
    db: Session = Depends(get_db)
):
    """Retrieve currently active model for inference."""
    active = db.query(TrainedModel).filter(TrainedModel.status == "active").first()
    if not active:
        return {
            "has_active_model": False,
            "message": "No evaluated machine learning model is currently activated. Predictions are labeled unavailable."
        }
    return {
        "has_active_model": True,
        "model": {
            "id": active.id,
            "name": active.name,
            "version": active.version,
            "algorithm": active.algorithm,
            "target": active.target,
            "metrics": active.metrics,
            "dataset_info": active.dataset_info
        }
    }

@router.post("/dataset/generate-demo")
def generate_demo_data(
    num_samples: int = Query(600, ge=100, le=5000),
    current_user: User = Depends(require_role(["admin"])),
):
    """Generate and persist a demonstration dataset with explicit synthetic markers."""
    out_path = settings.DATASETS_DIR / "demo_readiness_dataset.csv"
    df = generate_demonstration_dataset(num_samples=num_samples, output_path=str(out_path))
    return {
        "message": f"Generated demonstration dataset with {len(df)} samples.",
        "file_path": str(out_path),
        "is_synthetic": True,
        "transparency_notice": "Clearly labeled synthetic demonstration data for training evaluation workflows."
    }

@router.get("/dataset/preview")
def preview_dataset(
    dataset_name: str = "demo_readiness_dataset.csv",
    current_user: User = Depends(require_role(["admin"]))
):
    """Preview dataset head, summary statistics, and column list."""
    csv_path = settings.DATASETS_DIR / dataset_name
    if not csv_path.exists():
        # Auto generate demo dataset if doesn't exist
        generate_demonstration_dataset(output_path=str(csv_path))
        
    df = pd.read_csv(csv_path)
    preview_rows = df.head(10).to_dict(orient="records")
    columns_info = []
    for col in df.columns:
        columns_info.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "missing_count": int(df[col].isnull().sum()),
            "sample_values": df[col].dropna().head(3).tolist()
        })
        
    return {
        "dataset_name": dataset_name,
        "total_rows": len(df),
        "columns": columns_info,
        "preview": preview_rows
    }

@router.post("/dataset/validate")
def validate_dataset_endpoint(
    dataset_name: str = "demo_readiness_dataset.csv",
    target_column: str = "technical_interview_pass",
    current_user: User = Depends(require_role(["admin"]))
):
    """Perform pre-training dataset validation, leakage detection, and imbalance auditing."""
    csv_path = settings.DATASETS_DIR / dataset_name
    if not csv_path.exists():
        generate_demonstration_dataset(output_path=str(csv_path))
        
    df = pd.read_csv(csv_path)
    feature_cols = [c for c in DEFAULT_FEATURE_COLS if c in df.columns]
    report = validate_dataset(df, target_column, feature_cols)
    return report

@router.post("/train", response_model=TrainedModelResponse)
def train_model(
    req: TrainModelRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Train, calibrate, evaluate, and register a new machine learning model locally.
    """
    csv_path = settings.DATASETS_DIR / (req.dataset_name or "demo_readiness_dataset.csv")
    if not csv_path.exists():
        generate_demonstration_dataset(output_path=str(csv_path))
        
    df = pd.read_csv(csv_path)
    features = req.feature_columns or DEFAULT_FEATURE_COLS
    
    # Train model
    res = train_and_evaluate_model(
        df=df,
        algorithm=req.algorithm,
        target_col=req.target_column,
        feature_cols=features,
        hyperparameters=req.hyperparameters,
        version_str=req.version_tag,
        is_synthetic=True
    )
    
    # Check if this is the first model, auto-activate if so
    active_count = db.query(TrainedModel).filter(TrainedModel.status == "active").count()
    initial_status = "active" if active_count == 0 else "candidate"
    
    model_record = TrainedModel(
        name=f"SkillUp Readiness Predictor ({req.algorithm})",
        version=res["version"],
        algorithm=res["algorithm"],
        target=res["target"],
        features=res["features"],
        metrics=res["metrics"],
        hyperparameters=req.hyperparameters or {},
        artifact_path=res["artifact_path"],
        dataset_info=res["dataset_info"],
        status=initial_status,
        created_by=current_user.id
    )
    db.add(model_record)
    db.commit()
    db.refresh(model_record)
    
    return model_record

@router.post("/models/{model_id}/activate")
def activate_model(
    model_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Activate a candidate model and demote others to candidate/archived."""
    target_model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not target_model:
        raise HTTPException(status_code=404, detail="Model not found.")
        
    # Set all other active models to archived
    db.query(TrainedModel).filter(TrainedModel.status == "active").update({"status": "candidate"})
    target_model.status = "active"
    db.commit()
    return {"message": f"Model {target_model.name} ({target_model.version}) activated successfully."}

@router.post("/predict-explain")
def predict_and_explain(
    req: PredictCandidateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compute readiness prediction and local SHAP feature attribution.
    """
    active_model = db.query(TrainedModel).filter(TrainedModel.status == "active").first()
    if not active_model:
        raise HTTPException(
            status_code=400,
            detail="Prediction unavailable: No trained and evaluated machine learning model is currently active."
        )
        
    feat_dict = req.features or {}
    
    # If candidate_id provided, fetch profile features
    if req.candidate_id:
        sp = db.query(StudentProfile).filter(StudentProfile.user_id == req.candidate_id).first()
        if sp:
            scores = sp.assessment_scores or {}
            feat_dict = {
                "coding_score": float(scores.get("coding_score", 70.0)),
                "dsa_score": float(scores.get("dsa_score", 65.0)),
                "mock_interview_score": float(scores.get("mock_interview_score", 70.0)),
                "skill_coverage": float(feat_dict.get("skill_coverage", 75.0)),
                "project_count": float(len(sp.projects or [])),
                "experience_years": float(len(sp.experience or []) * 0.5),
                "system_design_score": float(scores.get("system_design_score", 65.0))
            }
            
    # Default fallbacks if empty
    for f in active_model.features:
        if f not in feat_dict:
            feat_dict[f] = 70.0
            
    explanation = explain_prediction(active_model.artifact_path, feat_dict)
    explanation["model_name"] = active_model.name
    explanation["model_version"] = active_model.version
    explanation["algorithm"] = active_model.algorithm
    
    return explanation
