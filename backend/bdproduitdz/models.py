from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base

class Product(Base):
    __tablename__ = "produits"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    nutriments = Column(JSON, nullable=True) 
    ingredients_text = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_verified = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    quantily = Column(String, nullable=True)
    category = Column(String, nullable=True)
    additives_tags = Column(JSON, nullable=True)
    custom_score = Column(Integer, nullable=True)
