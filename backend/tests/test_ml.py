import pytest
import pandas as pd
from app.services.ml_service import (
    generate_demonstration_dataset, validate_dataset,
    train_and_evaluate_model, explain_prediction, DEFAULT_FEATURE_COLS
)

def test_generate_and_validate_synthetic_dataset():
    df = generate_demonstration_dataset(num_samples=200)
    assert len(df) == 200
    assert "technical_interview_pass" in df.columns
    
    report = validate_dataset(df, "technical_interview_pass", DEFAULT_FEATURE_COLS)
    assert report["is_valid"] is True
    assert report["total_rows"] == 200

def test_train_and_evaluate_pipeline(tmp_path):
    df = generate_demonstration_dataset(num_samples=250)
    res = train_and_evaluate_model(
        df=df,
        algorithm="LogisticRegression",
        target_col="technical_interview_pass",
        version_str="test-v1",
        is_synthetic=True
    )
    
    metrics = res["metrics"]
    assert "accuracy" in metrics
    assert "f1" in metrics
    assert "roc_auc" in metrics
    assert metrics["roc_auc"] >= 0.50
    assert "confusion_matrix" in metrics
    
    # Test SHAP explainability on trained artifact
    explanation = explain_prediction(res["artifact_path"], {
        "coding_score": 85.0,
        "dsa_score": 80.0,
        "mock_interview_score": 90.0,
        "skill_coverage": 95.0,
        "project_count": 4.0,
        "experience_years": 1.5,
        "system_design_score": 80.0
    })
    
    assert "readiness_label" in explanation
    assert "pass_probability" in explanation
    assert len(explanation["feature_contributions"]) == len(DEFAULT_FEATURE_COLS)
    assert len(explanation["limitations"]) > 0
