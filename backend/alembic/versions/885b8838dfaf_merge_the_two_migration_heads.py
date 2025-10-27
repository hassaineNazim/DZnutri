"""merge the two migration heads

Revision ID: 885b8838dfaf
Revises: c44e1b34a268, f4d756015072
Create Date: 2025-10-27 19:17:21.379399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '885b8838dfaf'
down_revision: Union[str, Sequence[str], None] = ('c44e1b34a268', 'f4d756015072')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
