#!/bin/sh
set -e

echo "=== Running database migration ==="
python -c "
import os
from app import app
from models import db, User

with app.app_context():
    db.create_all()
    print('Tables created (if not already existing)')

    # Create default admin user if none exists
    if not User.query.filter_by(is_admin=True).first():
        admin_pass = os.environ.get('ADMIN_PASSWORD')
        if not admin_pass:
            raise ValueError('ADMIN_PASSWORD environment variable must be set')
        admin = User(username='admin', email='admin@portfolio.com', is_admin=True)
        admin.set_password(admin_pass)
        db.session.add(admin)
        db.session.commit()
        print('Default admin user created (username: admin)')
    else:
        print('Admin user already exists, skipping')
"
echo "=== Migration complete ==="

exec "$@"
