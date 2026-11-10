from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import initialize_mongodb
import app.models  # Ensure models are loaded

# Routers
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.resume import router as resume_router
from app.routers.matching import router as matching_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router
from app.routers.ml import router as ml_router
from app.routers.fairness import router as fairness_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description=f"{settings.PROJECT_TAGLINE} | Developed by {settings.DEVELOPED_BY}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; in production restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under API prefix
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(profile_router, prefix=api_v1)
app.include_router(resume_router, prefix=api_v1)
app.include_router(matching_router, prefix=api_v1)
app.include_router(jobs_router, prefix=api_v1)
app.include_router(applications_router, prefix=api_v1)
app.include_router(ml_router, prefix=api_v1)
app.include_router(fairness_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)

from app.services.mongodb_service import mongodb_service

@app.on_event("startup")
def startup_event():
    initialize_mongodb()

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "developer": settings.DEVELOPED_BY,
        "version": settings.VERSION,
        "status": "operational",
        "mongodb": mongodb_service.get_status(),
        "api_docs": "/docs"
    }

@app.get("/health")
def health_check():
    mongo_status = mongodb_service.get_status()
    return {
        "status": "healthy" if mongo_status["connected"] else "unavailable",
        "database": "connected" if mongo_status["connected"] else "disconnected",
        "mongodb": mongo_status,
        "ai_engine": "local_inference_active"
    }
