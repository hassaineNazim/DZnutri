from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base 

Base = declarative_base()

class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)


class UserRegister(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):
    id: int
    username: str
    hashed_password: str

class User(BaseModel):
    id: int
    username: str




