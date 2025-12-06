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
    admin_data: bd_schemas.AdminProductApproval, 
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """
    Approuve une soumission.
    Prend en compte le 'category' (typeSpecifique) envoyé par le front pour le scoring.
    """
    try:
        # L'appel au CRUD modifié ci-dessus
        result = await bd_crud.approve_submission(db, submission_id, admin_data)
        
        # Gestion du retour (Tuple ou Objet simple)
        if isinstance(result, tuple):
            approved_product, submitting_user_id = result
        else:
            approved_product = result
            submitting_user_id = None

        print(f"--- Produit approuvé et créé : {approved_product.product_name} ---")

        # --- NOTIFICATION PUSH ---
        if submitting_user_id:
            # On lance la notification en tâche de fond (background task) ou directement ici
            # pour ne pas bloquer si ça échoue.
            try:
                submitting_user = await auth_crud.get_user_by_id(db, submitting_user_id)
                if submitting_user and getattr(submitting_user, 'userPushToken', None):
                    token = submitting_user.userPushToken
                    title = "✅ Produit Validé !"
                    body = f"Merci ! Votre produit '{approved_product.product_name}' a été ajouté à DZnutri."
                    
                    # Appel de votre fonction de push (assurez-vous qu'elle existe et est importée)
                    # await send_expo_push(...) 
                    print(f"Notification envoyée à l'utilisateur {submitting_user_id}")
            except Exception as e:
                print(f"⚠️ Erreur notification push : {e}")
        # -------------------------

        return {
            "message": "Soumission approuvée avec succès",
            "product": approved_product,
            "uploader_id": submitting_user_id
        }

    except ValueError as e:
        # Gestion propre des erreurs métier (ex: soumission déjà traitée)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Gestion des erreurs imprévues (bug code, db, etc.)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur interne lors de l'approbation: {str(e)}")
          

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
