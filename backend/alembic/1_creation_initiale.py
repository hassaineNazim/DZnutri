"""Structure initiale de la base de donnees"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1_creation_initiale'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### Table des utilisateurs ###
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('google_id', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('google_id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)
    
    # ### Table des produits ###
    op.create_table('produits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('barcode', sa.String(), nullable=False),
        sa.Column('product_name', sa.String(), nullable=False),
        sa.Column('brand', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('ingredients_text', sa.String(), nullable=True),
        sa.Column('nutriments', sa.JSON(), nullable=True),
        sa.Column('nutriscore_grade', sa.String(), nullable=True),
        sa.Column('nova_group', sa.Integer(), nullable=True),
        sa.Column('additives_tags', sa.JSON(), nullable=True),
        sa.Column('ecoscore_grade', sa.String(), nullable=True),
        sa.Column('custom_score', sa.Integer(), nullable=True),
        sa.Column('detail_custom_score', sa.JSON(), nullable=True),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_produits_barcode'), 'produits', ['barcode'], unique=True)

    # ### Table des soumissions ###
    op.create_table('submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('barcode', sa.String(), nullable=False),
        sa.Column('productName', sa.String(), nullable=True),
        sa.Column('brand', sa.String(), nullable=True),
        sa.Column('typeProduct', sa.String(), nullable=True),
        sa.Column('image_front_url', sa.String(), nullable=False),
        sa.Column('image_ingredients_url', sa.String(), nullable=True),
        sa.Column('ocr_ingredients_text', sa.String(), nullable=True),
        sa.Column('parsed_nutriments', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), server_default='pending', nullable=True),
        sa.Column('submitted_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('submitted_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ### Table des additifs (MODIFIÉE) ###
    op.create_table('additifs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('e_number', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('danger_level', sa.Integer(), nullable=True), # Modifié en Integer
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),      # Ajouté
        sa.Column('category', sa.String(), nullable=True),     # Ajouté
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('e_number')
    )
    
    # ### Table de l'historique des scans ###
    op.create_table('scan_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('product_id', sa.Integer(), sa.ForeignKey('produits.id'), nullable=False),
        sa.Column('scanned_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('scan_history')
    op.drop_table('additifs')
    op.drop_table('submissions')
    op.drop_table('produits')
    op.drop_table('users')