import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from backend/.env and root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillUp"
    PROJECT_TAGLINE: str = "Build Skills. Predict Readiness. Unlock Opportunities."
    DEVELOPED_BY: str = "OmeGamma"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skillup_omegamma_super_secret_local_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Used only by the optional one-time SQLite-to-MongoDB migration script.
    LEGACY_DATABASE_URL: str = os.getenv(
        "LEGACY_DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'skillup.db'}",
    )
    
    # MongoDB is the primary application datastore; keep this URI backend-only.
    MONGODB_URI: str | None = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or os.getenv("MONGODB_CONNECTION_STRING")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME") or os.getenv("MONGO_DB_NAME", "skillup_db")
    
    # File Storage
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    REPORTS_DIR: Path = BASE_DIR / "storage" / "reports"
    MODELS_DIR: Path = BASE_DIR / "storage" / "models"
    DATASETS_DIR: Path = BASE_DIR / "storage" / "datasets"
    
    # Max upload size: 10MB
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx"}

    class Config:
        env_file = (str(BASE_DIR / ".env"), str(BASE_DIR.parent / ".env"), ".env")
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
