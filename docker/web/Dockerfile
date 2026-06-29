FROM php:8.3-apache

# Módulos útiles de Apache
RUN a2enmod rewrite headers

# Extensiones PHP para MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

WORKDIR /var/www/html