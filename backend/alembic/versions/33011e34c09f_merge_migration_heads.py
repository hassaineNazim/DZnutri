"""merge migration heads

Revision ID: 33011e34c09f
Revises: 2e67d527ee46, bb2c39e8f957
Create Date: 2025-12-05 07:11:54.828883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33011e34c09f'
down_revision: Union[str, Sequence[str], None] = ('2e67d527ee46', 'bb2c39e8f957')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
