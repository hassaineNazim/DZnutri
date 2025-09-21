import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

# --- MODIFICATIONS ICI ---
# 1. Importez la Base centrale partagée
from database import Base
# 2. Importez TOUS vos modules contenant des modèles
from auth import models as auth_models
from bdproduitdz import models as produit_models
# -------------------------

DATABASE_URL = "sqlite+aiosqlite:///./BDGlobal.db"

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def add_test_product():
    """Se connecte à la base de données et insère un produit de test."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(produit_models.Product).where(produit_models.Product.barcode == "66666666"))
        existing_product = result.scalars().first()

        if existing_product:
            print(f"Le produit avec le code-barres 66666666 existe déjà.")
            return

        # Créez votre produit de test avec des données fictives
        # Note : On ne peut pas assigner un owner_id car on ne crée pas d'utilisateur ici
        test_product = produit_models.Product(
            barcode="66666666",
            product_name="Viagra siyasi",
            brand="DzBenGrin",
            category="Politique",
            custom_score=1,
            is_verified=True
        )
        
        
        session.add(test_product)
        await session.commit()
        print(f"Produit '{test_product.product_name}' ajouté avec succès à la base de données !")

if __name__ == "__main__":
    asyncio.run(add_test_product())