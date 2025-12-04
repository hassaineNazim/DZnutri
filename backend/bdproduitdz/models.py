from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum as SqlEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


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
    category = Column(String, nullable=True)
    additives_tags = Column(JSON, nullable=True)
    custom_score = Column(Integer, nullable=True)

    nutri_score = Column(String) # La lettre du Nutri-Score (a, b, c...)
    nova_group = Column(Integer) # Le degré de transformation (1, 2, 3, ou 4)
    ecoscore_grade = Column(String) # La lettre de l'Eco-Score
    detail_custom_score = Column(JSON, nullable=True)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    barcode = Column(String, index=True, nullable=False)
    image_front_url = Column(String, nullable=False)
    image_ingredients_url = Column(String, nullable=True)
    image_nutrition_url = Column(String, nullable=True)
    productName = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    status = Column(String, default="pending", index=True)
    submitted_at = Column(DateTime, server_default=func.now())
    typeProduct = Column(String, nullable=True)
    typeSpecifique = Column(String, nullable=True)
    ocr_ingredients_text = Column(String, nullable=True)
    ocr_nutrition_text = Column(String, nullable=True)
    parsed_nutriments = Column(JSON, nullable=True)
    found_additives = Column(JSON, nullable=True) 
    

    submitted_by_user_id = Column(Integer, ForeignKey("users.id"))
    submitted_by = relationship("UserTable", back_populates="submissions")

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("produits.id"), nullable=False)
    scanned_at = Column(DateTime, server_default=func.now())

class Additif(Base):
    __tablename__ = "additifs"

    id = Column(Integer, primary_key=True)
    e_number = Column(String, unique=True, index=True, nullable=True) 
    sin_number = Column(String, nullable=True)
    ins_number = Column(String, nullable=True)
    name = Column(String, index=True) 
    danger_level = Column(Integer, nullable=True) 
    description = Column(String, nullable=True)
    source = Column(String, nullable=True)
    category = Column(String, nullable=True)


class AdditifPending(Base):
    __tablename__ = "additifs_pending"

    id = Column(Integer, primary_key=True, index=True)
    e_code = Column(String, unique=True, nullable=False, index=True)
    sin_number = Column(String, nullable=True)
    ins_number = Column(String, nullable=True)
    source = Column(String, default="openfoodfacts")
    count = Column(Integer, default=1) 
    first_seen_at = Column(DateTime, default=func.now)
    reviewed = Column(Boolean, default=False)

class ReportType(str, enum.Enum):
    AUTO = "automatiqueReport"   # Détecté par le robot (OCR échoué, etc.)
    USER = "userreportapp"       # L'utilisateur signale une erreur
    SCORING = "scoringReport"    # Problème spécifique au calcul du score

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    
    
    type = Column(SqlEnum(ReportType), nullable=False)
    barcode = Column(String, index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    # Statut du ticket (pending, resolved, ignored)
    status = Column(String, default="pending", index=True)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relations (Optionnel, pour récupérer l'objet user facilement)
    # user = relationship("UserTable", back_populates="reports")





print("--- Le fichier des modèles Produit est chargé ---")

