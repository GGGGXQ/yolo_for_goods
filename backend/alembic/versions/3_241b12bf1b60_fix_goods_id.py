"""fix_goods_id

Revision ID: 241b12bf1b60
Revises: 4cd65bbc2e1d
Create Date: 2026-05-01 23:28:15.510657

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '241b12bf1b60'
down_revision: Union[str, Sequence[str], None] = '4cd65bbc2e1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('goods_id',
               existing_type=sa.VARCHAR(length=36),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('goods_id',
               existing_type=sa.VARCHAR(length=36),
               nullable=False)
