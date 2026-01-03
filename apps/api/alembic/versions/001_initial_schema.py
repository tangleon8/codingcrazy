"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create levels table
    op.create_table(
        'levels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('json_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_levels_id'), 'levels', ['id'], unique=False)
    op.create_index(op.f('ix_levels_order_index'), 'levels', ['order_index'], unique=False)
    op.create_index(op.f('ix_levels_slug'), 'levels', ['slug'], unique=True)

    # Create progress table
    op.create_table(
        'progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('level_id', sa.Integer(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('best_run_json', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['level_id'], ['levels.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'level_id', name='uq_user_level')
    )
    op.create_index(op.f('ix_progress_id'), 'progress', ['id'], unique=False)
    op.create_index(op.f('ix_progress_level_id'), 'progress', ['level_id'], unique=False)
    op.create_index(op.f('ix_progress_user_id'), 'progress', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_progress_user_id'), table_name='progress')
    op.drop_index(op.f('ix_progress_level_id'), table_name='progress')
    op.drop_index(op.f('ix_progress_id'), table_name='progress')
    op.drop_table('progress')

    op.drop_index(op.f('ix_levels_slug'), table_name='levels')
    op.drop_index(op.f('ix_levels_order_index'), table_name='levels')
    op.drop_index(op.f('ix_levels_id'), table_name='levels')
    op.drop_table('levels')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
