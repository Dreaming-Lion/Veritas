from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.utils.security import hash_password

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email.lower().strip())).scalar_one_or_none()

def create_user(db: Session, nickname: str, email: str, password: str) -> User:
    user = User(
        nickname=nickname,
        email=email.lower().strip(),
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()