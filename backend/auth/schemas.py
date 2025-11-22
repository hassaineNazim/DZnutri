from pydantic import BaseModel

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