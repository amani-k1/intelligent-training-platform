FROM php:8.4-cli

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

CMD php artisan storage:link --force 2>/dev/null; php artisan serve --host=0.0.0.0 --port=8000