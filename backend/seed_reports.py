import asyncio
from sqlalchemy import text
from database import AsyncSessionLocal

async def seed_scoring_report():
    async with AsyncSessionLocal() as db:
        print("Creating dummy scoring report...")
        await db.execute(text("""
            INSERT INTO reports (type, barcode, description, status, created_at, user_id)
            VALUES ('scoringReport', '123456789', 'Le score semble incorrect pour ce produit (TEST).', 'pending', NOW(), NULL)
        """))
        await db.commit()
        print("Dummy scoring report created.")

if __name__ == "__main__":
    asyncio.run(seed_scoring_report())
