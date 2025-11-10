# utils/security.py
from datetime import datetime, timedelta
from typing import Dict, Any
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "change-this-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def needs_rehash(hashed: str) -> bool:
    return pwd_context.needs_update(hashed)

def create_access_token(data: Dict[str, Any], expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=expires_minutes)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
