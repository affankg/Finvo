#!/usr/bin/env bash
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running migrations..."
python manage.py migrate --noinput || echo "Migration failed, continuing..."

echo "Collecting static files..."
python manage.py collectstatic --no-input --clear

echo "Creating superuser if needed..."
python manage.py create_superuser_if_not_exists || true

echo "Starting Gunicorn on port ${PORT:-8080}..."
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
