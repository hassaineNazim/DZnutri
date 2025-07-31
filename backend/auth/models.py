from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from ..database import Base

class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    

class User(BaseModel):
    id: int
    username: str




