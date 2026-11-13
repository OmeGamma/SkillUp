from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User
from app.models.profile import StudentProfile, RecruiterProfile
from app.schemas.auth import UserRegister, UserLogin, TokenResponse
from app.services.mongodb_service import mongodb_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive or not found")
    return user

def get_optional_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        return None
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles. Your role is '{current_user.role}'."
            )
        # Check recruiter approval
        if current_user.role == "recruiter" and current_user.recruiter_status != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Recruiter account pending administrator onboarding approval."
            )
        return current_user
    return role_checker

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")
        
    # Recruiter accounts require approval by default unless specified
    recruiter_status = "approved" if req.role in ["student", "admin"] else "pending"
    
    user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role=req.role,
        is_active=True,
        recruiter_status=recruiter_status
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create respective profile
    if req.role == "student":
        student_profile = StudentProfile(
            user_id=user.id,
            headline="Aspiring Software Engineer",
            bio="Passionate about building scalable applications and mastering new technologies.",
            target_role="Full Stack Developer",
            location="Bangalore, India",
            education=[],
            skills=[],
            projects=[],
            experience=[],
            certifications=[],
            assessment_scores={"coding_score": 75, "dsa_score": 70, "mock_interview_score": 72, "system_design_score": 65}
        )
        db.add(student_profile)
    elif req.role == "recruiter":
        recruiter_profile = RecruiterProfile(
            user_id=user.id,
            organization=req.organization or "Tech Partner Inc",
            designation=req.designation or "Technical Talent Partner"
        )
        db.add(recruiter_profile)
        
    db.commit()
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "recruiter_status": user.recruiter_status
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        mongodb_service.log_auth_event(
            event_type="login",
            user_id=user.id if user else 0,
            email=req.email.lower().strip(),
            role=user.role if user else "unknown",
            ip_address=client_ip,
            user_agent=user_agent,
            status="failed",
            details={"reason": "invalid_credentials"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        
    if not user.is_active:
        mongodb_service.log_auth_event(
            event_type="login",
            user_id=user.id,
            email=user.email,
            role=user.role,
            ip_address=client_ip,
            user_agent=user_agent,
            status="failed",
            details={"reason": "account_disabled"}
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been disabled.")
        
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    # Log successful login event to MongoDB
    mongodb_service.log_auth_event(
        event_type="login",
        user_id=user.id,
        email=user.email,
        role=user.role,
        ip_address=client_ip,
        user_agent=user_agent,
        status="success"
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "recruiter_status": user.recruiter_status
        }
    }

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user)):
    """Log user logout event and record to MongoDB."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    mongodb_service.log_auth_event(
        event_type="logout",
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        ip_address=client_ip,
        user_agent=user_agent,
        status="success"
    )
    return {"message": "Logged out successfully", "user_id": current_user.id}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = None
    if current_user.role == "student" and current_user.student_profile:
        sp = current_user.student_profile
        profile_data = {
            "headline": sp.headline,
            "target_role": sp.target_role,
            "completeness_score": sp.completeness_score,
            "is_discoverable": sp.is_discoverable
        }
    elif current_user.role == "recruiter" and current_user.recruiter_profile:
        rp = current_user.recruiter_profile
        profile_data = {
            "organization": rp.organization,
            "designation": rp.designation
        }
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "recruiter_status": current_user.recruiter_status,
        "profile": profile_data
    }
