"""Fusion des migrations

Revision ID: b71d0dcfd7a2
Revises: 2e67d527ee46, bb2c39e8f957
Create Date: 2025-12-02 12:46:35.567149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b71d0dcfd7a2'
down_revision: Union[str, Sequence[str], None] = ('2e67d527ee46', 'bb2c39e8f957')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
