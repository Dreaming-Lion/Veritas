# app/schemas/auth.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, model_validator

class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    password_confirm: str

    @field_validator("password")
    @classmethod
    def validate_pw_len(cls, v: str):
        if len(v) < 6:
            raise ValueError("비밀번호는 6자 이상이어야 합니다.")
        return v

    @field_validator("password_confirm")
    @classmethod
    def validate_pw2_len(cls, v: str):
        if len(v) < 6:
            raise ValueError("비밀번호 확인은 6자 이상이어야 합니다.")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("비밀번호가 일치하지 않습니다.")
        return self

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    nickname: str
    email: EmailStr
    created_at: datetime

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

# 선택: 명시적 export (오타/섀도잉 방지)
__all__ = ["SignupIn", "LoginIn", "UserOut", "TokenOut"]
