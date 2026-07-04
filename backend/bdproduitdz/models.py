from sqlalchemy import JSON, Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum as SqlEnum, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

# JSONB sur PostgreSQL (binaire, indexable GIN) ; JSON générique sur les autres
# dialectes (les tests utilisent SQLite, qui ne sait pas compiler JSONB).
PortableJSONB = JSONB().with_variant(JSON(), "sqlite")


class Product(Base):
    __tablename__ = "produits"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    nutriments = Column(PortableJSONB, nullable=True)
    ingredients_text = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("UserTable", back_populates="products") 

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_verified = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    additives_tags = Column(PortableJSONB, nullable=True)
    custom_score = Column(Integer, nullable=True)

    nutri_score = Column(String) # La lettre du Nutri-Score (a, b, c...)
    nova_group = Column(Integer) # Le degré de transformation (1, 2, 3, ou 4)
    ecoscore_grade = Column(String) # La lettre de l'Eco-Score
    detail_custom_score = Column(PortableJSONB, nullable=True)

    # Index composites pour la recherche par catégorie triée par score
    # (utilisés par /api/search, /api/categories et la recherche d'alternatives).
    __table_args__ = (
        Index("ix_products_category_score", "category", "custom_score"),
        Index("ix_products_subcategory_score", "subcategory", "custom_score"),
        # Tri global par score (recherche/navigation sans filtre catégorie).
        Index("ix_products_custom_score", "custom_score"),
    )


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
    parsed_nutriments = Column(PortableJSONB, nullable=True)
    found_additives = Column(PortableJSONB, nullable=True)
    

    submitted_by_user_id = Column(Integer, ForeignKey("users.id"))
    submitted_by = relationship("UserTable", back_populates="submissions")

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("produits.id"), nullable=False)
    scanned_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        # Liste de l'historique : filtre user_id + tri par date décroissante.
        Index("ix_scan_history_user_scanned", "user_id", "scanned_at"),
        # add_scan_to_history / delete : recherche par (user_id, product_id).
        Index("ix_scan_history_user_product", "user_id", "product_id"),
    )

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
    # server_default (et non `default=func.now` SANS parenthèses : l'objet
    # fonction était envoyé comme paramètre binde -> DataError asyncpg sur
    # chaque upsert d'additifs inconnus).
    first_seen_at = Column(DateTime, server_default=func.now())
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

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # On stocke le barcode pour la simplicité, ou on lie au produit interne
    # Si on lie au produit interne, il FAUT que le produit existe dans la table produits
    # Comme notre logique est "scan -> sauvegarde en DB", le produit devrait exister.
    product_id = Column(Integer, ForeignKey("produits.id"), nullable=False)

    saved_at = Column(DateTime, server_default=func.now())

    product = relationship("Product")

    __table_args__ = (
        # toggle/check favori : recherche par (user_id, product_id) ;
        # liste des favoris : filtre user_id.
        Index("ix_favorites_user_product", "user_id", "product_id"),
    )





class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info") # info, success, warning, error
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("UserTable", back_populates="notifications")

    __table_args__ = (
        # Liste des notifications : filtre user_id + tri par date.
        Index("ix_notifications_user_created", "user_id", "created_at"),
        # Compteur de non-lues : filtre (user_id, read).
        Index("ix_notifications_user_read", "user_id", "read"),
    )


# =============================================================================
# UNIVERS COSMÉTIQUE (parallèle à l'alimentaire, façon Yuka)
# Scan -> score par ingrédients à risque ; si absent -> soumission photo
# avant/arrière -> validation admin. Source de repli : Open Beauty Facts.
# =============================================================================

class CosmeticProduct(Base):
    __tablename__ = "cosmetiques"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    ingredients_text = Column(String, nullable=True)  # liste INCI
    category = Column(String, nullable=True)           # soin visage, shampoing...

    cosmetic_score = Column(Integer, nullable=True)    # 0-100 (façon Yuka)
    score_detail = Column(PortableJSONB, nullable=True)        # {penalites, note...}
    risky_ingredients = Column(PortableJSONB, nullable=True)   # [{name, danger_level, concern}]

    is_verified = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        # Tri par score (liste / alternatives) et navigation par catégorie.
        Index("ix_cosmetiques_score", "cosmetic_score"),
        Index("ix_cosmetiques_category_score", "category", "cosmetic_score"),
    )


class CosmeticSubmission(Base):
    __tablename__ = "cosmetic_submissions"

    id = Column(Integer, primary_key=True)
    barcode = Column(String, index=True, nullable=False)
    product_name = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    category = Column(String, nullable=True)

    image_front_url = Column(String, nullable=False)   # face avant
    image_back_url = Column(String, nullable=True)     # dos (liste INCI)
    ocr_ingredients_text = Column(String, nullable=True)

    status = Column(String, default="pending", index=True)
    submitted_at = Column(DateTime, server_default=func.now())
    submitted_by_user_id = Column(Integer, ForeignKey("users.id"))


class CosmeticIngredient(Base):
    """Référentiel des ingrédients cosmétiques à risque (base du scoring)."""
    __tablename__ = "cosmetic_ingredients"

    id = Column(Integer, primary_key=True)
    # Nom INCI en minuscules (pour le matching insensible à la casse).
    name = Column(String, unique=True, index=True, nullable=False)
    danger_level = Column(Integer, default=1)          # 1 faible, 2 modéré, 3 élevé
    concern = Column(String, nullable=True)            # ex: "perturbateur endocrinien"
    description = Column(String, nullable=True)


class ProductRating(Base):
    """Note (1-5) d'un utilisateur sur un produit, avec commentaire optionnel.

    Une seule note par (utilisateur, produit) : re-noter met à jour l'existante
    (upsert). Clé par code-barres pour couvrir aliments comme cosmétiques.
    """
    __tablename__ = "product_ratings"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)           # 1..5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # barcode est déjà indexé (index=True sur la colonne) ; on ajoute juste la
    # contrainte d'unicité (une seule note par utilisateur et par produit).
    __table_args__ = (
        UniqueConstraint("user_id", "barcode", name="uq_rating_user_barcode"),
    )
