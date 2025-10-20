from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

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

class SubmissionBase(BaseModel):
    barcode: str
    image_front_url: str
    brand: str
    productName : str 
    image_ingredients_url: Optional[str] = None
    typeProduct: str
    ocr_ingredients_text: Optional[str] = None
    parsed_nutriments: Optional[Dict[str, Any]]
    found_additives: Optional[List[Dict[str, Any]]] = []

class ProductCreate(ProductBase):
    pass #
class Product(ProductBase):
    
    id: int
    is_verified: bool
    
    class Config:
        orm_mode = True


class SubmissionCreate(SubmissionBase):
    pass


class Submission(SubmissionBase):
    id: int
    status: str
    submitted_at: datetime
    submitted_by_user_id: int

    class Config:
        orm_mode = True


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

