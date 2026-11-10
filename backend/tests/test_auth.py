import uuid

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["platform"] == "SkillUp"
    assert res.json()["developer"] == "OmeGamma"

def test_login_registered_admin():
    email = f"admin.{uuid.uuid4().hex}@example.com"
    registration = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "admin123",
        "full_name": "Test Administrator",
        "role": "admin",
    })
    assert registration.status_code == 200

    res = client.post("/api/v1/auth/login", json={"email": email, "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_login_invalid_credentials():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@skillup.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_register_student_and_me():
    email = f"test.student.{uuid.uuid4().hex}@example.com"

    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Test Student User",
        "role": "student"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]

    # Test me endpoint
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
    assert me_res.json()["role"] == "student"
