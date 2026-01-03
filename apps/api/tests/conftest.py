"""Pytest configuration and fixtures"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@example.com",
        "password": "testpass123"
    }


@pytest.fixture
def test_level_data():
    """Sample level data for testing"""
    return {
        "slug": "test-level",
        "title": "Test Level",
        "description": "A test level",
        "order_index": 1,
        "json_data": {
            "gridWidth": 5,
            "gridHeight": 5,
            "startPosition": {"x": 0, "y": 2},
            "goals": [{"x": 4, "y": 2}],
            "walls": [],
            "coins": [],
            "hazards": [],
            "allowedMethods": ["move"],
            "instructions": "Test instructions",
            "starterCode": "hero.move('right');",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": False
            }
        }
    }
