from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    username: str
    email: str | None = None

class AdminUser(User):
    is_admin: bool

# 1. Créez un schéma Pydantic pour recevoir le token du frontend
class GoogleToken(BaseModel):
    id_token: str

# Facebook token payload from mobile
class FacebookToken(BaseModel):
    access_token: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    token: str
    new_password: str