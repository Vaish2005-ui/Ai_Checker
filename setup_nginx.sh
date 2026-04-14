#!/bin/bash
set -ex

# Move default nginx to port 81 so our proxy can use port 80
sed -i 's/listen       80;/listen       81;/g' /etc/nginx/nginx.conf
sed -i 's/listen       \[::]:80;/listen       [::]:81;/g' /etc/nginx/nginx.conf

# Write our reverse proxy config
cat > /etc/nginx/conf.d/api.conf << 'NGINXCONF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
NGINXCONF

# Test and restart
nginx -t
systemctl restart nginx
sleep 1

# Verify
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost/health
echo " — Nginx proxy OK"
