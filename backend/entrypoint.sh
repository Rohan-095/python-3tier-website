#!/bin/sh
set -e
if [ "$RUN_MIGRATIONS" = "true" ]; then
  python manage.py migrate --noinput
fi
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile -
