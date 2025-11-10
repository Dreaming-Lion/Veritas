from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.databases import get_db
from app.repository.user_repo import get_user_by_email, create_user
from app.schemas.auth import SignupIn, LoginIn, UserOut, TokenOut
from app.utils.security import verify_password, create_access_token

router = APIRouter()

@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    exists = get_user_by_email(db, payload.email)
    if exists:
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")

    user = create_user(
        db=db,
        nickname=payload.name.strip(),
        email=payload.email.lower().strip(),
        password=payload.password,
    )
    return UserOut(
        id=user.id,
        nickname=user.nickname,
        email=user.email,
        created_at=user.created_at,
    )

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    token = create_access_token({"sub": str(user.id), "email": user.email, "nickname": user.nickname})
    return TokenOut(access_token=token)
