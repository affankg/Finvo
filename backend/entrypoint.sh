#!/usr/bin/env bash
set -e

# Apply database migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --no-input

# Create superuser if env provided
python manage.py create_superuser_if_not_exists || true

# Start gunicorn
exec gunicorn bs_engineering_backend.wsgi:application --bind 0.0.0.0:8080
