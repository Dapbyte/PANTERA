
FROM php:8.5.12-cli-bookworm

# System dependencies dan PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    bcmath \
    zip \
    pcntl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer 2
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

CMD composer install && php artisan serve --host=0.0.0.0 --port=8000

WORKDIR /var/www/html

EXPOSE 8000
