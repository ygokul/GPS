FROM php:8.1-apache

# Set Render expected port default (can be overridden by Render ENV)
ARG PORT=10000
ENV PORT=${PORT}

# Install MySQL extension
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy PHP files
COPY . /var/www/html/

# Copy custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set permissions
RUN chown -R www-data:www-data /var/www/html/

# Expose the Render port
EXPOSE 10000

# Use the entrypoint script to configure Apache port at runtime
CMD ["/usr/local/bin/docker-entrypoint.sh"]