from fastapi import APIRouter, HTTPException, status, Response
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import DbSession, CurrentUser
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, AuthResponse


router = APIRouter(prefix="/auth", tags=["auth"])


def set_auth_cookie(response: Response, token: str):
    """Set the authentication cookie"""
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.COOKIE_MAX_AGE,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, response: Response, db: DbSession):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create and set auth token
    token = create_access_token(data={"sub": str(user.id)})
    set_auth_cookie(response, token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Account created successfully"
    )


@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin, response: Response, db: DbSession):
    """Authenticate a user - DEV MODE: auto-creates user if not exists, accepts any password"""
    user = db.query(User).filter(User.email == user_data.email).first()

    # DEV MODE: Auto-create user if doesn't exist
    if not user:
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            is_admin=True  # Make all dev users admin for testing
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # DEV MODE: Skip password verification
    # if not verify_password(user_data.password, user.password_hash):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid email or password"
    #     )

    # Create and set auth token
    token = create_access_token(data={"sub": str(user.id)})
    set_auth_cookie(response, token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Logged in successfully"
    )


@router.post("/logout")
def logout(response: Response):
    """Log out the current user"""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: CurrentUser):
    """Get current authenticated user info"""
    return UserResponse.model_validate(current_user)
