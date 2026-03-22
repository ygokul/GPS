#!/usr/bin/env bash
set -e

if [ -z "$PORT" ]; then
  PORT=10000
fi

# Update Apache listen port configuration
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s#<VirtualHost \*:.*>#<VirtualHost \*:${PORT}>#" /etc/apache2/sites-available/000-default.conf

# Ensure Apache listens on all interfaces
if ! grep -q "^ServerName" /etc/apache2/apache2.conf; then
  echo "ServerName 0.0.0.0" >> /etc/apache2/apache2.conf
fi

exec apache2-foreground
