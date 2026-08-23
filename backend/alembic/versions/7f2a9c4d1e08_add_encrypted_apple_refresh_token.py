"""add encrypted Apple refresh token

Revision ID: 7f2a9c4d1e08
Revises: 4b138974121d
Create Date: 2026-08-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f2a9c4d1e08"
down_revision: Union[str, Sequence[str], None] = "4b138974121d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("apple_refresh_token_encrypted", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "apple_refresh_token_encrypted")
