# app/api/routes_auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError, ExpiredSignatureError
import os

from app.db.databases import get_db
from app.repository.user_repo import get_user_by_email, create_user, get_user_by_id  # ⬅️ get_user_by_id 추가
from app.schemas.auth import SignupIn, LoginIn, UserOut, TokenOut
from app.utils.security import verify_password, create_access_token
from app.utils.security import SECRET_KEY, ALGORITHM  

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)

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

def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰이 만료되었습니다.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다.")

def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if cred is None or not cred.scheme.lower() == "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 정보가 없습니다.")
    payload = _decode_token(cred.credentials)

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 payload가 잘못되었습니다.")

    try:
        user_id = int(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 subject 형식이 잘못되었습니다.")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="사용자를 찾을 수 없습니다.")
    return user
