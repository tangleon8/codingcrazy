"""Tests for progress endpoints"""

import pytest
from fastapi.testclient import TestClient

from app.models.level import Level
from app.models.user import User
from app.core.security import get_password_hash


def create_test_level(db, level_data: dict) -> Level:
    """Helper to create a test level"""
    level = Level(**level_data)
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


def create_test_user(db, email: str = "test@example.com", password: str = "testpass") -> User:
    """Helper to create a test user"""
    user = User(
        email=email,
        password_hash=get_password_hash(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_get_progress_empty(client: TestClient, db, test_user_data: dict, test_level_data: dict):
    """Test getting progress when user has no progress"""
    # Create level first
    create_test_level(db, test_level_data)

    # Signup user
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Get progress
    response = client.get("/api/progress", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["is_completed"] == False
    assert data[0]["attempts"] == 0
    assert data[0]["is_unlocked"] == True  # First level should be unlocked


def test_increment_attempts(client: TestClient, db, test_user_data: dict, test_level_data: dict):
    """Test incrementing attempt count"""
    # Create level
    level = create_test_level(db, test_level_data)

    # Signup user
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Increment attempts
    response = client.post(
        "/api/progress/attempt",
        json={"level_id": level.id},
        cookies=cookies
    )
    assert response.status_code == 200
    assert response.json()["attempts"] == 1

    # Increment again
    response = client.post(
        "/api/progress/attempt",
        json={"level_id": level.id},
        cookies=cookies
    )
    assert response.status_code == 200
    assert response.json()["attempts"] == 2


def test_submit_completion(client: TestClient, db, test_user_data: dict, test_level_data: dict):
    """Test submitting a level completion"""
    # Create level
    level = create_test_level(db, test_level_data)

    # Signup user
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Submit completion
    response = client.post(
        "/api/progress/complete",
        json={
            "level_id": level.id,
            "run_data": {
                "action_count": 5,
                "coins_collected": 0
            }
        },
        cookies=cookies
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["progress"]["completed_at"] is not None


def test_submit_completion_improves_best_run(client: TestClient, db, test_user_data: dict, test_level_data: dict):
    """Test that better runs update best_run_json"""
    # Create level
    level = create_test_level(db, test_level_data)

    # Signup user
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # First completion with 10 actions
    client.post(
        "/api/progress/complete",
        json={
            "level_id": level.id,
            "run_data": {"action_count": 10}
        },
        cookies=cookies
    )

    # Second completion with 5 actions (better)
    response = client.post(
        "/api/progress/complete",
        json={
            "level_id": level.id,
            "run_data": {"action_count": 5}
        },
        cookies=cookies
    )

    data = response.json()
    assert data["progress"]["best_run_json"]["action_count"] == 5


def test_level_unlock_sequence(client: TestClient, db, test_user_data: dict, test_level_data: dict):
    """Test that levels unlock in sequence"""
    # Create two levels
    level1_data = {**test_level_data, "slug": "level-1", "title": "Level 1", "order_index": 1}
    level2_data = {**test_level_data, "slug": "level-2", "title": "Level 2", "order_index": 2}

    level1 = create_test_level(db, level1_data)
    level2 = create_test_level(db, level2_data)

    # Signup user
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Check initial progress - only first level unlocked
    response = client.get("/api/progress", cookies=cookies)
    data = response.json()
    assert data[0]["is_unlocked"] == True
    assert data[1]["is_unlocked"] == False

    # Complete first level
    client.post(
        "/api/progress/complete",
        json={"level_id": level1.id, "run_data": {"action_count": 5}},
        cookies=cookies
    )

    # Check progress again - second level should now be unlocked
    response = client.get("/api/progress", cookies=cookies)
    data = response.json()
    assert data[0]["is_unlocked"] == True
    assert data[0]["is_completed"] == True
    assert data[1]["is_unlocked"] == True


def test_unauthenticated_progress_access(client: TestClient):
    """Test that unauthenticated users cannot access progress"""
    response = client.get("/api/progress")
    assert response.status_code == 401
