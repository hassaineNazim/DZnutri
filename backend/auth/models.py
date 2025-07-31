
from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy.orm import relationship

class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    products = relationship("Product", back_populates="user")
    submissions = relationship("Submission", back_populates="submitted_by")


print("--- Le fichier des modèles AUTH est chargé ---")
    






