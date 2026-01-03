"""Tests for authentication endpoints"""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_signup_success(client: TestClient, test_user_data: dict):
    """Test successful user registration"""
    response = client.post("/api/auth/signup", json=test_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == test_user_data["email"]
    assert data["message"] == "Account created successfully"
    assert "codingcrazy_session" in response.cookies


def test_signup_duplicate_email(client: TestClient, test_user_data: dict):
    """Test that duplicate email registration fails"""
    # First signup
    client.post("/api/auth/signup", json=test_user_data)

    # Second signup with same email
    response = client.post("/api/auth/signup", json=test_user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client: TestClient, test_user_data: dict):
    """Test successful login"""
    # First create user
    client.post("/api/auth/signup", json=test_user_data)

    # Then login
    response = client.post("/api/auth/login", json=test_user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == test_user_data["email"]
    assert "codingcrazy_session" in response.cookies


def test_login_wrong_password(client: TestClient, test_user_data: dict):
    """Test login with wrong password"""
    # First create user
    client.post("/api/auth/signup", json=test_user_data)

    # Login with wrong password
    response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    """Test login with non-existent user"""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "somepassword"
    })
    assert response.status_code == 401


def test_get_current_user(client: TestClient, test_user_data: dict):
    """Test getting current user info"""
    # Signup and get cookie
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Get current user
    response = client.get("/api/auth/me", cookies=cookies)
    assert response.status_code == 200
    assert response.json()["email"] == test_user_data["email"]


def test_get_current_user_unauthenticated(client: TestClient):
    """Test that unauthenticated users cannot access /me"""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout(client: TestClient, test_user_data: dict):
    """Test logout"""
    # Signup
    signup_response = client.post("/api/auth/signup", json=test_user_data)
    cookies = signup_response.cookies

    # Logout
    response = client.post("/api/auth/logout", cookies=cookies)
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
