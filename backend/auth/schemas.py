from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    id: int
    username: str
    email: str | None = None

class AdminUser(User):
    is_admin: bool

# 1. Créez un schéma Pydantic pour recevoir le token du frontend
class GoogleToken(BaseModel):
    id_token: str = Field(min_length=10, max_length=4096)

# Facebook token payload from mobile
class FacebookToken(BaseModel):
    access_token: str = Field(min_length=10, max_length=4096)

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    # Minimum 8 caractères (aligné sur les recommandations NIST : on privilégie
    # la longueur à la complexité). max_length borne la charge utile (bcrypt ne
    # prend de toute façon en compte que les ~72 premiers octets).
    password: str = Field(min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    token: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8, max_length=128)

class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=512)
