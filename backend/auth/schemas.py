from pydantic import BaseModel

class User(BaseModel):
    id: int
    username: str

# 1. Créez un schéma Pydantic pour recevoir le token du frontend
class GoogleToken(BaseModel):
    id_token: str