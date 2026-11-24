#!/usr/bin/env sh
set -e

php artisan storage:link --force || true
php artisan config:clear
php artisan route:clear
php artisan view:clear

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_SEEDER:-false}" = "true" ]; then
  php artisan db:seed --force
fi

PORT="${PORT:-8000}"
exec php -S "0.0.0.0:${PORT}" -t public public/router.php
