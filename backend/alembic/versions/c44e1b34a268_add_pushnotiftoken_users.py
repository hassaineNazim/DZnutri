"""add_PushNotifToken_users

Revision ID: c44e1b34a268
Revises: 6f6c66fd7f52
Create Date: 2025-10-27 18:30:27.846462

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c44e1b34a268'
down_revision: Union[str, Sequence[str], None] = '6f6c66fd7f52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('userPushToken', sa.String(), nullable=True))
    """Upgrade schema."""
    pass


def downgrade() -> None:
    op.drop_column('users', 'userPushToken')    
    """Downgrade schema."""
    pass
