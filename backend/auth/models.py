
from sqlalchemy import Column, Integer, String, Boolean
from database import Base
from sqlalchemy.orm import relationship

class UserTable(Base):
    __tablename__ = "users"


    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True) # Ajout de l'email
    google_id = Column(String, unique=True, nullable=True) # Pour stocker l'ID unique de Google 

    hashed_password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    userPushToken = Column(String, nullable=True)  
    products = relationship("Product", back_populates="user")
    submissions = relationship("Submission", back_populates="submitted_by")









print("--- Le fichier des modèles AUTH est chargé ---")
    






