from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.user import User

# DEV MODE: Skip authentication during development
DEV_MODE = True


def get_or_create_dev_user(db: Session) -> User:
    """Get or create dev user for DEV_MODE"""
    dev_user = db.query(User).filter(User.id == 1).first()
    if not dev_user:
        dev_user = db.query(User).first()
    if not dev_user:
        # Create dev user if none exists
        from app.core.security import get_password_hash
        dev_user = User(
            email="dev@test.com",
            password_hash=get_password_hash("dev"),
            is_admin=True,
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)
    return dev_user


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from session cookie"""
    # DEV MODE: Return dev user without auth
    if DEV_MODE:
        return get_or_create_dev_user(db)

    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Get current user if authenticated, None otherwise"""
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        return None

    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    return db.query(User).filter(User.id == int(user_id)).first()


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Require admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Type aliases for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]
AdminUser = Annotated[User, Depends(get_admin_user)]
DbSession = Annotated[Session, Depends(get_db)]
