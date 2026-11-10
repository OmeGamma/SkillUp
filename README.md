# SkillUp — AI Career Development & Recruitment Intelligence Platform

> **Tagline:** Build Skills. Predict Readiness. Unlock Opportunities.  
> **Developed by:** OmeGamma  
> **Footer Branding:** *SkillUp : By OmeGamma*

---

## 1. Executive Summary

**SkillUp** is a comprehensive, production-grade AI-powered career development and recruitment intelligence platform built by **OmeGamma**. It bridges the gap between aspiring students and recruitment teams through resume analysis, skill matching, career gap analysis, job discovery, candidate ranking, interview-readiness assessment, and explainable machine learning.

### Non-Negotiable Core Principle: Zero External APIs
SkillUp requires **zero external AI APIs, zero hosted LLM endpoints, and zero cloud inference services**. Model inference and document processing run locally; persistent application records are stored in the configured MongoDB database:
* **Resume Parsing & Document Extraction:** PyMuPDF (`fitz`) and `python-docx` process documents locally in memory and local storage.
* **Skill Matching & Gap Analysis:** Transparent TF-IDF vectorization, cosine similarity, ontology normalization, and evidence weighting.
* **Interview Readiness Machine Learning:** Locally trained and calibrated `scikit-learn` models (Logistic Regression & Random Forest) with 5-fold cross-validation.
* **Explainable AI (XAI):** Local SHAP (`shap.TreeExplainer` & `shap.LinearExplainer`) feature attributions.
* **Fairness & Bias Audits:** Disparate Impact Ratio (EEOC Four-Fifths Rule: 0.80 threshold) and Equal Opportunity parity audits.
* **Executive PDF Reports:** High-fidelity executive PDFs compiled locally via ReportLab.
* **Persistence (MongoDB):** All application records, including accounts, profiles, jobs, applications, models, notifications, reports, and authentication audit logs, are stored in MongoDB through the backend. Keep `MONGODB_URI` in the backend environment only.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, PyMongo, Uvicorn |
| **Primary Database** | MongoDB (PyMongo); SQLAlchemy model metadata supports migration from the previous SQLite database |
| **Machine Learning & XAI** | NumPy, Pandas, Scikit-Learn, SciPy, SHAP |
| **Document Processing** | PyMuPDF (`fitz`) for PDFs, `python-docx` for Word documents |
| **Reporting & Exporting** | ReportLab for vector PDF generation, Pandas for CSV audits |
| **Security & Auth** | Direct `bcrypt` password hashing, PyJWT tokens, Server-side Role-Based Access Control (RBAC) |

---

## 3. Platform Architecture & Workspaces

SkillUp enforces strict server-side Role-Based Access Control (RBAC) across three distinct user roles:

```
                            ┌────────────────────────────────────────┐
                            │               SkillUp UI               │
                            │      (React 19 + TypeScript + Vite)    │
                            └───────────────────┬────────────────────┘
                                                │ REST API / in-memory JWT
                            ┌───────────────────▼────────────────────┐
                            │            FastAPI Backend             │
                            │       (Server-Side RBAC & Auth)        │
                            └───────┬───────────┬────────────┬───────┘
                                    │           │            │
            ┌───────────────────────┘           │            └───────────────────────┐
            ▼                                   ▼                                    ▼
┌───────────────────────┐           ┌───────────────────────┐            ┌───────────────────────┐
│   Student Workspace   │           │  Recruiter Workspace  │            │  Admin & ML Workspace │
├───────────────────────┤           ├───────────────────────┤            ├───────────────────────┤
│ • Profile & Skills    │           │ • Job Postings Mgmt   │            │ • ML Training Center  │
│ • Resume Analyzer     │           │ • Candidate Ranking   │            │ • Data Leakage Checks │
│ • Skill Gap Analysis  │           │ • Side-by-Side Matrix │            │ • 5-Fold Cross-Valid. │
│ • Job Explorer        │           │ • Confidential Notes  │            │ • Model Registry      │
│ • ReportLab PDF Export│           │ • Status Pipeline     │            │ • Fairness Auditing   │
│ • Notification Center │           │ • Local SHAP Explain. │            │ • Recruiter Approvals │
└───────────────────────┘           └───────────────────────┘            └───────────────────────┘
            │                                   │                                    │
            └───────────────────────────────────┼────────────────────────────────────┘
                                                ▼
                            ┌────────────────────────────────────────┐
                            │         Local Services Layer           │
                            │ • PyMuPDF & docx Text Parser           │
                            │ • 400+ Skill Ontology & Normalizer     │
                            │ • TF-IDF & Cosine Similarity Matcher   │
                            │ • Scikit-Learn & Calibrated Classifier │
                            │ • SHAP Explainer Engine                │
                            │ • EEOC 4/5ths Rule Fairness Auditor    │
                            │ • ReportLab Executive PDF Generator    │
                            └────────────────────────────────────────┘
```

The frontend keeps the current JWT and signed-in user in memory only; reloading the page signs the user out. MongoDB credentials are never sent to or bundled into the frontend.

Structured application records are persisted in MongoDB. Uploaded resumes, generated PDFs, trained model artifacts, and datasets continue to use the configured backend filesystem directories; MongoDB stores their metadata and paths.

---

## 4. Workspaces & Key Capabilities

### A. Student Workspace
* **Profile Management:** Edit technical skills, certifications, practical projects, work experience, education, portfolio links, and visibility toggles (`is_discoverable`).
* **Resume Analyzer:** Upload PDF or DOCX resumes. The parser extracts skills, education, projects, and work experience locally. Students can review, edit, or adjust all extracted data in an interactive review modal before saving to their profile.
* **Evidence-Backed Skills:** Clearly categorizes skills into *Verified Evidence* (backed by GitHub projects, assessments, or certifications) versus *Self-Reported*.
* **Skill Matching & Career Gap Analysis:** Match against benchmark roles (e.g., Full Stack Engineer, ML Engineer, DevOps Specialist) or any custom job description. Displays exact mathematical breakdowns:
  $$\text{Match Score} = 0.50 \times \text{Req. Coverage} + 0.25 \times \text{Pref. Coverage} + 0.25 \times \text{TF-IDF Similarity}$$
* **Personalized Learning Pathways:** Generates prioritized learning roadmaps and specific project recommendations to close identified skill gaps.
* **Job Explorer:** Browse recruiter job postings with live compatibility scores, work mode filters, and one-click *Express Interest* / *Withdraw Application*.
* **ReportLab PDF Downloads:** Download comprehensive career readiness reports with score breakdowns and timestamped recommendations.

### B. Recruiter Workspace
* **Job Management:** Create, update, publish, close, and delete job postings with customizable required/preferred skills and experience thresholds.
* **Candidate Ranking:** View candidates who expressed interest in a job. Candidates are ranked using transparent matching scores and evidence verification metrics.
* **Local SHAP Explainability:** Inspect exact SHAP feature attributions for any candidate to understand how specific qualifications (e.g., DSA score, project count) influenced the interview readiness prediction.
* **Side-by-Side Candidate Comparison:** Compare multiple candidates concurrently across skill coverage, experience, coding scores, and readiness metrics.
* **Confidential Notes:** Recruiters can record private evaluation notes that are strictly scrubbed from student-facing API responses.
* **Recruitment Pipeline:** Update application states across standard milestones:
  `Interested` $\rightarrow$ `Under Review` $\rightarrow$ `Shortlisted` $\rightarrow$ `Interview Scheduled` $\rightarrow$ `Interview Completed` $\rightarrow$ `Selected` / `Not Selected` / `Withdrawn`.
* **In-App Notifications:** Send customized notifications to candidates using pre-built templates for interview scheduling, status updates, or requests for information.

### C. Administrator Workspace & ML Center
* **Dataset Management:** Ingest and preview candidate evaluation datasets, inspect missing values, and verify class distributions.
* **Automated Data Leakage Detection:** Scans correlation matrices and flags any feature with $|r| > 0.95$ relative to the target label.
* **Model Training Engine:** Train and evaluate Logistic Regression (calibrated) and Random Forest classifiers with 5-fold stratified cross-validation.
* **Comprehensive Metrics:** Precision, Recall, F1-Score, Confusion Matrix, ROC-AUC, PR-AUC, and calibration curves.
* **Model Registry:** Manage trained model artifacts, view versioned evaluation reports, and activate or rollback models.
* **Algorithmic Fairness Audit:** Audit active models for demographic parity against the EEOC Four-Fifths Rule (Disparate Impact Ratio $\ge 0.80$) and True Positive Rate parity ($\Delta \text{TPR} \le 0.10$).
* **Recruiter Approvals:** Review and approve or reject newly registered recruiter accounts before granting platform posting privileges.

---

## 5. Quickstart & Installation Guide

### Prerequisites
* **Python:** 3.11 or higher
* **Node.js:** 18.0 or higher (npm 9+)

### Step 1: Clone and Setup Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install pinned dependencies
pip install -r requirements.txt

# Configure MONGODB_URI and MONGODB_DB_NAME in backend/.env first.
# To preserve existing SQLite data, run this once before seeding:
python migrate_sqlite_to_mongodb.py

# Seed demonstration database and pre-trained baseline ML model
python seed_data.py

# Launch FastAPI backend server
uvicorn app.main:app --reload --port 8000
```
Backend API docs will be accessible at: `http://localhost:8000/docs`

### Step 2: Setup Frontend
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend application will be accessible at: `http://localhost:5173`

Do not put `MONGODB_URI` in `frontend/.env` or prefix it with `VITE_`. The browser must access data through the FastAPI API.

---

## 6. Demonstration Credentials

The database comes pre-seeded with realistic demonstration accounts across all three roles. You can click the **1-Click Demo Login** buttons on the login page or enter credentials manually:

| Role | Email | Password | Pre-loaded Data / Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@skillup.com` | `admin123` | ML Training Center, Fairness Audits, Model Registry, Recruiter Approvals |
| **Recruiter** | `recruiter@omegamma.com` | `recruiter123` | 3 Live Job Postings, 5 Applicants, Candidate Ranking, SHAP Inspection |
| **Student (High Match)** | `arjun.sharma@skillup.com` | `student123` | Full-Stack profile, 90% match, verified projects, PDF reports |
| **Student (Growing Match)** | `priya.patel@skillup.com` | `student123` | Data Science profile, 75% match, identified career gaps |

---

## 7. Automated Testing & Verification

The platform includes comprehensive test suites covering authentication, role-based authorization, matching algorithms, document parsing, and machine learning pipelines:

### Run Backend Tests (Pytest)
```bash
cd backend
pytest -v
```
*Current test suite:* **12 passed in 11.0s** (`test_auth.py`, `test_matching.py`, `test_jobs_applications.py`, `test_ml.py`).

### Run Frontend Production Build (TypeScript + Vite)
```bash
cd frontend
npm run build
```
*Current status:* **Clean production build (0 TypeScript errors, 1958 modules transformed).**

---

## 8. API Reference Overview

All backend endpoints are prefixed with `/api/v1` and protected by server-side JWT authentication:

* **Authentication (`/auth`):** `/register`, `/login`, `/me`, `/approve-recruiter/{id}`
* **Profiles (`/profile`):** `/student`, `/recruiter`, `/visibility`
* **Resume Processing (`/resume`):** `/upload`, `/confirm-extraction`
* **Matching & Gap Analysis (`/matching`):** `/roles`, `/analyze-role`, `/analyze-custom`, `/analyze-job/{id}`
* **Job Postings (`/jobs`):** `GET /` (with optional student match scores), `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /recruiter/my-jobs`
* **Applications & Ranking (`/applications`):** `/express-interest`, `/withdraw/{id}`, `/student/my-applications`, `/jobs/{id}/candidates`, `/update-status`, `/update-notes`, `/compare`
* **Machine Learning & SHAP (`/ml`):** `/models`, `/active-model`, `/train`, `/predict/{id}`, `/explain/{id}`, `/datasets/validate`, `/datasets/sample`
* **Fairness Auditing (`/fairness`):** `/audit-active-model`, `/audit-dataset`, `/history`
* **Reports (`/reports`):** `/generate`, `/my-reports`, `/{id}/download` (ReportLab PDF)
* **Notifications (`/notifications`):** `/`, `/unread-count`, `/{id}/read`, `/send`
* **Admin Overview (`/admin`):** `/dashboard-stats`, `/pending-recruiters`, `/audit-logs`

---

## 9. Ethics, Transparency & Human Oversight

1. **Advisory Tool Only:** SkillUp predictions are structured as decision-support indicators for candidates and recruiters. The platform strictly prohibits autonomous rejections.
2. **Explainable Attribution:** Every prediction is decomposed into specific, understandable feature contributions via local SHAP analysis.
3. **Sensitive Attribute Segregation:** Demographics are strictly isolated to administrative fairness audits and are never utilized in model training, prediction, or candidate ranking.

---

*SkillUp : By OmeGamma*
