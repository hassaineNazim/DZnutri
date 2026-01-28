"""merge_fixed

Revision ID: 06bc9217495c
Revises: 61c278d7c991, a1b2c3d4e5f6
Create Date: 2026-01-27 00:56:27.802906

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06bc9217495c'
down_revision: Union[str, Sequence[str], None] = ('61c278d7c991', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
