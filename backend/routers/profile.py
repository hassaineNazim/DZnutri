from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from auth import security as auth_security
from auth.models import UserTable
from auth.profile_models import UserProfile
from auth import profile_schemas
from utils import calculate_daily_goals

router = APIRouter(tags=["Profile"])

@router.get("/profile", response_model=profile_schemas.UserProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: UserTable = Depends(auth_security.get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Create default profile if not exists
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
    return profile

@router.put("/profile", response_model=profile_schemas.UserProfileResponse)
async def update_profile(
    profile_update: profile_schemas.UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserTable = Depends(auth_security.get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    # Recalculate macros if physical stats are present
    if all([profile.weight, profile.height, profile.birth_date, profile.gender, profile.activity_level]):
        # Calculate age
        from datetime import date
        today = date.today()
        age = today.year - profile.birth_date.year - ((today.month, today.day) < (profile.birth_date.month, profile.birth_date.day))
        
        tdee, protein = calculate_daily_goals(
            weight=profile.weight,
            height=profile.height,
            age=age,
            gender=profile.gender,
            activity_level=profile.activity_level
        )
        
        if tdee:
            profile.daily_calories = tdee
            profile.daily_proteins = protein
            
    await db.commit()
    await db.refresh(profile)
    return profile
