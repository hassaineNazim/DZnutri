"""merge_manual

Revision ID: 61c278d7c991
Revises: 33011e34c09f, 6618ed3d1731
Create Date: 2026-01-27 00:54:33.451670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61c278d7c991'
down_revision: Union[str, Sequence[str], None] = ('33011e34c09f', '6618ed3d1731')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
