import sys
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from app.core.database import MongoSession, initialize_mongodb
from app.core.security import get_password_hash
from app.models.user import User
from app.models.profile import StudentProfile, RecruiterProfile
from app.models.job import Job
from app.models.application import Application
from app.models.report import Report
from app.models.notification import Notification
from app.models.ml_model import TrainedModel
from app.services.ml_service import generate_demonstration_dataset, train_and_evaluate_model
from app.services.matcher import match_candidate_to_job
from app.core.config import settings
from app.services.mongodb_service import mongodb_service

def seed_database():
    print("Initializing MongoDB collections and indexes...")
    initialize_mongodb()
    db = MongoSession(mongodb_service.database)
    
    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@skillup.com").first()
        if existing_admin:
            print("Database already contains seed data. Skipping creation.")
            return

        print("Seeding Users...")
        # 1. Admin
        admin = User(
            email="admin@skillup.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin",
            recruiter_status="approved",
            is_active=True
        )
        db.add(admin)
        db.flush()

        # 2. Recruiters
        recruiter_1 = User(
            email="recruiter@omegamma.com",
            hashed_password=get_password_hash("recruiter123"),
            full_name="Mr. Kunal",
            role="recruiter",
            recruiter_status="approved",
            is_active=True
        )
        db.add(recruiter_1)
        db.flush()
        
        rp1 = RecruiterProfile(
            user_id=recruiter_1.id,
            organization="CloudScale Systems",
            designation="Principal Engineering Recruiter",
            department="Cloud Architecture Talent",
            website="https://cloudscale.example.com",
            bio="Focusing on hiring world-class full-stack and distributed backend engineering talent.",
            location="Bangalore / Remote"
        )
        db.add(rp1)

        recruiter_2 = User(
            email="hiring@nexustech.io",
            hashed_password=get_password_hash("recruiter123"),
            full_name="David Miller",
            role="recruiter",
            recruiter_status="approved",
            is_active=True
        )
        db.add(recruiter_2)
        db.flush()
        
        rp2 = RecruiterProfile(
            user_id=recruiter_2.id,
            organization="Nexus Innovations",
            designation="Talent Acquisition Lead",
            department="Software & AI Labs",
            website="https://nexustech.example.io",
            bio="Building high-performing engineering squads across web, data science, and DevOps domains.",
            location="Remote"
        )
        db.add(rp2)

        # 3. Students
        # Student A: Arjun Sharma (Full Stack)
        student_1 = User(
            email="arjun.sharma@skillup.com",
            hashed_password=get_password_hash("student123"),
            full_name="Arjun Sharma",
            role="student",
            is_active=True
        )
        db.add(student_1)
        db.flush()

        sp1 = StudentProfile(
            user_id=student_1.id,
            headline="Full Stack Engineer | React, TypeScript & FastAPI",
            bio="Computer science graduate passionate about scalable microservices, modern frontends, and developer tooling.",
            phone="+91 98765 43210",
            location="Bangalore, India",
            target_role="Full Stack Developer",
            cgpa=8.8,
            is_discoverable=True,
            portfolio_url="https://arjunsharma.dev",
            github_url="https://github.com/arjunsharma",
            linkedin_url="https://linkedin.com/in/arjunsharma",
            completeness_score=95,
            assessment_scores={"coding_score": 88, "dsa_score": 82, "mock_interview_score": 85, "system_design_score": 78},
            education=[
                {
                    "institution": "Technical Institute of Technology",
                    "degree": "B.Tech",
                    "field_of_study": "Computer Science & Engineering",
                    "start_year": 2022,
                    "end_year": 2026,
                    "grade": "8.8 CGPA"
                }
            ],
            skills=[
                {"name": "React", "category": "Frontend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "TypeScript", "category": "Frontend", "source": "project", "verified": True, "level": "intermediate"},
                {"name": "JavaScript", "category": "Frontend", "source": "resume", "verified": True, "level": "advanced"},
                {"name": "Python", "category": "Backend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "FastAPI", "category": "Backend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "PostgreSQL", "category": "Databases", "source": "project", "verified": True, "level": "intermediate"},
                {"name": "Docker", "category": "DevOps", "source": "resume", "verified": False, "level": "intermediate"},
                {"name": "Git", "category": "DevOps", "source": "project", "verified": True, "level": "advanced"},
                {"name": "REST APIs", "category": "Core CS", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Tailwind CSS", "category": "Frontend", "source": "project", "verified": True, "level": "advanced"}
            ],
            projects=[
                {
                    "title": "CloudMetrics SaaS Platform",
                    "description": "Engineered a real-time system monitoring dashboard using React, TypeScript, and FastAPI with PostgreSQL time-series storage.",
                    "technologies": ["React", "TypeScript", "FastAPI", "PostgreSQL", "Tailwind CSS"],
                    "github_url": "https://github.com/arjunsharma/cloudmetrics",
                    "link": "https://cloudmetrics.demo.app",
                    "role": "Lead Full Stack Developer",
                    "outcome": "Achieved sub-100ms API query latencies for time-series metrics"
                },
                {
                    "title": "Distributed Task Scheduler",
                    "description": "Built an asynchronous task runner in Python and Redis supporting exponential backoff retries and webhook dispatch.",
                    "technologies": ["Python", "FastAPI", "Redis", "Docker", "REST APIs"],
                    "github_url": "https://github.com/arjunsharma/task-scheduler",
                    "role": "Backend Engineer",
                    "outcome": "Processed 10,000 simulated jobs/min with zero dropped events"
                }
            ],
            experience=[
                {
                    "company": "ScaleUp Labs",
                    "role": "Full Stack Engineering Intern",
                    "start_date": "June 2025",
                    "end_date": "August 2025",
                    "description": "Developed React dashboard components and wrote high-throughput REST endpoints in FastAPI.",
                    "technologies": ["React", "FastAPI", "PostgreSQL", "Git"]
                }
            ],
            certifications=[
                {"name": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services", "issue_date": "2025"}
            ]
        )
        db.add(sp1)

        # Student B: Priya Patel (Data Science & ML)
        student_2 = User(
            email="priya.patel@skillup.com",
            hashed_password=get_password_hash("student123"),
            full_name="Priya Patel",
            role="student",
            is_active=True
        )
        db.add(student_2)
        db.flush()

        sp2 = StudentProfile(
            user_id=student_2.id,
            headline="Machine Learning Engineer & Data Scientist",
            bio="Passionate about statistical modeling, predictive algorithms, explainable AI, and production ML pipelines.",
            phone="+91 91234 56789",
            location="Pune, India",
            target_role="Data Scientist / ML Engineer",
            cgpa=9.1,
            is_discoverable=True,
            portfolio_url="https://priyapatel.ai",
            github_url="https://github.com/priyapatel",
            completeness_score=90,
            assessment_scores={"coding_score": 85, "dsa_score": 80, "mock_interview_score": 90, "system_design_score": 75},
            education=[
                {
                    "institution": "National Institute of Science",
                    "degree": "B.Tech",
                    "field_of_study": "Data Science & Artificial Intelligence",
                    "start_year": 2022,
                    "end_year": 2026,
                    "grade": "9.1 CGPA"
                }
            ],
            skills=[
                {"name": "Python", "category": "Backend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Machine Learning", "category": "Data & AI", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Scikit-Learn", "category": "Data & AI", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Pandas", "category": "Data & AI", "source": "project", "verified": True, "level": "advanced"},
                {"name": "NumPy", "category": "Data & AI", "source": "project", "verified": True, "level": "advanced"},
                {"name": "PyTorch", "category": "Data & AI", "source": "project", "verified": True, "level": "intermediate"},
                {"name": "SHAP", "category": "Data & AI", "source": "project", "verified": True, "level": "intermediate"},
                {"name": "SQL", "category": "Core CS", "source": "resume", "verified": True, "level": "advanced"},
                {"name": "Git", "category": "DevOps", "source": "resume", "verified": True, "level": "intermediate"}
            ],
            projects=[
                {
                    "title": "Explainable Churn Predictor",
                    "description": "Trained and calibrated Random Forest and Logistic Regression models with SHAP local waterfall explanations and FastAPI serving.",
                    "technologies": ["Python", "Scikit-Learn", "SHAP", "FastAPI", "Pandas"],
                    "github_url": "https://github.com/priyapatel/xai-churn",
                    "role": "Lead Data Scientist",
                    "outcome": "Attained 0.89 ROC-AUC and delivered interpretable explanations"
                }
            ],
            experience=[
                {
                    "company": "DeepAnalytics AI",
                    "role": "Machine Learning Research Intern",
                    "start_date": "May 2025",
                    "end_date": "July 2025",
                    "description": "Built automated data validation pipelines and audited model disparate impact.",
                    "technologies": ["Python", "Pandas", "Scikit-Learn"]
                }
            ]
        )
        db.add(sp2)

        # Student C: Sneha Reddy (Backend Engineer)
        student_3 = User(
            email="sneha.reddy@skillup.com",
            hashed_password=get_password_hash("student123"),
            full_name="Sneha Reddy",
            role="student",
            is_active=True
        )
        db.add(student_3)
        db.flush()

        sp3 = StudentProfile(
            user_id=student_3.id,
            headline="Backend Engineer | Python, PostgreSQL & Distributed Systems",
            bio="Specializing in building robust APIs, asynchronous queues, and database performance tuning.",
            location="Hyderabad, India",
            target_role="Backend Developer",
            cgpa=8.4,
            is_discoverable=True,
            completeness_score=85,
            assessment_scores={"coding_score": 82, "dsa_score": 78, "mock_interview_score": 80, "system_design_score": 84},
            education=[
                {"institution": "Engineering College", "degree": "B.Tech", "field_of_study": "Information Technology", "start_year": 2022, "end_year": 2026}
            ],
            skills=[
                {"name": "Python", "category": "Backend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "FastAPI", "category": "Backend", "source": "project", "verified": True, "level": "advanced"},
                {"name": "PostgreSQL", "category": "Databases", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Docker", "category": "DevOps", "source": "project", "verified": True, "level": "intermediate"},
                {"name": "Redis", "category": "Databases", "source": "resume", "verified": False, "level": "intermediate"},
                {"name": "REST APIs", "category": "Core CS", "source": "project", "verified": True, "level": "advanced"},
                {"name": "Data Structures", "category": "Core CS", "source": "self", "verified": True, "level": "advanced"},
                {"name": "Git", "category": "DevOps", "source": "project", "verified": True, "level": "intermediate"}
            ],
            projects=[
                {
                    "title": "High-Throughput Ingestion Engine",
                    "description": "Architected an event ingestion pipeline using FastAPI, SQLAlchemy asynchronous sessions, and PostgreSQL partition tables.",
                    "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                    "github_url": "https://github.com/snehareddy/ingestion-engine",
                    "role": "Backend Architect"
                }
            ]
        )
        db.add(sp3)

        print("Seeding Job Postings...")
        # Job 1
        job1 = Job(
            recruiter_id=recruiter_1.id,
            title="Full Stack Software Engineer",
            organization="CloudScale Systems",
            department="Core Platform Engineering",
            description="We are seeking an energetic Full Stack Engineer to build next-generation cloud infrastructure dashboards and telemetry APIs. You will partner with our cloud engineering squads to design responsive interfaces in React/TypeScript and engineer resilient RESTful backend services in FastAPI.",
            required_skills=["JavaScript", "TypeScript", "React", "Python", "FastAPI", "PostgreSQL", "Git"],
            preferred_skills=["Docker", "Tailwind CSS", "Redis", "REST APIs", "Unit Testing"],
            min_experience_years=0.0,
            education_level="Bachelor's in CS / IT / Related Engineering",
            location="Bangalore, India",
            work_mode="Hybrid",
            salary_range="₹8,00,000 - ₹14,00,000 / annum",
            deadline=datetime.now(timezone.utc) + timedelta(days=30),
            status="active",
            is_demo=False
        )
        db.add(job1)
        db.flush()

        # Job 2
        job2 = Job(
            recruiter_id=recruiter_2.id,
            title="Backend Systems Engineer (Python / FastAPI)",
            organization="Nexus Innovations",
            department="Distributed Core Team",
            description="Nexus Innovations is hiring a Backend Systems Engineer to build high-performance data processing APIs, integrate PostgreSQL databases, and maintain asynchronous job queues. Experience with Docker, clean REST API design, and database query optimization is valued.",
            required_skills=["Python", "FastAPI", "PostgreSQL", "REST APIs", "SQL", "Git"],
            preferred_skills=["Docker", "Redis", "System Design", "Microservices", "CI/CD"],
            min_experience_years=0.0,
            education_level="Bachelor's in Engineering",
            location="Remote",
            work_mode="Remote",
            salary_range="₹9,00,000 - ₹15,00,000 / annum",
            deadline=datetime.now(timezone.utc) + timedelta(days=45),
            status="active",
            is_demo=False
        )
        db.add(job2)
        db.flush()

        # Job 3
        job3 = Job(
            recruiter_id=recruiter_2.id,
            title="Machine Learning & Data Intelligence Engineer",
            organization="Nexus Innovations",
            department="AI Research Labs",
            description="Join our AI engineering team to develop, evaluate, and operationalize predictive machine learning pipelines. You will collaborate on candidate readiness algorithms, evaluate disparate impact metrics, and deploy explainable models with SHAP and FastAPI.",
            required_skills=["Python", "Machine Learning", "Scikit-Learn", "Pandas", "NumPy", "SQL"],
            preferred_skills=["SHAP", "PyTorch", "FastAPI", "Docker", "Data Visualization"],
            min_experience_years=0.0,
            education_level="Bachelor's / Master's in Data Science / CS",
            location="Remote / Hybrid",
            work_mode="Hybrid",
            salary_range="₹10,00,000 - ₹16,00,000 / annum",
            deadline=datetime.now(timezone.utc) + timedelta(days=25),
            status="active",
            is_demo=False
        )
        db.add(job3)
        db.flush()

        # Job 4 (Demonstration Posting clearly labeled!)
        job4 = Job(
            recruiter_id=recruiter_1.id,
            title="Frontend UI/UX Specialist [Demonstration Posting]",
            organization="CloudScale Systems",
            department="Product Design Engineering",
            description="[DEMONSTRATION POSTING: Clearly labeled for demonstration testing] Seeking a frontend specialist skilled in React, modern Tailwind CSS styling, responsive layout design, and accessible state management.",
            required_skills=["JavaScript", "TypeScript", "React", "HTML5", "CSS3", "Tailwind CSS"],
            preferred_skills=["Vite", "Next.js", "Unit Testing", "REST APIs"],
            min_experience_years=0.0,
            location="Bangalore",
            work_mode="On-site",
            salary_range="Competitive",
            status="active",
            is_demo=True # Explicitly labeled
        )
        db.add(job4)
        db.flush()

        print("Training baseline Machine Learning model locally...")
        # Generate demo dataset and train baseline model
        demo_csv_path = settings.DATASETS_DIR / "demo_readiness_dataset.csv"
        df_demo = generate_demonstration_dataset(num_samples=600, output_path=str(demo_csv_path))
        
        ml_res = train_and_evaluate_model(
            df=df_demo,
            algorithm="LogisticRegression",
            target_col="technical_interview_pass",
            version_str="v1.0.0-logistic",
            is_synthetic=True
        )
        
        baseline_model = TrainedModel(
            name="SkillUp Readiness Predictor (LogisticRegression)",
            version=ml_res["version"],
            algorithm=ml_res["algorithm"],
            target=ml_res["target"],
            features=ml_res["features"],
            metrics=ml_res["metrics"],
            hyperparameters={"C": 1.0, "penalty": "l2"},
            artifact_path=ml_res["artifact_path"],
            dataset_info=ml_res["dataset_info"],
            status="active", # Active model!
            created_by=admin.id
        )
        db.add(baseline_model)
        db.flush()

        print("Seeding Applications & Match Metrics...")
        # Arjun applied to Job 1 (Full Stack)
        cand_dict_arjun = {
            "headline": sp1.headline, "bio": sp1.bio,
            "skills": sp1.skills, "projects": sp1.projects,
            "experience": sp1.experience
        }
        match_arjun_job1 = match_candidate_to_job(cand_dict_arjun, {
            "title": job1.title, "description": job1.description,
            "required_skills": job1.required_skills, "preferred_skills": job1.preferred_skills
        })
        
        app1 = Application(
            job_id=job1.id,
            student_id=student_1.id,
            status="Shortlisted",
            match_score=match_arjun_job1["overall_score"],
            required_coverage=match_arjun_job1["required_coverage"],
            preferred_coverage=match_arjun_job1["preferred_coverage"],
            text_similarity=match_arjun_job1["text_similarity"],
            readiness_prediction="High Readiness",
            readiness_probability=87.4,
            model_version_used="v1.0.0-logistic",
            match_breakdown=match_arjun_job1,
            recruiter_notes="Strong project portfolio in both React and FastAPI. Code in GitHub repo shows clean async patterns.",
            status_history=[
                {"status": "Interested", "timestamp": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(), "note": "Expressed interest"},
                {"status": "Under Review", "timestamp": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(), "note": "Reviewing verified project evidence"},
                {"status": "Shortlisted", "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "note": "Candidate shortlisted for technical interview"}
            ],
            applied_at=datetime.now(timezone.utc) - timedelta(days=5)
        )
        db.add(app1)

        # Priya applied to Job 3 (ML Engineer)
        cand_dict_priya = {
            "headline": sp2.headline, "bio": sp2.bio,
            "skills": sp2.skills, "projects": sp2.projects,
            "experience": sp2.experience
        }
        match_priya_job3 = match_candidate_to_job(cand_dict_priya, {
            "title": job3.title, "description": job3.description,
            "required_skills": job3.required_skills, "preferred_skills": job3.preferred_skills
        })
        
        app2 = Application(
            job_id=job3.id,
            student_id=student_2.id,
            status="Interview Scheduled",
            match_score=match_priya_job3["overall_score"],
            required_coverage=match_priya_job3["required_coverage"],
            preferred_coverage=match_priya_job3["preferred_coverage"],
            text_similarity=match_priya_job3["text_similarity"],
            readiness_prediction="High Readiness",
            readiness_probability=91.2,
            model_version_used="v1.0.0-logistic",
            match_breakdown=match_priya_job3,
            recruiter_notes="Exceptional clarity on SHAP explainability and bias auditing. Technical interview round 1 scheduled.",
            status_history=[
                {"status": "Interested", "timestamp": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(), "note": "Expressed interest"},
                {"status": "Shortlisted", "timestamp": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(), "note": "Shortlisted for high ML match"},
                {"status": "Interview Scheduled", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(), "note": "Technical screen scheduled for Thursday"}
            ],
            applied_at=datetime.now(timezone.utc) - timedelta(days=4)
        )
        db.add(app2)

        # Sneha applied to Job 2 (Backend Systems)
        cand_dict_sneha = {
            "headline": sp3.headline, "bio": sp3.bio,
            "skills": sp3.skills, "projects": sp3.projects,
            "experience": sp3.experience
        }
        match_sneha_job2 = match_candidate_to_job(cand_dict_sneha, {
            "title": job2.title, "description": job2.description,
            "required_skills": job2.required_skills, "preferred_skills": job2.preferred_skills
        })
        
        app3 = Application(
            job_id=job2.id,
            student_id=student_3.id,
            status="Under Review",
            match_score=match_sneha_job2["overall_score"],
            required_coverage=match_sneha_job2["required_coverage"],
            preferred_coverage=match_sneha_job2["preferred_coverage"],
            text_similarity=match_sneha_job2["text_similarity"],
            readiness_prediction="Moderate Readiness",
            readiness_probability=68.5,
            model_version_used="v1.0.0-logistic",
            match_breakdown=match_sneha_job2,
            recruiter_notes="Solid backend foundation. Check experience with distributed caching in Redis.",
            status_history=[
                {"status": "Interested", "timestamp": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(), "note": "Expressed interest"},
                {"status": "Under Review", "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "note": "Under initial resume review"}
            ],
            applied_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(app3)

        print("Seeding In-App Notifications...")
        n1 = Notification(
            user_id=student_1.id,
            title="Application Shortlisted: CloudScale Systems",
            message="Congratulations! Your application for 'Full Stack Software Engineer' has been shortlisted by the engineering team.",
            notification_type="status_change",
            link="/student/jobs",
            is_read=False
        )
        n2 = Notification(
            user_id=student_2.id,
            title="Interview Scheduled: Nexus Innovations",
            message="Your technical interview for 'Machine Learning & Data Intelligence Engineer' is scheduled. Check your email for calendar invite.",
            notification_type="interview_reminder",
            link="/student/jobs",
            is_read=False
        )
        n3 = Notification(
            user_id=recruiter_1.id,
            title="High Match Candidate Applied",
            message="Arjun Sharma applied to 'Full Stack Software Engineer' with a 88% required skill coverage.",
            notification_type="job_match",
            link="/recruiter/jobs",
            is_read=True
        )
        db.add_all([n1, n2, n3])

        print("Seeding Sample Saved Report...")
        rep1 = Report(
            user_id=student_1.id,
            report_type="skill_gap",
            title="Career Gap Analysis: Full Stack Developer",
            target_role_or_job="Full Stack Developer",
            overall_score=85.2,
            summary="Candidate exhibits strong frontend and backend proficiency with verified project implementations in React, TypeScript, and FastAPI. Primary growth opportunities lie in distributed caching (Redis) and automated CI/CD pipeline deployment.",
            methodology="Composite Score = (50% * Required Skill Coverage) + (25% * Preferred Skill Coverage) + (25% * TF-IDF Cosine Similarity)",
            data=match_arjun_job1
        )
        db.add(rep1)

        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
