"""Quest system and player progression

Revision ID: 002
Revises: 001
Create Date: 2026-01-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create characters table first (referenced by users)
    op.create_table(
        'characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('sprite_key', sa.String(length=100), nullable=False),
        sa.Column('level_required', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('quests_required', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('coin_cost', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_characters_id'), 'characters', ['id'], unique=False)
    op.create_index(op.f('ix_characters_name'), 'characters', ['name'], unique=True)

    # Add player progression fields to users
    # Using batch mode for SQLite compatibility
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('player_level', sa.Integer(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('current_xp', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('coins', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('selected_character_id', sa.Integer(), nullable=True))

    # Create quests table
    op.create_table(
        'quests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('difficulty', sa.String(length=50), nullable=False),
        sa.Column('xp_reward', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('coin_reward', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('node_x', sa.Integer(), nullable=False),
        sa.Column('node_y', sa.Integer(), nullable=False),
        sa.Column('level_requirement', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('prerequisite_quests', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('level_id', sa.Integer(), nullable=True),
        sa.Column('star_thresholds', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['level_id'], ['levels.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quests_id'), 'quests', ['id'], unique=False)
    op.create_index(op.f('ix_quests_slug'), 'quests', ['slug'], unique=True)

    # Create quest_progress table
    op.create_table(
        'quest_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('quest_id', sa.Integer(), nullable=False),
        sa.Column('stars_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('best_action_count', sa.Integer(), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['quest_id'], ['quests.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'quest_id', name='uq_user_quest')
    )
    op.create_index(op.f('ix_quest_progress_id'), 'quest_progress', ['id'], unique=False)
    op.create_index(op.f('ix_quest_progress_user_id'), 'quest_progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_quest_progress_quest_id'), 'quest_progress', ['quest_id'], unique=False)


def downgrade() -> None:
    # Drop quest_progress
    op.drop_index(op.f('ix_quest_progress_quest_id'), table_name='quest_progress')
    op.drop_index(op.f('ix_quest_progress_user_id'), table_name='quest_progress')
    op.drop_index(op.f('ix_quest_progress_id'), table_name='quest_progress')
    op.drop_table('quest_progress')

    # Drop quests
    op.drop_index(op.f('ix_quests_slug'), table_name='quests')
    op.drop_index(op.f('ix_quests_id'), table_name='quests')
    op.drop_table('quests')

    # Drop user progression columns
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('selected_character_id')
        batch_op.drop_column('coins')
        batch_op.drop_column('current_xp')
        batch_op.drop_column('player_level')

    # Drop characters
    op.drop_index(op.f('ix_characters_name'), table_name='characters')
    op.drop_index(op.f('ix_characters_id'), table_name='characters')
    op.drop_table('characters')
