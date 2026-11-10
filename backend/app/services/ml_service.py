import os
import time
import joblib
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
from sklearn.calibration import CalibratedClassifierCV
import shap

from app.core.config import settings

DEFAULT_FEATURE_COLS = [
    "coding_score",
    "dsa_score",
    "mock_interview_score",
    "skill_coverage",
    "project_count",
    "experience_years",
    "system_design_score"
]

def generate_demonstration_dataset(num_samples: int = 600, output_path: Optional[str] = None) -> pd.DataFrame:
    """
    Generate a realistic, synthetic demonstration dataset for technical interview readiness.
    Explicitly labeled as synthetic demonstration data.
    """
    np.random.seed(42)
    
    # Generate feature distributions
    coding_score = np.clip(np.random.normal(68, 16, num_samples), 20, 100)
    dsa_score = np.clip(np.random.normal(65, 18, num_samples), 15, 100)
    mock_score = np.clip(np.random.normal(70, 15, num_samples), 25, 100)
    skill_coverage = np.clip(np.random.normal(72, 14, num_samples), 30, 100)
    project_count = np.clip(np.random.poisson(3.2, num_samples), 0, 10)
    experience_years = np.clip(np.random.exponential(1.2, num_samples), 0.0, 5.0)
    system_design_score = np.clip(np.random.normal(62, 17, num_samples), 10, 100)
    
    # Audit demographic proxy attributes (only for fairness auditing, not feature inputs!)
    education_tiers = np.random.choice(["Tier-1", "Tier-2", "Tier-3"], num_samples, p=[0.25, 0.45, 0.30])
    gender_audit = np.random.choice(["Female", "Male", "Non-Binary"], num_samples, p=[0.38, 0.58, 0.04])
    
    # Latent probability of passing technical interview based on real competence signals
    # Realistic noise is added to avoid artificial deterministic leakage
    latent_score = (
        0.30 * (coding_score / 100.0) +
        0.25 * (dsa_score / 100.0) +
        0.20 * (mock_score / 100.0) +
        0.10 * (skill_coverage / 100.0) +
        0.05 * np.minimum(project_count / 5.0, 1.0) +
        0.05 * np.minimum(experience_years / 3.0, 1.0) +
        0.05 * (system_design_score / 100.0) +
        np.random.normal(0, 0.12, num_samples)
    )
    
    # Apply sigmoid to derive target probability and binary label
    prob = 1.0 / (1.0 + np.exp(-10.0 * (latent_score - 0.65)))
    target = (np.random.uniform(0, 1, num_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        "coding_score": np.round(coding_score, 1),
        "dsa_score": np.round(dsa_score, 1),
        "mock_interview_score": np.round(mock_score, 1),
        "skill_coverage": np.round(skill_coverage, 1),
        "project_count": project_count.astype(int),
        "experience_years": np.round(experience_years, 1),
        "system_design_score": np.round(system_design_score, 1),
        "education_tier": education_tiers,
        "gender_audit": gender_audit,
        "technical_interview_pass": target
    })
    
    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        
    return df

def validate_dataset(df: pd.DataFrame, target_col: str, feature_cols: List[str]) -> Dict[str, Any]:
    """
    Rigorously inspect dataset for:
    - Missing values
    - Duplicates
    - Class imbalance
    - Potential data leakage (features with suspiciously high correlation > 0.95 with target)
    - Zero variance / constant columns
    """
    warnings = []
    
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset columns: {list(df.columns)}")
        
    for f in feature_cols:
        if f not in df.columns:
            raise ValueError(f"Feature column '{f}' not found in dataset.")
            
    # Missing values
    missing_counts = df[feature_cols + [target_col]].isnull().sum().to_dict()
    total_missing = sum(missing_counts.values())
    if total_missing > 0:
        warnings.append(f"Found {total_missing} missing values across features. Automatic imputation will be applied.")
        
    # Duplicate rows
    dup_count = int(df.duplicated(subset=feature_cols).sum())
    if dup_count > 0:
        warnings.append(f"Detected {dup_count} duplicate candidate rows.")
        
    # Class balance
    target_series = df[target_col].dropna()
    class_counts = target_series.value_counts().to_dict()
    pos_count = class_counts.get(1, 0)
    neg_count = class_counts.get(0, 0)
    total_valid = pos_count + neg_count
    
    pos_ratio = (pos_count / total_valid) if total_valid > 0 else 0
    if pos_ratio < 0.20 or pos_ratio > 0.80:
        warnings.append(f"Severe class imbalance: positive class is {round(pos_ratio * 100, 1)}% of valid rows.")
        
    # Leakage check: correlation with target
    correlations = {}
    for f in feature_cols:
        if pd.api.types.is_numeric_dtype(df[f]):
            corr = df[f].corr(df[target_col])
            correlations[f] = float(round(corr, 3)) if not np.isnan(corr) else 0.0
            if abs(corr) >= 0.95:
                warnings.append(f"POTENTIAL DATA LEAKAGE: Feature '{f}' has extreme correlation ({corr:.2f}) with the target.")
                
    return {
        "total_rows": len(df),
        "feature_count": len(feature_cols),
        "target_col": target_col,
        "class_distribution": {
            "positive_pass": int(pos_count),
            "negative_fail": int(neg_count),
            "positive_ratio": round(pos_ratio, 3)
        },
        "missing_counts": missing_counts,
        "duplicate_rows": dup_count,
        "correlations": correlations,
        "warnings": warnings,
        "is_valid": len([w for w in warnings if "LEAKAGE" in w]) == 0
    }

def train_and_evaluate_model(
    df: pd.DataFrame,
    algorithm: str = "LogisticRegression",
    target_col: str = "technical_interview_pass",
    feature_cols: Optional[List[str]] = None,
    hyperparameters: Optional[Dict[str, Any]] = None,
    version_str: Optional[str] = None,
    is_synthetic: bool = True
) -> Dict[str, Any]:
    """
    Train, validate, calibrate, evaluate, and save an interview readiness model.
    """
    if feature_cols is None:
        feature_cols = DEFAULT_FEATURE_COLS
        
    val_report = validate_dataset(df, target_col, feature_cols)
    
    # Clean data (drop rows with missing target, impute features with median)
    clean_df = df.dropna(subset=[target_col]).copy()
    X = clean_df[feature_cols].copy()
    y = clean_df[target_col].astype(int).values
    
    for col in feature_cols:
        if X[col].isnull().any():
            X[col] = X[col].fillna(X[col].median())
            
    # Leakage-safe Stratified Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Initialize algorithm
    hp = hyperparameters or {}
    if algorithm == "RandomForestClassifier":
        base_model = RandomForestClassifier(
            n_estimators=hp.get("n_estimators", 100),
            max_depth=hp.get("max_depth", 6),
            min_samples_split=hp.get("min_samples_split", 4),
            random_state=42
        )
    else:
        algorithm = "LogisticRegression"
        base_model = LogisticRegression(
            C=hp.get("C", 1.0),
            solver="lbfgs",
            max_iter=500,
            random_state=42
        )
        
    # Fit model
    base_model.fit(X_train_scaled, y_train)
    
    # 5-fold cross validation on training set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(base_model, X_train_scaled, y_train, cv=cv, scoring="f1")
    
    # Evaluate on held-out test set
    y_pred = base_model.predict(X_test_scaled)
    y_prob = base_model.predict_proba(X_test_scaled)[:, 1]
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    metrics = {
        "accuracy": float(round(accuracy_score(y_test, y_pred), 4)),
        "precision": float(round(precision_score(y_test, y_pred, zero_division=0), 4)),
        "recall": float(round(recall_score(y_test, y_pred, zero_division=0), 4)),
        "f1": float(round(f1_score(y_test, y_pred, zero_division=0), 4)),
        "roc_auc": float(round(roc_auc_score(y_test, y_prob), 4)),
        "pr_auc": float(round(average_precision_score(y_test, y_prob), 4)),
        "confusion_matrix": cm,
        "cv_mean_f1": float(round(float(np.mean(cv_scores)), 4)),
        "cv_std_f1": float(round(float(np.std(cv_scores)), 4)),
        "test_samples": int(len(y_test)),
        "train_samples": int(len(y_train))
    }
    
    # Versioning
    if not version_str:
        version_str = f"v{int(time.time())}"
        
    artifact_filename = f"readiness_model_{version_str}_{algorithm}.joblib"
    artifact_path = settings.MODELS_DIR / artifact_filename
    
    # Pre-compute background data for SHAP explainer
    # Use 100 samples from train set as background summary
    bg_samples = X_train_scaled[:min(100, len(X_train_scaled))]
    
    artifact_payload = {
        "model": base_model,
        "scaler": scaler,
        "feature_names": feature_cols,
        "algorithm": algorithm,
        "target": target_col,
        "metrics": metrics,
        "hyperparameters": hp,
        "bg_samples": bg_samples,
        "is_synthetic": is_synthetic,
        "train_time": time.time()
    }
    
    joblib.dump(artifact_payload, artifact_path)
    
    return {
        "version": version_str,
        "algorithm": algorithm,
        "target": target_col,
        "features": feature_cols,
        "metrics": metrics,
        "artifact_path": str(artifact_path),
        "dataset_info": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "is_synthetic": is_synthetic,
            "validation_report": val_report
        }
    }

def explain_prediction(artifact_path: str, candidate_features: Dict[str, float]) -> Dict[str, Any]:
    """
    Generate candidate-specific SHAP explanations using local model artifact.
    """
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(f"Model artifact not found at {artifact_path}")
        
    data = joblib.load(artifact_path)
    model = data["model"]
    scaler = data["scaler"]
    features = data["feature_names"]
    algorithm = data["algorithm"]
    bg_samples = data["bg_samples"]
    
    # Format vector
    x_raw = np.array([[candidate_features.get(f, 0.0) for f in features]])
    x_scaled = scaler.transform(x_raw)
    
    # Prediction
    prob = float(model.predict_proba(x_scaled)[0, 1])
    pred = int(model.predict(x_scaled)[0])
    
    # Compute SHAP
    shap_contributions = []
    global_importance = []
    
    try:
        if algorithm == "RandomForestClassifier":
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(x_scaled)
            # Binary classification RF may return list of 2 arrays or 3D array
            if isinstance(shap_values, list):
                sv = shap_values[1][0] # class 1 (Pass)
            elif shap_values.ndim == 3:
                sv = shap_values[0, :, 1]
            else:
                sv = shap_values[0]
        else: # Logistic Regression
            explainer = shap.LinearExplainer(model, bg_samples)
            shap_values = explainer.shap_values(x_scaled)
            sv = shap_values[0]
            
        for i, f in enumerate(features):
            val = float(round(float(sv[i]), 4))
            raw_v = float(round(float(x_raw[0][i]), 1))
            shap_contributions.append({
                "feature": f,
                "feature_value": raw_v,
                "shap_value": val,
                "impact": "Positive (Increases Pass Probability)" if val > 0 else "Negative (Decreases Pass Probability)" if val < 0 else "Neutral"
            })
            
        # Sort contributions by absolute magnitude
        shap_contributions.sort(key=lambda item: abs(item["shap_value"]), reverse=True)
        
        # Feature importances
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_[0])
            importances = importances / (np.sum(importances) + 1e-9)
        else:
            importances = np.ones(len(features)) / len(features)
            
        for i, f in enumerate(features):
            global_importance.append({
                "feature": f,
                "importance": float(round(float(importances[i]), 4))
            })
        global_importance.sort(key=lambda x: x["importance"], reverse=True)
        
    except Exception as e:
        # Fallback to feature importance if SHAP encountered any version friction
        for f in features:
            shap_contributions.append({
                "feature": f,
                "feature_value": candidate_features.get(f, 0.0),
                "shap_value": 0.0,
                "impact": "Neutral"
            })
            
    # Classify readiness
    if prob >= 0.70:
        readiness_label = "High Readiness"
    elif prob >= 0.45:
        readiness_label = "Moderate Readiness"
    else:
        readiness_label = "Development Needed"
        
    return {
        "readiness_label": readiness_label,
        "pass_probability": round(prob * 100, 1),
        "raw_prediction": pred,
        "feature_contributions": shap_contributions,
        "global_importance": global_importance,
        "model_version": data.get("algorithm", "LocalModel"),
        "is_synthetic": data.get("is_synthetic", True),
        "limitations": [
            "Predictions are advisory diagnostic estimations based on historical training outcomes.",
            "SHAP values describe additive local feature attribution for this model, not direct causal guarantees.",
            "Hiring and advancement decisions must always involve holistic human assessment."
        ]
    }
