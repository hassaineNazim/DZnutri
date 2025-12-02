"""Add reset code columns

Revision ID: 2e67d527ee46
Revises: 885b8838dfaf
Create Date: 2025-11-30 10:16:29.134495

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2e67d527ee46'
down_revision: Union[str, Sequence[str], None] = '885b8838dfaf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # On commente ces lignes car les colonnes existent déjà dans la base
    # op.add_column('users', sa.Column('reset_code', sa.String(), nullable=True))
    # op.add_column('users', sa.Column('reset_code_expires_at', sa.DateTime(), nullable=True))
    pass  # On met 'pass' pour que la fonction ne soit pas vide


def downgrade() -> None:
    """Downgrade schema."""
    # On garde ça au cas où on voudrait annuler plus tard
    op.drop_column('users', 'reset_code_expires_at')
    op.drop_column('users', 'reset_code')
    # ### end Alembic commands ###
