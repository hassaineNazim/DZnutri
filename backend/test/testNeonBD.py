import asyncio
import asyncpg
import ssl
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL not set in .env")

# Fix scheme: remove "+asyncpg"
DATABASE_URL_ASYNCPG = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def test_connection():
    try:
        ssl_context = ssl.create_default_context()

        conn = await asyncpg.connect(DATABASE_URL_ASYNCPG, ssl=ssl_context)
        row = await conn.fetchrow("SELECT version();")
        print("✅ Connected successfully!")
        print("Postgres version:", row["version"])
        await conn.close()
    except Exception as e:
        print("❌ Connection failed:", e)

if __name__ == "__main__":
    asyncio.run(test_connection())
