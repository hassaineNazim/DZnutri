from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class ReportTypeEnum(str, Enum):
    AUTO = "automatiqueReport"
    USER = "userreportapp"
    SCORING = "scoringReport"

# --- PRODUCTS SCHEMAS ---
class ProductBase(BaseModel):
    barcode: str
    product_name: str
    brand: Optional[str] = None 
    nutriments: Optional[Dict[str, Any]] = None 
    ingredients_text: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    additives_tags: Optional[List[str]] = []
    nutri_score: Optional[str] = None  
    nova_group: Optional[int] = None
    ecoscore_grade: Optional[str] = None
    custom_score: Optional[int] = None
    detail_custom_score: Optional[Dict[str, Any]] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    is_verified: bool
    
    class Config:
        from_attributes = True

# --- SUBMISSIONS SCHEMAS ---
class SubmissionBase(BaseModel):
    barcode: str
    productName: Optional[str] = None
    brand: Optional[str] = None
    typeProduct: Optional[str] = None
    typeSpecifique: Optional[str] = None
    
    # Images
    image_front_url: Optional[str] = None
    image_ingredients_url: Optional[str] = None
    image_nutrition_url: Optional[str] = None # La 3ème image
    
    # Données techniques
    ocr_ingredients_text: Optional[str] = None
    ocr_nutrition_text: Optional[str] = None
    parsed_nutriments: Optional[Dict[str, Any]] = None
    found_additives: Optional[List[Dict[str, Any]]] = []
    
    # Meta
    
    status: Optional[str] = "pending"

class SubmissionCreate(SubmissionBase):
    """Utilisé pour créer une soumission"""
    pass

class SubmissionResponse(SubmissionBase):
    """Utilisé pour la réponse de l'API (contient l'ID et les dates)"""
    id: int
    submitted_at: datetime
    submitted_by_user_id: int

    class Config:
        from_attributes = True

# --- ADMIN SCHEMAS ---
class AdminProductApproval(BaseModel):
    product_name: str
    brand: str
    category: Optional[str] = None
    ingredients_text: Optional[str] = None
    nutriments: Optional[Dict[str, Any]] = {}
    additives_tags: Optional[List[str]] = []
    nutriscore_grade: Optional[str] = None
    nova_group: Optional[int] = None
    ecoscore_grade: Optional[str] = None

# --- REPORTS SCHEMAS ---
class ReportCreate(BaseModel):
    barcode: str
    type: ReportTypeEnum
    description: Optional[str] = None
    image_url: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    barcode: Optional[str] = None
    type: ReportTypeEnum
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None
    image_url: Optional[str] = None # Important pour l'affichage front
    
    class Config:
        from_attributes = True