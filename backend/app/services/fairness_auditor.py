from typing import Dict, Any
import pandas as pd
import joblib

def audit_model_fairness(
    artifact_path: str,
    df: pd.DataFrame,
    group_col: str,
    target_col: str = "technical_interview_pass"
) -> Dict[str, Any]:
    """
    Rigorously audit fairness metrics across demographic or background groups.
    Calculates:
    - Selection Rate (Positive Prediction Rate)
    - Disparate Impact Ratio (Selection Rate Unprivileged / Selection Rate Privileged)
    - True Positive Rate (TPR / Equal Opportunity)
    - False Positive Rate (FPR / Predictive Equality)
    - Sample size safety checks
    """
    warnings = []
    
    if group_col not in df.columns:
        raise ValueError(f"Group attribute column '{group_col}' not found in audit dataset.")
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in audit dataset.")
        
    model_data = joblib.load(artifact_path)
    model = model_data["model"]
    scaler = model_data["scaler"]
    features = model_data["feature_names"]
    
    # Ensure all feature columns exist in df
    for f in features:
        if f not in df.columns:
            raise ValueError(f"Feature '{f}' required by model is missing from audit dataset.")
            
    # Clean and predict
    clean_df = df.dropna(subset=[group_col, target_col]).copy()
    X = clean_df[features].fillna(0)
    y_true = clean_df[target_col].astype(int).values
    
    X_scaled = scaler.transform(X)
    y_pred = model.predict(X_scaled)
    
    clean_df["_pred"] = y_pred
    clean_df["_true"] = y_true
    
    groups = clean_df[group_col].unique()
    group_stats = {}
    
    for g in groups:
        sub = clean_df[clean_df[group_col] == g]
        n = len(sub)
        
        if n < 30:
            warnings.append(f"Group '{g}' has only {n} samples. Statistical power is low; metrics have wide uncertainty.")
            
        pos_pred = int(sub["_pred"].sum())
        selection_rate = (pos_pred / n) if n > 0 else 0.0
        
        # True Positive Rate: TP / (TP + FN) = P(pred=1 | true=1)
        actual_positives = sub[sub["_true"] == 1]
        tpr = (actual_positives["_pred"].sum() / len(actual_positives)) if len(actual_positives) > 0 else 0.0
        
        # False Positive Rate: FP / (FP + TN) = P(pred=1 | true=0)
        actual_negatives = sub[sub["_true"] == 0]
        fpr = (actual_negatives["_pred"].sum() / len(actual_negatives)) if len(actual_negatives) > 0 else 0.0
        
        # Precision: TP / (TP + FP)
        predicted_positives = sub[sub["_pred"] == 1]
        precision = (predicted_positives["_true"].sum() / len(predicted_positives)) if len(predicted_positives) > 0 else 0.0
        
        group_stats[str(g)] = {
            "sample_size": n,
            "predicted_positive_count": pos_pred,
            "selection_rate": round(float(selection_rate), 3),
            "true_positive_rate": round(float(tpr), 3),
            "false_positive_rate": round(float(fpr), 3),
            "precision": round(float(precision), 3)
        }
        
    # Calculate Disparate Impact Ratio benchmark (Four-Fifths Rule = 0.80)
    selection_rates = {g: stats["selection_rate"] for g, stats in group_stats.items() if stats["sample_size"] > 0}
    tprs = {g: stats["true_positive_rate"] for g, stats in group_stats.items() if stats["sample_size"] > 0}
    
    max_rate_group = max(selection_rates, key=selection_rates.get) if selection_rates else None
    min_rate_group = min(selection_rates, key=selection_rates.get) if selection_rates else None
    
    if max_rate_group and min_rate_group and selection_rates[max_rate_group] > 0:
        disparate_impact_ratio = round(selection_rates[min_rate_group] / selection_rates[max_rate_group], 3)
    else:
        disparate_impact_ratio = 1.0
        
    # Equal opportunity difference = min TPR - max TPR
    max_tpr_group = max(tprs, key=tprs.get) if tprs else None
    min_tpr_group = min(tprs, key=tprs.get) if tprs else None
    equal_opp_diff = round(tprs[min_tpr_group] - tprs[max_tpr_group], 3) if max_tpr_group and min_tpr_group else 0.0
    
    passed_80_rule = disparate_impact_ratio >= 0.80
    if not passed_80_rule:
        warnings.append(
            f"Disparate impact ratio ({disparate_impact_ratio:.2f}) between '{min_rate_group}' and '{max_rate_group}' "
            "is below the standard 0.80 (80%) benchmark threshold."
        )
        
    return {
        "group_attribute": group_col,
        "total_audited_samples": len(clean_df),
        "group_metrics": group_stats,
        "disparate_impact_ratio": disparate_impact_ratio,
        "equal_opportunity_difference": equal_opp_diff,
        "passed_four_fifths_benchmark": passed_80_rule,
        "privileged_group_ref": max_rate_group,
        "unprivileged_group_ref": min_rate_group,
        "warnings": warnings,
        "audit_note": (
            "Audits are conducted exclusively for post-hoc fairness monitoring. "
            "Sensitive demographic indicators are strictly forbidden as decision features."
        )
    }
