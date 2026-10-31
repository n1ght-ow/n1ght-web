#!/bin/sh
# Install as /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh, mode 755.
# An IP certificate lives about six days, so every successful renewal must reload
# nginx in the same run; certbot's snap timer executes this hook as root.
systemctl reload nginx
