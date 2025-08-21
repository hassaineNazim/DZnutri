
from pydantic import BaseModel
from typing import Optional, Dict, Any 
from datetime import datetime

# --- 1. Le Schéma de Base ---
# Cette classe contient tous les champs communs que l'on retrouve
# à la fois lors de la création et de la lecture d'un produit.
# C'est une bonne pratique pour ne pas se répéter (principe DRY).
class ProductBase(BaseModel):
    barcode: str
    product_name: str
    brand: Optional[str] = None # Optional[str] signifie que le champ peut être un string ou None (null)
    nutriments: Optional[Dict[str, Any]] = None # Un dictionnaire optionnel pour les nutriments
    ingredients_text: Optional[str] = None
    # On ajoute les nouveaux champs que nous avons définis
    image_url: Optional[str] = None
    quantity: Optional[str] = None
    category: Optional[str] = None
    additives_tags: Optional[Dict[str, Any]] = None

class SubmissionBase(BaseModel):
    barcode: str
    image_front_url: str
    brand: str
    productName : str 
    image_ingredients_url: Optional[str] = None
    typeProduct: str
    


# --- 2. Le Schéma de Création ---
# Cette classe définit ce que l'API s'attend à recevoir lorsqu'un utilisateur
# veut AJOUTER un nouveau produit. Elle hérite de ProductBase.
# Pour l'instant, elle est identique, mais on pourrait plus tard y ajouter
# des champs spécifiques à la création.
class ProductCreate(ProductBase):
    pass # "pass" signifie qu'elle ne contient aucun champ supplémentaire pour le moment


# --- 3. Le Schéma de Lecture ---
# Cette classe définit la structure des données que l'API RENVERRA
# à l'application. Elle hérite aussi de ProductBase.
class Product(ProductBase):
    # En plus des champs de base, on inclut l'ID, qui est généré
    # par la base de données et donc connu seulement après la création.
    id: int
    # On pourrait aussi ajouter les champs de métadonnées ici
    is_verified: bool
    
    # --- Configuration importante ---
    # Cette ligne est essentielle. Elle dit à Pydantic qu'il peut
    # lire les données non pas depuis un dictionnaire, mais directement
    # depuis un objet ORM (votre modèle SQLAlchemy "Product").
    # Cela permet de convertir facilement un objet de la base de données
    # en un objet JSON pour l'API.
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

