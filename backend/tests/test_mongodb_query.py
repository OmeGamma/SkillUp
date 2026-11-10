from app.core.database import _mongo_filter
from app.models.job import Job


def test_mongo_filter_supports_case_insensitive_search():
    selector = _mongo_filter(
        (Job.title.ilike("%python%")) | (Job.organization.ilike("%python%"))
    )

    assert selector == {
        "$or": [
            {"title": {"$regex": ".*python.*", "$options": "i"}},
            {"organization": {"$regex": ".*python.*", "$options": "i"}},
        ]
    }


def test_mongo_filter_supports_in_and_equality():
    assert _mongo_filter(Job.id.in_([2, 4])) == {"id": {"$in": [2, 4]}}
    assert _mongo_filter(Job.status == "active") == {"status": "active"}


def test_mongo_filter_combines_multiple_criteria():
    selector = _mongo_filter(
        (Job.status == "active") & (Job.work_mode == "Remote")
    )

    assert selector == {
        "$and": [{"status": "active"}, {"work_mode": "Remote"}]
    }
