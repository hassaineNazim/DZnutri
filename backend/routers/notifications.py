from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=List[bd_schemas.NotificationResponse])
async def get_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """Récupère les notifications de l'utilisateur connecté."""
    notifications = await bd_crud.get_user_notifications(db, user_id=current_user.id, unread_only=unread_only, limit=limit)
    return notifications

@router.put("/{notification_id}/read", response_model=bool)
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """Marque une notification comme lue."""
    success = await bd_crud.mark_notification_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return True
