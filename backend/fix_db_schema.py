import sqlalchemy
from sqlalchemy import create_engine, text, inspect

# URL from alembic.ini
# URL from alembic.ini
DATABASE_URL = "postgresql://neondb_owner:npg_sodZL6C7JDGz@ep-rapid-truth-agfga13q-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

from auth.models import UserTable
from auth.profile_models import UserProfile
from database import Base

def fix_schema():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print("Checking for user_profiles table...")
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as connection:
        # 1. Check users columns
        columns = [col['name'] for col in inspector.get_columns('users')]
        print(f"Current users columns: {columns}")
        
        if 'reset_code' not in columns:
            print("Adding reset_code column...")
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_code VARCHAR"))
        else:
            print("reset_code column already exists.")
            
        if 'reset_code_expires_at' not in columns:
            print("Adding reset_code_expires_at column...")
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_code_expires_at TIMESTAMP"))
        else:
            print("reset_code_expires_at column already exists.")

        # 2. Check reports table
        tables = inspector.get_table_names()
        if 'reports' in tables:
            print("Dropping reports table (as per migration)...")
            connection.execute(text("DROP TABLE reports CASCADE"))
        else:
            print("reports table already dropped.")
            
        if 'user_profiles' in tables:
             print("user_profiles table exists.")
        else:
             print("user_profiles table created (by create_all).")

        connection.commit()
        print("Schema repair complete.")

if __name__ == "__main__":
    fix_schema()
