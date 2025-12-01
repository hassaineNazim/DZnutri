import sqlalchemy
from sqlalchemy import create_engine, text

# URL from alembic.ini
DATABASE_URL = "postgresql://neondb_owner:npg_sodZL6C7JDGz@ep-rapid-truth-agfga13q-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def fix_alembic():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Check if table exists
        try:
            result = connection.execute(text("SELECT * FROM alembic_version"))
            row = result.fetchone()
            print(f"Current version: {row}")
            
            print("Updating to 885b8838dfaf...")
            connection.execute(text("UPDATE alembic_version SET version_num = '885b8838dfaf'"))
            connection.commit()
            print("Update successful.")
        except Exception as e:
            print(f"Error: {e}")
            # Try creating table if it doesn't exist (unlikely but possible)
            # Or inserting if empty
            try:
                print("Trying insert...")
                connection.execute(text("INSERT INTO alembic_version (version_num) VALUES ('885b8838dfaf')"))
                connection.commit()
                print("Insert successful.")
            except Exception as e2:
                print(f"Insert failed: {e2}")

if __name__ == "__main__":
    fix_alembic()
