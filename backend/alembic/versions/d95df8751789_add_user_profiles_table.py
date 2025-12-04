"""add user_profiles table

Revision ID: d95df8751789
Revises: 33011e34c09f
Create Date: 2025-12-05 07:13:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd95df8751789'
down_revision: Union[str, Sequence[str], None] = '33011e34c09f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_profiles table if it doesn't exist
    op.create_table('user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(), nullable=True),
        sa.Column('activity_level', sa.String(), nullable=True),
        sa.Column('allergies', sa.JSON(), nullable=True),
        sa.Column('medical_conditions', sa.JSON(), nullable=True),
        sa.Column('diet_type', sa.String(), nullable=True),
        sa.Column('disliked_ingredients', sa.JSON(), nullable=True),
        sa.Column('daily_calories', sa.Integer(), nullable=True),
        sa.Column('daily_proteins', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_profiles_id'), table_name='user_profiles')
    op.drop_table('user_profiles')
