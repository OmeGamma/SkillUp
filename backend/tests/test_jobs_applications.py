import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_jobs_list_unauthenticated():
    res = client.get("/api/v1/jobs")
    assert res.status_code == 200
    jobs = res.json()
    assert len(jobs) >= 1
    assert "title" in jobs[0]
    assert "required_skills" in jobs[0]

def test_student_and_recruiter_workflow():
    # Login recruiter
    r_res = client.post("/api/v1/auth/login", json={
        "email": "recruiter@omegamma.com",
        "password": "recruiter123"
    })
    r_token = r_res.json()["access_token"]
    
    # Recruiter creates job
    create_job_res = client.post("/api/v1/jobs", json={
        "title": "Automated Test Engineer",
        "organization": "CloudScale Systems",
        "description": "Building automated testing pipelines in Python and Pytest.",
        "required_skills": ["Python", "Unit Testing", "Git"],
        "preferred_skills": ["Docker", "CI/CD"],
        "location": "Remote",
        "work_mode": "Remote"
    }, headers={"Authorization": f"Bearer {r_token}"})
    assert create_job_res.status_code == 200
    job_id = create_job_res.json()["id"]

    # Student logs in
    s_res = client.post("/api/v1/auth/login", json={
        "email": "arjun.sharma@skillup.com",
        "password": "student123"
    })
    s_token = s_res.json()["access_token"]

    # Student expresses interest
    apply_res = client.post("/api/v1/applications/express-interest", json={
        "job_id": job_id
    }, headers={"Authorization": f"Bearer {s_token}"})
    assert apply_res.status_code == 200

    # Student checks my-applications
    my_apps = client.get("/api/v1/applications/student/my-applications", headers={"Authorization": f"Bearer {s_token}"})
    assert my_apps.status_code == 200
    app_list = my_apps.json()
    matching_app = [a for a in app_list if a["job_id"] == job_id]
    assert len(matching_app) == 1
    assert "recruiter_notes" not in matching_app[0] # Strict confidentiality check!

    # Recruiter views candidates
    cand_res = client.get(f"/api/v1/applications/recruiter/job/{job_id}", headers={"Authorization": f"Bearer {r_token}"})
    assert cand_res.status_code == 200
    candidates = cand_res.json()
    assert len(candidates) == 1
    app_id = candidates[0]["id"]
    assert "recruiter_notes" in candidates[0] # Recruiter sees notes field

    # Recruiter updates status with confidential note
    status_update = client.put(f"/api/v1/applications/{app_id}/status", json={
        "status": "Shortlisted",
        "recruiter_notes": "Passed initial automated verification filter",
        "notification_message": "You have been shortlisted for Automated Test Engineer."
    }, headers={"Authorization": f"Bearer {r_token}"})
    assert status_update.status_code == 200

    # Verify student receives notification
    notifs = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {s_token}"})
    assert notifs.status_code == 200
    assert any("shortlisted" in n["title"].lower() or "shortlisted" in n["message"].lower() for n in notifs.json())
