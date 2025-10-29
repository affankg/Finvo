#!/usr/bin/env bash
set -e

echo "Waiting for database..."
python << END
import sys
import time
import psycopg2
import os

# Get the DATABASE_URL from environment
db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("DATABASE_URL not set")
    sys.exit(1)

for i in range(30):
    try:
        psycopg2.connect(db_url)
        print("Database is ready!")
        break
    except psycopg2.OperationalError:
        print("Database is not ready. Waiting...")
        time.sleep(1)
    if i == 29:
        print("Could not connect to database")
        sys.exit(1)
END

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Creating superuser if needed..."
python manage.py create_superuser_if_not_exists || true

echo "Starting Gunicorn..."
PORT=${PORT:-8080}
exec gunicorn bs_engineering_backend.wsgi:application \
    --bind 0.0.0.0:${PORT} \
    --workers 2 \
    --threads 2 \
    --timeout 60 \
    --keep-alive 5 \
    --max-requests 500 \
    --max-requests-jitter 50 \
    --graceful-timeout 30 \
    --worker-class=sync \
    --log-level info \
    --access-logfile - \
    --error-logfile -
