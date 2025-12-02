from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class UserProfileBase(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    
    allergies: List[str] = []
    medical_conditions: List[str] = []
    diet_type: Optional[str] = None
    disliked_ingredients: List[str] = []

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    daily_calories: Optional[int] = None
    daily_proteins: Optional[int] = None

    class Config:
        from_attributes = True
