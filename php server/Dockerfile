FROM php:8.1-apache

# Install MySQL extension
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy PHP files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html/

# Expose port 80
EXPOSE 80