"""Fix encryption schema

Revision ID: fix_encryption_schema
Revises: b07e8f3c35cf
Create Date: 2025-01-29 09:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = 'fix_encryption_schema'
down_revision = 'b07e8f3c35cf'
branch_labels = None
depends_on = None


def has_column(table_name, column_name):
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # Create temporary table with correct schema
    op.execute('''
        CREATE TABLE api_key_new (
            id INTEGER NOT NULL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            key VARCHAR(256) NOT NULL,
            encrypted BOOLEAN NOT NULL DEFAULT 0,
            encryption_salt BLOB,
            description TEXT,
            used_with VARCHAR(200),
            project_id INTEGER,
            position INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES project (id),
            UNIQUE (name, project_id)
        )
    ''')
    
    # Copy data from old table to new table
    columns = [c['name'] for c in inspector.get_columns('api_key')]
    common_columns = [c for c in columns if c not in ['encrypted', 'encryption_salt']]
    column_list = ', '.join(common_columns)
    
    op.execute(f'''
        INSERT INTO api_key_new ({column_list})
        SELECT {column_list}
        FROM api_key
    ''')
    
    # Drop old table and rename new table
    op.execute('DROP TABLE api_key')
    op.execute('ALTER TABLE api_key_new RENAME TO api_key')

    # Set default value for any NULL encrypted values
    op.execute('UPDATE api_key SET encrypted = 0 WHERE encrypted IS NULL')
    
    # Make encrypted column NOT NULL with default value False
    with op.batch_alter_table('api_key', schema=None) as batch_op:
        batch_op.alter_column('encrypted',
                            existing_type=sa.Boolean(),
                            nullable=False,
                            server_default=sa.text('0'))


def downgrade():
    # Remove encryption columns
    with op.batch_alter_table('api_key', schema=None) as batch_op:
        batch_op.drop_column('encryption_salt')
        batch_op.drop_column('encrypted')

    # Make encrypted column nullable again
    with op.batch_alter_table('api_key', schema=None) as batch_op:
        batch_op.alter_column('encrypted',
                            existing_type=sa.Boolean(),
                            nullable=True,
                            server_default=None) 