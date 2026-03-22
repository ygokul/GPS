FROM php:8.1-apache

# Set Render expected port
ARG PORT=10000
ENV PORT=${PORT}

# Install MySQL extension
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy PHP files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html/

# Make Apache listen on the Render port
RUN sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf && \
    sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Expose the Render port
EXPOSE ${PORT}

# Use foreground Apache entrypoint
CMD ["apache2-foreground"]