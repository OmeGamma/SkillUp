from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Any, Generator, Type

from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import operators
from sqlalchemy.sql.elements import (
    BinaryExpression,
    BindParameter,
    BooleanClauseList,
    Grouping,
    UnaryExpression,
)
from fastapi import HTTPException, status

from app.services.mongodb_service import mongodb_service

Base = declarative_base()


def _model_types() -> tuple[Type[Any], ...]:
    from app.models.application import Application
    from app.models.audit import FairnessAuditLog
    from app.models.job import Job
    from app.models.ml_model import TrainedModel
    from app.models.notification import Notification
    from app.models.profile import RecruiterProfile, StudentProfile
    from app.models.report import Report
    from app.models.user import User

    return (
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


def _column_names(model: Type[Any]) -> tuple[str, ...]:
    return tuple(column.name for column in model.__table__.columns)


def _default_value(column: Any) -> Any:
    default = column.default
    if default is None:
        return None
    value = default.arg
    if callable(value):
        return value(None)
    return value


def _document_values(model: Type[Any], document: dict[str, Any]) -> dict[str, Any]:
    values = {name: document[name] for name in _column_names(model) if name in document}
    if "id" in values and values["id"] is None and document.get("_id") is not None:
        values["id"] = document["_id"]
    if model.__tablename__ == "reports" and values.get("id") is None:
        values["id"] = document.get("report_id")
    return values


def _serialize(instance: Any) -> dict[str, Any]:
    model = type(instance)
    values: dict[str, Any] = {}
    for column in model.__table__.columns:
        name = column.name
        value = getattr(instance, name, None)
        if value is None:
            value = _default_value(column)
        if value is None and column.nullable is False and column.default is None:
            continue
        values[name] = value
    return values


def _unwrap(expression: Any) -> Any:
    while isinstance(expression, Grouping):
        expression = expression.element
    return expression


def _expression_value(expression: Any) -> Any:
    expression = _unwrap(expression)
    if isinstance(expression, BindParameter):
        return expression.value
    if hasattr(expression, "element"):
        return _expression_value(expression.element)
    type_name = type(expression).__name__
    if type_name == "False_":
        return False
    if type_name == "True_":
        return True
    if type_name == "Null":
        return None
    return expression


def _mongo_filter(expression: Any) -> dict[str, Any]:
    expression = _unwrap(expression)
    if isinstance(expression, BooleanClauseList):
        operator_name = "$or" if expression.operator is operators.or_ else "$and"
        return {operator_name: [_mongo_filter(clause) for clause in expression.clauses]}
    if not isinstance(expression, BinaryExpression):
        raise TypeError(f"Unsupported MongoDB query expression: {type(expression).__name__}")

    left = _unwrap(expression.left)
    right = _unwrap(expression.right)
    if hasattr(left, "key") and hasattr(left, "table"):
        field, value, op = left.key, _expression_value(right), expression.operator
    elif hasattr(right, "key") and hasattr(right, "table"):
        field, value = right.key, _expression_value(left)
        reverse = {
            operators.gt: operators.lt,
            operators.ge: operators.le,
            operators.lt: operators.gt,
            operators.le: operators.ge,
        }
        op = reverse.get(expression.operator, expression.operator)
    else:
        raise TypeError("MongoDB filters must compare a model field with a value.")

    if op is operators.eq:
        return {field: value}
    if op is operators.is_:
        return {field: value}
    if op is operators.ne:
        return {field: {"$ne": value}}
    if op is operators.is_not:
        return {field: {"$ne": value}}
    if op is operators.gt:
        return {field: {"$gt": value}}
    if op is operators.ge:
        return {field: {"$gte": value}}
    if op is operators.lt:
        return {field: {"$lt": value}}
    if op is operators.le:
        return {field: {"$lte": value}}
    if op is operators.in_op:
        return {field: {"$in": list(value)}}
    if op is operators.not_in_op:
        return {field: {"$nin": list(value)}}
    if op in (operators.like_op, operators.ilike_op):
        pattern = re.escape(str(value)).replace("%", ".*").replace("_", ".")
        regex: dict[str, Any] = {"$regex": pattern}
        if op is operators.ilike_op:
            regex["$options"] = "i"
        return {field: regex}
    raise TypeError(f"Unsupported MongoDB query operator: {op!r}")


def _collection_name(model: Type[Any]) -> str:
    return model.__tablename__


class MongoQuery:
    def __init__(self, session: MongoSession, model: Type[Any]):
        self.session = session
        self.model = model
        self.criteria: list[Any] = []
        self.sorts: list[tuple[str, int]] = []
        self.skip_count = 0
        self.limit_count: int | None = None

    def filter(self, *criteria: Any) -> MongoQuery:
        self.criteria.extend(criteria)
        return self

    def order_by(self, *expressions: Any) -> MongoQuery:
        for expression in expressions:
            descending = isinstance(expression, UnaryExpression) and expression.modifier is operators.desc_op
            column = expression.element if isinstance(expression, UnaryExpression) else expression
            self.sorts.append((column.key, -1 if descending else 1))
        return self

    def offset(self, count: int) -> MongoQuery:
        self.skip_count = max(0, count)
        return self

    def limit(self, count: int) -> MongoQuery:
        self.limit_count = max(0, count)
        return self

    def options(self, *_options: Any) -> MongoQuery:
        return self

    def _selector(self) -> dict[str, Any]:
        if not self.criteria:
            return {}
        if len(self.criteria) == 1:
            return _mongo_filter(self.criteria[0])
        return {"$and": [_mongo_filter(criterion) for criterion in self.criteria]}

    def _rows(self, limit_count: int | None = None) -> list[Any]:
        cursor = self.session.database[_collection_name(self.model)].find(self._selector())
        if self.sorts:
            cursor = cursor.sort(self.sorts)
        if self.skip_count:
            cursor = cursor.skip(self.skip_count)
        effective_limit = self.limit_count if limit_count is None else limit_count
        if effective_limit is not None:
            cursor = cursor.limit(effective_limit)
        return [
            self.session._materialize(self.model, document)
            for document in cursor
        ]

    def all(self) -> list[Any]:
        return self._rows()

    def first(self) -> Any | None:
        rows = self._rows(limit_count=1)
        return rows[0] if rows else None

    def one_or_none(self) -> Any | None:
        rows = self._rows()
        if len(rows) > 1:
            raise ValueError("Query returned more than one result.")
        return rows[0] if rows else None

    def count(self) -> int:
        return self.session.database[_collection_name(self.model)].count_documents(
            self._selector()
        )

    def update(self, values: dict[str, Any]) -> int:
        rows = self._rows()
        for row in rows:
            for name, value in values.items():
                setattr(row, name, value)
            self.session.add(row)
        return len(rows)


class MongoSession:
    def __init__(self, database: Any):
        self.database = database
        self._pending: dict[tuple[Type[Any], int], Any] = {}
        self._deleted: list[Any] = []
        self._identity: dict[tuple[Type[Any], int], Any] = {}
        self._snapshots: dict[tuple[Type[Any], int], dict[str, Any]] = {}

    def query(self, model: Type[Any]) -> MongoQuery:
        return MongoQuery(self, model)

    def add(self, instance: Any) -> None:
        self._pending[(type(instance), id(instance))] = instance

    def add_all(self, instances: Iterable[Any]) -> None:
        for instance in instances:
            self.add(instance)

    def delete(self, instance: Any) -> None:
        self._deleted.append(instance)

    def _allocate_id(self, model: Type[Any]) -> int:
        collection = self.database[_collection_name(model)]
        max_document = collection.find_one({}, sort=[("id", -1)])
        if model.__tablename__ == "reports" and max_document is None:
            max_document = collection.find_one({"report_id": {"$exists": True}}, sort=[("report_id", -1)])
        current_max = int((max_document or {}).get("id") or (max_document or {}).get("report_id") or 0)
        counters = self.database["counters"]
        counters.update_one(
            {"_id": f"{model.__tablename__}_id"},
            {"$max": {"seq": current_max}},
            upsert=True,
        )
        result = counters.find_one_and_update(
            {"_id": f"{model.__tablename__}_id"},
            {"$inc": {"seq": 1}},
            return_document=True,
        )
        return int(result["seq"])

    def _materialize(self, model: Type[Any], document: dict[str, Any]) -> Any:
        values = _document_values(model, document)
        identifier = values.get("id")
        if identifier is None:
            return None
        key = (model, identifier)
        instance = self._identity.get(key)
        if instance is None:
            instance = model(**values)
            instance.__dict__["_mongo_id"] = document.get("_id", identifier)
            self._identity[key] = instance
            self._snapshots[key] = _serialize(instance)
            self._hydrate_relationships(instance)
        return instance

    def _related(self, model: Type[Any], criteria: dict[str, Any]) -> list[Any]:
        return [
            self._materialize(model, document)
            for document in self.database[_collection_name(model)].find(criteria)
        ]

    def _hydrate_relationships(self, instance: Any) -> None:
        from app.models.application import Application
        from app.models.job import Job
        from app.models.profile import RecruiterProfile, StudentProfile
        from app.models.user import User

        if isinstance(instance, User):
            instance.__dict__["student_profile"] = next(
                iter(self._related(StudentProfile, {"user_id": instance.id})), None
            )
            instance.__dict__["recruiter_profile"] = next(
                iter(self._related(RecruiterProfile, {"user_id": instance.id})), None
            )
        elif isinstance(instance, Job):
            instance.__dict__["applications"] = self._related(
                Application, {"job_id": instance.id}
            )
        elif isinstance(instance, Application):
            job = self.database["jobs"].find_one({"id": instance.job_id})
            student = self.database["users"].find_one({"id": instance.student_id})
            instance.__dict__["job"] = self._materialize(Job, job) if job else None
            instance.__dict__["student"] = self._materialize(User, student) if student else None

    def _delete_with_dependencies(self, instance: Any) -> None:
        from app.models.job import Job
        from app.models.user import User

        model = type(instance)
        identifier = instance.id
        collection = self.database[_collection_name(model)]
        if isinstance(instance, Job):
            self.database["applications"].delete_many({"job_id": identifier})
        elif isinstance(instance, User):
            recruiter_jobs = self.database["jobs"].find(
                {"recruiter_id": identifier}, {"id": 1}
            )
            job_ids = [job["id"] for job in recruiter_jobs]
            if job_ids:
                self.database["applications"].delete_many({"job_id": {"$in": job_ids}})
            for name in ("student_profiles", "recruiter_profiles", "jobs", "applications", "reports", "notifications"):
                self.database[name].delete_many(
                    {"user_id": identifier} if name in ("student_profiles", "recruiter_profiles", "reports", "notifications")
                    else {"recruiter_id": identifier} if name == "jobs"
                    else {"student_id": identifier}
                )
            self.database["trained_models"].update_many(
                {"created_by": identifier}, {"$set": {"created_by": None}}
            )
            self.database["fairness_audit_logs"].update_many(
                {"audited_by": identifier}, {"$set": {"audited_by": None}}
            )
        collection.delete_one({"_id": instance.__dict__.get("_mongo_id", identifier)})

    def commit(self) -> None:
        for instance in self._deleted:
            self._delete_with_dependencies(instance)

        for instance in self._pending.values():
            model = type(instance)
            if getattr(instance, "id", None) is None:
                instance.id = self._allocate_id(model)
            for column in model.__table__.columns:
                if getattr(instance, column.name, None) is None and column.default is not None:
                    setattr(instance, column.name, _default_value(column))
            values = _serialize(instance)
            mongo_id = instance.__dict__.get("_mongo_id", instance.id)
            self.database[_collection_name(model)].replace_one(
                {"_id": mongo_id},
                {"_id": mongo_id, **values},
                upsert=True,
            )
            key = (model, instance.id)
            self._identity[key] = instance
            self._snapshots[key] = values
            instance.__dict__["_mongo_id"] = mongo_id

        pending_ids = {id(instance) for instance in self._pending.values()}
        for key, instance in list(self._identity.items()):
            if id(instance) in pending_ids or any(instance is deleted for deleted in self._deleted):
                continue
            current = _serialize(instance)
            previous = self._snapshots.get(key, {})
            changes = {name: value for name, value in current.items() if previous.get(name) != value}
            if changes:
                for column in type(instance).__table__.columns:
                    if column.onupdate is not None and column.name not in changes:
                        changes[column.name] = _default_value(column)
                        setattr(instance, column.name, changes[column.name])
                mongo_id = instance.__dict__.get("_mongo_id", instance.id)
                self.database[_collection_name(type(instance))].update_one(
                    {"_id": mongo_id}, {"$set": changes}
                )
                self._snapshots[key] = _serialize(instance)

        self._pending.clear()
        self._deleted.clear()

    def flush(self) -> None:
        self.commit()

    def refresh(self, instance: Any) -> None:
        document = self.database[_collection_name(type(instance))].find_one(
            {"_id": instance.__dict__.get("_mongo_id", getattr(instance, "id", None))}
        )
        if document is None:
            raise LookupError(f"{type(instance).__name__} is no longer present in MongoDB.")
        for name, value in _document_values(type(instance), document).items():
            setattr(instance, name, value)
        self._snapshots[(type(instance), instance.id)] = _serialize(instance)

    def rollback(self) -> None:
        self._pending.clear()
        self._deleted.clear()
        self._identity.clear()
        self._snapshots.clear()

    def close(self) -> None:
        self.rollback()


def initialize_mongodb() -> None:
    database = mongodb_service.database
    for model in _model_types():
        collection = database[_collection_name(model)]
        collection.create_index("id", unique=True, sparse=True)
        for constraint in model.__table__.constraints:
            if constraint.__class__.__name__ == "UniqueConstraint":
                fields = [(column.name, 1) for column in constraint.columns]
                collection.create_index(fields, unique=True)
        highest = collection.find_one({}, sort=[("id", -1)]) or {}
        highest_id = int(highest.get("id") or highest.get("report_id") or 0)
        database["counters"].update_one(
            {"_id": f"{model.__tablename__}_id"},
            {"$max": {"seq": highest_id}},
            upsert=True,
        )
    database["users"].create_index("email", unique=True)
    database["student_profiles"].create_index("user_id", unique=True)
    database["recruiter_profiles"].create_index("user_id", unique=True)
    database["trained_models"].create_index("version", unique=True)
    database["applications"].create_index(
        [("job_id", 1), ("student_id", 1)], unique=True
    )
    database["reports"].update_many(
        {"id": {"$exists": False}, "report_id": {"$exists": True}},
        [{"$set": {"id": "$report_id"}}],
    )


def get_db() -> Generator[MongoSession, None, None]:
    try:
        session = MongoSession(mongodb_service.database)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is unavailable. Check the backend database configuration.",
        ) from exc
    try:
        yield session
    finally:
        session.close()
