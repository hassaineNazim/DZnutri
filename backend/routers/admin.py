from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from utils import send_expo_push

router = APIRouter(tags=["Admin"])

@router.get("/api/admin/submissions")
async def get_submissions_for_admin(
    status: str = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint sécurisé pour que l'admin récupère les soumissions.
    """
    submissions = await bd_crud.get_all_submissions(db, status=status)
    return {"submissions": submissions, "count": len(submissions)}

@router.post("/api/admin/submissions/{submission_id}/approve")
async def approve_product_submission(
    submission_id: int,
    
    # On attend un corps de requête avec les données de l'admin
    admin_data: bd_schemas.AdminProductApproval, 
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),

):

    """
    Endpoint pour approuver une soumission. Reçoit les données complètes de l'admin.
    """
    try:
        
        # approve_submission now returns (created_product, submitting_user_id)
        result = await bd_crud.approve_submission(db, submission_id, admin_data)
      
        if isinstance(result, tuple):
            approved_product, submitting_user_id = result
            print(f"--- Produit approuvé : {approved_product} ---", flush=True)
        else:
            approved_product = result
            submitting_user_id = None

        # Notify the submitting user if they have a stored Expo push token
        if submitting_user_id:
            try:
                submitting_user = await auth_crud.get_user_by_id(db, submitting_user_id)
                if submitting_user and getattr(submitting_user, 'userPushToken', None):
                    to_token = submitting_user.userPushToken 
                    
                    title = "Votre produit a été approuvé"
                    body = f"Le produit {getattr(approved_product, 'product_name', None) or getattr(approved_product, 'barcode', '')} a été ajouté."
                    await send_expo_push(db, submitting_user_id, to_token, title, body, data={"product_id": getattr(approved_product, 'id', None)})
                 
            except Exception as e:
                print(f"Erreur lors de l'envoi de la notification push: {e}")

        return {
            "message": "Soumission approuvée avec succès",
            "product": approved_product,
            "uploader_id": submitting_user_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/api/admin/submissions/{submission_id}/reject")
async def reject_product_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """
    Endpoint pour rejeter une soumission.
    """
    
    try:
        rejected_submission = await bd_crud.reject_submission(db, submission_id)
        return {
            "message": "Soumission rejetée avec succès",
            "submission": rejected_submission
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rejet: {str(e)}")

@router.get("/api/admin/profile", response_model=auth_schemas.AdminUser)
async def get_admin_profile(
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint sécurisé qui retourne le profil de l'admin actuellement connecté.
    """
    return current_user

@router.put("/api/admin/product/{barcode}")
async def update_product_admin(
    barcode: str, 
    product_update: bd_schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Met à jour un produit (Admin seulement) et recalcule le score.
    """
    updated_product = await bd_crud.update_product(db, barcode, product_update)
    
    if not updated_product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
        
    return updated_product
