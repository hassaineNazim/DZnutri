from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import crud as bd_crud

router = APIRouter(tags=["History"])

@router.post("/api/history/{product_id}")
async def save_scan_history(
    
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour sauvegarder un scan dans l'historique."""
    await bd_crud.add_scan_to_history(db, user_id=current_user.id, product_id=product_id)
    return {"status": "success", "message": "Scan sauvegardé"}

@router.get("/api/history")
async def get_scan_history(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint sauvegardant l'historique de l'utilisateur.
    """
    history = await bd_crud.get_user_history(db, user_id=current_user.id)
    return history

@router.delete("/api/history/product/{product_id}") 
async def delete_history_item(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour supprimer un produit de l'historique de l'utilisateur.
    """
    try:
        # On passe le product_id à la fonction CRUD
        await bd_crud.delete_scan_from_history(
            db, user_id=current_user.id, product_id=product_id
        )
        return {"status": "success", "message": "Historique supprimé"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    

@router.get("/api/history/stats")
async def get_history_stats(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint sécurisé pour récupérer les statistiques de l'historique de l'utilisateur.
    """
    stats = await bd_crud.get_user_history_stats(db, user_id=current_user.id)

    return stats
