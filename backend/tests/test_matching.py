import pytest
from app.services.matcher import match_candidate_to_job, compute_tfidf_similarity
from app.services.skill_catalog import normalize_skill, normalize_skill_list

def test_skill_normalization():
    assert normalize_skill("reactjs") == "React"
    assert normalize_skill("python3") == "Python"
    assert normalize_skill("postgres") == "PostgreSQL"
    assert normalize_skill("k8s") == "Kubernetes"
    assert normalize_skill("fast-api") == "FastAPI"

def test_tfidf_similarity():
    sim = compute_tfidf_similarity(
        "Experienced Python and FastAPI backend developer with PostgreSQL skills",
        "Looking for a Python developer proficient in FastAPI and PostgreSQL database design"
    )
    assert sim > 20.0 # Meaningful positive text similarity

def test_candidate_matching():
    candidate = {
        "headline": "Full Stack Engineer",
        "bio": "Building scalable web apps",
        "skills": [
            {"name": "React", "source": "project", "verified": True},
            {"name": "TypeScript", "source": "project", "verified": True},
            {"name": "Python", "source": "project", "verified": True},
            {"name": "FastAPI", "source": "project", "verified": True}
        ],
        "projects": [
            {
                "title": "Cloud Dashboard",
                "description": "Full stack project built with React, TypeScript, and FastAPI",
                "technologies": ["React", "TypeScript", "FastAPI"]
            }
        ],
        "resume_raw_text": "Arjun Sharma, Full stack software engineer with React and FastAPI experience"
    }

    job = {
        "title": "Full Stack Engineer",
        "description": "Requires React, TypeScript, Python and FastAPI",
        "required_skills": ["React", "TypeScript", "Python", "FastAPI"],
        "preferred_skills": ["Docker", "PostgreSQL"]
    }

    res = match_candidate_to_job(candidate, job)
    assert res["required_coverage"] == 100.0
    assert len(res["matched_required"]) == 4
    assert len(res["missing_preferred"]) == 2
    assert res["overall_score"] >= 50.0
    assert "formula" in res["methodology"]
