from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "produits"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    nutriments = Column(JSON, nullable=True) 
    ingredients_text = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("UserTable", back_populates="products") 

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_verified = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    quantily = Column(String, nullable=True)
    category = Column(String, nullable=True)
    additives_tags = Column(JSON, nullable=True)
    custom_score = Column(Integer, nullable=True)

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    barcode = Column(String, index=True, nullable=False)
    image_front_url = Column(String, nullable=False)
    image_ingredients_url = Column(String, nullable=False)
    status = Column(String, default="pending", index=True)
    submitted_at = Column(DateTime, server_default=func.now())
    typeProduct = Column(String, nullable=True)

    submitted_by_user_id = Column(Integer, ForeignKey("users.id"))
    submitted_by = relationship("UserTable", back_populates="submissions")

print("--- Le fichier des modèles PRODUIT est chargé ---")