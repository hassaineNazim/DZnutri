from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# Imports de la base de données
from database import get_db

# Imports de VOTRE logique produit
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas

# --- CORRECTION DES IMPORTS AUTH ---
# On suppose que le dossier 'auth' est à la racine, au même niveau que 'bdproduitdz'
from auth import models as auth_models
from auth import security as auth_security
# -----------------------------------

router = APIRouter(tags=["Reports"])

@router.post("/api/reports", response_model=bd_schemas.ReportResponse)
async def create_user_report(
    report: bd_schemas.ReportCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Permet à un utilisateur de signaler une erreur (userreportapp ou scoringReport).
    """
    return await bd_crud.create_report(db, report, user_id=current_user.id)


@router.get("/api/admin/reports", response_model=List[bd_schemas.ReportResponse])
async def get_reports_for_admin(
    db: AsyncSession = Depends(get_db),
    # On sécurise avec get_current_admin pour que seul l'admin puisse voir les reports
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Récupère la liste des signalements pour l'interface admin.
    """
    return await bd_crud.get_pending_reports(db)