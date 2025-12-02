from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Physical Stats
    height = Column(Float, nullable=True) # in cm
    weight = Column(Float, nullable=True) # in kg
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True) # 'male', 'female', 'other'
    activity_level = Column(String, nullable=True) # 'sedentary', 'light', 'moderate', 'active', 'very_active'
    
    # Health & Preferences
    allergies = Column(JSON, default=list) # List of strings e.g. ['gluten', 'peanuts']
    medical_conditions = Column(JSON, default=list) # List of strings e.g. ['diabetes']
    diet_type = Column(String, nullable=True) # 'vegan', 'keto', 'paleo', etc.
    disliked_ingredients = Column(JSON, default=list) # List of strings
    
    # Calculated Goals
    daily_calories = Column(Integer, nullable=True)
    daily_proteins = Column(Integer, nullable=True) # in grams

    # Relationship
    user = relationship("UserTable", backref="profile")
