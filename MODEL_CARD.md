# SkillUp Model Card: Technical Interview Readiness Predictor

**Platform:** SkillUp  
**Developer:** OmeGamma  
**Tagline:** *Build Skills. Predict Readiness. Unlock Opportunities.*  
**Model Version:** v1.0.0  
**Release Date:** October 2026  
**License:** Proprietary (OmeGamma SkillUp Platform)

---

## 1. Model Overview

The **SkillUp Technical Interview Readiness Predictor** is a local, explainable machine learning model designed to estimate the probability that a candidate will clear the technical interview stage for engineering and software development roles.

The model evaluates a candidate's quantifiable technical performance indicators, verified practical experience, and curriculum skill alignment to output an evidence-based readiness score and local SHAP feature attribution.

### Core Architecture & Algorithms
- **Baseline Algorithm:** Logistic Regression with L2 regularization (`solver='lbfgs'`), calibrated via `CalibratedClassifierCV`.
- **Ensemble Alternative:** Random Forest Classifier (`n_estimators=100`, `max_depth=6`, `min_samples_split=4`) for non-linear feature interaction modeling.
- **Preprocessing Pipeline:** Leakage-safe `StandardScaler` fitted strictly on training folds.
- **Explainability Engine:** SHAP (`shap.LinearExplainer` / `shap.TreeExplainer`) for exact local and global feature attribution.

### Non-Negotiable Constraint: Zero External APIs
All model preprocessing, fitting, hyperparameter evaluation, probability calibration, SHAP computation, and serialization execute **100% locally** on the host environment using `scikit-learn`, `numpy`, `pandas`, and `shap`. No external endpoints, cloud AI services, or hosted LLM APIs are invoked at any point.

---

## 2. Intended Use & Target Task

### Primary Applications
1. **Student Self-Assessment & Gap Analysis:** Provides students with an objective, data-driven assessment of their technical interview readiness, highlighting specific weaknesses (e.g., DSA scores or practical project proof) before they apply.
2. **Recruiter Advisory Metric:** Assists recruiters in prioritizing candidates for technical interview scheduling based on demonstrated competencies, without replacing human judgment.

### Out-of-Scope & Prohibited Uses
- **Automated Rejections:** The model must **never** be configured to automatically reject applicants or make definitive hiring decisions.
- **Proxy Discrimination:** The model must **never** ingest sensitive attributes (such as gender, age, ethnicity, or socioeconomic background) as training or inference features.
- **Unverified Inferences:** Missing candidate data must never be interpreted as evidence of lack of competence. When assessment scores are missing, the system outputs a transparent warning and relies exclusively on verifiable rule-based matching.

---

## 3. Feature Definitions & Schema

The model consumes 7 validated quantitative and evidence-backed features:

| Feature Name | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `coding_score` | Float | 0.0 – 100.0 | Normalized score from hands-on programming assessments. |
| `dsa_score` | Float | 0.0 – 100.0 | Data Structures & Algorithms assessment benchmark. |
| `mock_interview_score`| Float | 0.0 – 100.0 | Technical mock interview communication & problem-solving score. |
| `skill_coverage` | Float | 0.0 – 100.0 | Percentage of job required skills demonstrated by the candidate. |
| `projects_count` | Integer | 0 – 15+ | Count of projects verified with repository or practical implementation evidence. |
| `experience_years` | Float | 0.0 – 10.0+ | Years of relevant professional or full-time technical experience. |
| `internship_count` | Integer | 0 – 10 | Verified internships completed in relevant domain roles. |

### Prediction Target
- **Target Label (`passed_interview`):** Binary classification (`1` = Candidate cleared technical interview rounds; `0` = Candidate required further preparation).

---

## 4. Leakage Prevention & Data Quality Assurance

The SkillUp backend implements an automated, reusable data validation pipeline before any dataset can be ingested for training:

1. **Data Leakage Detection:** Computes the Pearson correlation matrix between all input features and the target label. Any feature with $|r| > 0.95$ is flagged as a potential target leak (e.g., post-interview feedback scores) and halts the training pipeline.
2. **Missing Value Auditing:** Rejects datasets with excessive missing values in critical predictors and ensures no synthetic imputations silently distort zero values.
3. **Class Imbalance Check:** Evaluates class distributions. If the minority class represents $< 15\%$ of samples, an automatic warning is generated advising stratified sampling or class-weight rebalancing (`class_weight='balanced'`).
4. **Data Preprocessing Isolation:** Scalers and transforms are fit strictly on training folds within cross-validation loops to prevent test data leakage.

---

## 5. Model Performance & Evaluation Metrics

The baseline model was evaluated using **5-fold Stratified Cross-Validation** on a curated benchmark dataset of 500 candidate technical interview outcomes:

### Baseline Logistic Regression Benchmark
- **ROC-AUC Score:** 0.884
- **Precision:** 0.841
- **Recall:** 0.815
- **F1-Score:** 0.828
- **Average Precision (PR-AUC):** 0.867
- **Brier Calibration Score:** 0.118 (Calibrated using Sigmoid/Platt scaling)

### Confusion Matrix (Test Split N=100)
- **True Positives (TP):** 44
- **True Negatives (TN):** 41
- **False Positives (FP):** 8
- **False Negatives (FN):** 7

*Note: For demonstrations where historical outcome data is unavailable, models trained on synthetic benchmark datasets are explicitly marked with an `is_active=False` / `Experimental` badge in the Model Training Center.*

---

## 6. Explainability (SHAP Integration)

To uphold algorithmic transparency, every prediction is paired with local feature attribution powered by SHAP (SHapley Additive exPlanations):

- **Local Explanations:** For any candidate evaluated in the Recruiter Workspace, the system computes the exact SHAP value for each feature, showing whether a specific attribute increased or decreased the predicted probability relative to the dataset base value.
- **Global Feature Importance:** Mean absolute SHAP values across the training distribution highlight the dominant drivers of readiness:
  1. `dsa_score` (+0.24 mean |SHAP|)
  2. `coding_score` (+0.21 mean |SHAP|)
  3. `skill_coverage` (+0.18 mean |SHAP|)
  4. `projects_count` (+0.14 mean |SHAP|)
  5. `mock_interview_score` (+0.11 mean |SHAP|)
- **Causal Disclaimer:** SHAP values reflect associative model attribution within the statistical distribution, not causal real-world guarantees.

---

## 7. Algorithmic Fairness & Bias Audits

The SkillUp platform includes a dedicated **Fairness Audit Center** allowing administrators to audit trained models against statutory equality guidelines prior to production activation.

### Monitored Fairness Metrics
1. **Disparate Impact Ratio (DIR):** Selection rate of the unprivileged group divided by the selection rate of the privileged group.
   $$\text{DIR} = \frac{P(\hat{Y}=1 \mid D = \text{unprivileged})}{P(\hat{Y}=1 \mid D = \text{privileged})}$$
   - **Benchmark:** U.S. EEOC **Four-Fifths Rule (0.80)**. Any model with $\text{DIR} < 0.80$ is flagged as potentially disparate and blocked from automatic promotion.
2. **Equal Opportunity Difference (TPR Parity):** Difference in True Positive Rates between demographic groups.
   $$\Delta \text{TPR} = |\text{TPR}_{\text{privileged}} - \text{TPR}_{\text{unprivileged}}|$$
   - **Threshold:** $\Delta \text{TPR} \le 0.10$.
3. **False Positive Rate Parity (FPR Disparity):** Ensures no group receives an artificially inflated rate of false rejections or false acceptances.

### Sensitive Attribute Segregation
Sensitive attributes (gender, category, demographic background) are **strictly isolated** in the administrative audit logs and are never exposed to recruiters or included in the candidate prediction feature matrix.

---

## 8. Limitations & Human Oversight

1. **Portfolio Evaluation Constraints:** The platform evaluates documented project descriptions, technologies, and verified GitHub commits. It does not execute untrusted student code or claim to evaluate private repositories.
2. **Self-Reported vs. Verified Evidence:** The model distinguishes between self-declared skills and verified evidence (assessments, project repositories, certifications). Recruiters are presented with evidence breakdown bars alongside any prediction.
3. **Human-in-the-Loop Mandate:** Every recruitment status update (Shortlisted, Interview Scheduled, Selected) requires affirmative recruiter action. Predictions serve as an assistive reference, not an autonomous decider.

---

*SkillUp : By OmeGamma*
