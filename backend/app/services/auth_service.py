"""Authentication service."""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Use pbkdf2_sha256 instead of bcrypt for better compatibility with Python 3.13+
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_reset_token(email: str) -> str:
    """Create a password reset token."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": email, "type": "reset", "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None


async def authenticate_user(
    email: Optional[str] = None,
    username: Optional[str] = None,
    phone: Optional[str] = None,
    password: str = "",
) -> Optional["User"]:
    """Authenticate a user by email/username/phone and password."""
    from app.repositories.user import User
    user = None

    if email:
        user = await User.find_one(User.email == email)
    elif username:
        user = await User.find_one(User.username == username)
    elif phone:
        user = await User.find_one(User.phone == phone)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active or user.is_banned:
        return None

    return user


async def save_refresh_token(user_id: str, token_hash: str) -> "RefreshToken":
    """Save a refresh token to the database."""
    from app.repositories.refresh_token import RefreshToken
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow()
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await refresh_token.insert()
    return refresh_token


async def revoke_refresh_token(token_hash: str) -> bool:
    """Revoke a refresh token."""
    from app.repositories.refresh_token import RefreshToken
    token = await RefreshToken.find_one(RefreshToken.token_hash == token_hash)
    if token:
        token.is_revoked = True
        await token.save()
        return True
    return False


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return pwd_context.hash(token)

