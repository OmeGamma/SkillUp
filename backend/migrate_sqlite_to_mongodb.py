"""Copy existing SQL rows to MongoDB without modifying the source database."""

from sqlalchemy import MetaData, create_engine, select

from app.core.config import settings
from app.core.database import initialize_mongodb
from app.models import (
    Application,
    FairnessAuditLog,
    Job,
    Notification,
    RecruiterProfile,
    Report,
    StudentProfile,
    TrainedModel,
    User,
)
from app.services.mongodb_service import mongodb_service

MODELS = (
    User,
    StudentProfile,
    RecruiterProfile,
    Job,
    Application,
    Report,
    Notification,
    TrainedModel,
    FairnessAuditLog,
)


def migrate() -> None:
    initialize_mongodb()
    engine = create_engine(settings.LEGACY_DATABASE_URL)
    metadata = MetaData()
    metadata.reflect(bind=engine)
    database = mongodb_service.database
    copied = 0
    skipped = 0

    try:
        with engine.connect() as connection:
            for model in MODELS:
                table = metadata.tables.get(model.__tablename__)
                if table is None:
                    skipped += 1
                    continue

                collection = database[model.__tablename__]
                for row in connection.execute(select(table)).mappings():
                    document = dict(row)
                    identifier = document.get("id")
                    if identifier is None:
                        raise ValueError(
                            f"Cannot migrate {model.__tablename__} row without an id."
                        )
                    document["_id"] = identifier

                    existing = collection.find_one({"id": identifier})
                    if existing is None and model is Report:
                        existing = collection.find_one({"report_id": identifier})
                    if existing is not None:
                        document["_id"] = existing["_id"]
                        collection.replace_one(
                            {"_id": existing["_id"]},
                            document,
                        )
                    else:
                        collection.replace_one(
                            {"_id": identifier},
                            document,
                            upsert=True,
                        )

                    database["counters"].update_one(
                        {"_id": f"{model.__tablename__}_id"},
                        {"$max": {"seq": int(identifier)}},
                        upsert=True,
                    )
                    copied += 1
    finally:
        engine.dispose()

    print(f"Copied {copied} rows to MongoDB; skipped {skipped} missing tables.")


if __name__ == "__main__":
    migrate()
