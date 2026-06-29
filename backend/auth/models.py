
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
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
    reset_code = Column(String, nullable=True)
    reset_code_expires_at = Column(DateTime, nullable=True)
    # Nombre de tentatives échouées sur le code courant (anti-brute-force).
    reset_code_attempts = Column(Integer, default=0, nullable=False, server_default="0")
    products = relationship("Product", back_populates="user")
    submissions = relationship("Submission", back_populates="submitted_by")
    notifications = relationship("Notification", back_populates="user")


class RefreshToken(Base):
    """Refresh token opaque (non-JWT), stocké HACHÉ.

    Stratégie : access token JWT court + refresh token longue durée renouvelé à
    chaque usage (rotation). À la rotation comme au logout, l'ancien token est
    SUPPRIMÉ (un token réutilisé devient introuvable -> rejeté), ce qui borne
    naturellement la table. Les tokens expirés des sessions abandonnées sont
    purgés à la volée lors des rotations/créations.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)














