from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.ml_model import TrainedModel
from app.models.audit import FairnessAuditLog
from app.schemas.ml import FairnessAuditRequest
from app.routers.auth import require_role
from app.services.fairness_auditor import audit_model_fairness
from app.services.ml_service import generate_demonstration_dataset

router = APIRouter(prefix="/fairness", tags=["Fairness & Bias Auditing"])

@router.get("/history")
def get_audit_history(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve history of all fairness audits conducted."""
    audits = db.query(FairnessAuditLog).order_by(FairnessAuditLog.created_at.desc()).all()
    result = []
    for a in audits:
        model = a.model
        result.append({
            "id": a.id,
            "model_id": a.model_id,
            "model_name": model.name if model else "Model",
            "model_version": model.version if model else "v1",
            "group_attribute": a.group_attribute,
            "metrics": a.metrics,
            "warnings": a.warnings,
            "created_at": a.created_at
        })
    return result

@router.post("/run-audit")
def run_fairness_audit(
    req: FairnessAuditRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Execute an access-controlled post-hoc fairness audit.
    Evaluates Disparate Impact Ratio, Equal Opportunity, TPR and FPR across groups.
    """
    model = db.query(TrainedModel).filter(TrainedModel.id == req.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found.")
        
    csv_path = settings.DATASETS_DIR / (req.dataset_name or "demo_readiness_dataset.csv")
    if not csv_path.exists():
        generate_demonstration_dataset(output_path=str(csv_path))
        
    df = pd.read_csv(csv_path)
    
    try:
        audit_result = audit_model_fairness(
            artifact_path=model.artifact_path,
            df=df,
            group_col=req.group_attribute,
            target_col=model.target
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audit failed: {str(e)}")
        
    # Save audit record
    audit_log = FairnessAuditLog(
        model_id=model.id,
        group_attribute=req.group_attribute,
        metrics=audit_result,
        warnings=audit_result["warnings"],
        audited_by=current_user.id
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return {
        "audit_id": audit_log.id,
        "model_id": model.id,
        "model_version": model.version,
        "results": audit_result
    }
