"""track product source

Revision ID: 8c1d4e7f2a90
Revises: 7f2a9c4d1e08
Create Date: 2026-08-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c1d4e7f2a90"
down_revision: Union[str, Sequence[str], None] = "7f2a9c4d1e08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "produits",
        sa.Column("source", sa.String(), nullable=False, server_default="legacy"),
    )


def downgrade() -> None:
    op.drop_column("produits", "source")
