import logging
from datetime import datetime
from typing import Optional, Dict, Any
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.core.config import settings

logger = logging.getLogger("skillup.mongodb")

class MongoDBService:
    def __init__(self):
        self._client: Optional[pymongo.MongoClient] = None
        self._db: Optional[Any] = None
        self._connected: bool = False
        self._last_error: Optional[str] = None
        self._init_connection()

    def _init_connection(self) -> bool:
        uri = settings.MONGODB_URI
        if not uri:
            self._connected = False
            self._last_error = "MONGODB_URI is not set in environment or .env file."
            logger.info("MongoDB URI not provided; database requests require MONGODB_URI.")
            return False

        try:
            # Set a 5-second timeout so unconfigured/firewalled endpoints do not block FastAPI startup
            self._client = pymongo.MongoClient(
                uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Verify connectivity with ping command
            self._client.admin.command('ping')
            
            # Determine database name
            db_name = settings.MONGODB_DB_NAME
            # If URI specifies a database path (e.g. mongodb+srv://.../dbname?retryWrites=true)
            try:
                default_db = self._client.get_default_database()
                if default_db is not None:
                    db_name = default_db.name
            except Exception:
                pass

            self._db = self._client[db_name]
            self._connected = True
            self._last_error = None

            # Ensure indexes on collections
            self._db["reports"].create_index("id", unique=True, sparse=True)
            self._db["reports"].create_index("report_id", unique=True, sparse=True)
            self._db["reports"].create_index("user_id")
            self._db["reports"].create_index("created_at")
            self._db["auth_audit_logs"].create_index([("event_type", 1), ("timestamp", -1)])
            self._db["auth_audit_logs"].create_index("user_id")

            logger.info(f"Successfully connected to MongoDB database: {db_name}")
            return True

        except (ConnectionFailure, ServerSelectionTimeoutError):
            self._connected = False
            self._last_error = "MongoDB connection timeout or failure."
            logger.warning("Could not connect to MongoDB; check backend URI and network access.")
            return False
        except Exception:
            self._connected = False
            self._last_error = "MongoDB initialization failed."
            logger.exception("MongoDB initialization failed.")
            return False

    def is_connected(self) -> bool:
        if not self._connected or not self._client:
            # Retry connection in case URI was added or network recovered
            if settings.MONGODB_URI:
                return self._init_connection()
            return False
        try:
            self._client.admin.command('ping')
            return True
        except Exception:
            self._connected = False
            return False

    @property
    def database(self):
        if not self.is_connected() or self._db is None:
            raise RuntimeError(
                "MongoDB is unavailable. Verify the backend MONGODB_URI and database network access."
            )
        return self._db

    def get_status(self) -> Dict[str, Any]:
        connected = self.is_connected()
        status_info = {
            "configured": bool(settings.MONGODB_URI),
            "connected": connected,
            "database_name": self._db.name if (connected and self._db is not None) else None,
            "last_error": self._last_error if not connected else None,
            "reports_count": 0,
            "auth_logs_count": 0,
            "users_count": 0,
            "jobs_count": 0,
            "applications_count": 0,
        }
        if connected and self._db is not None:
            try:
                status_info["reports_count"] = self._db["reports"].count_documents({})
                status_info["auth_logs_count"] = self._db["auth_audit_logs"].count_documents({})
                status_info["users_count"] = self._db["users"].count_documents({})
                status_info["jobs_count"] = self._db["jobs"].count_documents({})
                status_info["applications_count"] = self._db["applications"].count_documents({})
            except Exception:
                logger.exception("Failed to read MongoDB collection counts.")
                status_info["count_error"] = "Unable to read MongoDB collection counts."
        return status_info

    def log_auth_event(
        self,
        event_type: str, # "login" or "logout"
        user_id: int,
        email: str,
        role: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown",
        status: str = "success",
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Record a login or logout event to MongoDB auth_audit_logs collection.
        """
        log_doc = {
            "event_type": event_type,
            "user_id": user_id,
            "email": email,
            "role": role,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "status": status,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat(),
            "created_at_dt": datetime.utcnow(),
        }
        self.database["auth_audit_logs"].insert_one(log_doc)

# Singleton instance
mongodb_service = MongoDBService()
