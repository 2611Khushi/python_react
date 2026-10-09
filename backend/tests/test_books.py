import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def test_book_crud_round_trip(client):
    created = client.post(
        "/api/books",
        json={"title": "Small Things Like These", "author": "Claire Keegan", "genre": "Fiction", "status": "Reading", "pages": 128, "current_page": 32, "rating": None, "notes": ""},
    )
    assert created.status_code == 201
    book_id = created.json()["id"]

    filtered = client.get("/api/books", params={"q": "Claire", "status": "Reading"})
    assert [book["id"] for book in filtered.json()] == [book_id]

    updated = client.put(
        f"/api/books/{book_id}",
        json={"title": "Small Things Like These", "author": "Claire Keegan", "genre": "Fiction", "status": "Finished", "pages": 128, "current_page": 128, "rating": 5, "notes": "Quietly devastating."},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Finished"

    deleted = client.delete(f"/api/books/{book_id}")
    assert deleted.status_code == 204
    assert client.get("/api/books").json() == []


def test_rejects_current_page_above_total(client):
    response = client.post(
        "/api/books",
        json={"title": "A Book", "author": "An Author", "pages": 10, "current_page": 11},
    )
    assert response.status_code == 422
