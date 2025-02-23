#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
sudo apt-get install -y build-essential git nginx certbot python3-certbot-nginx

# Create app directory
sudo mkdir -p /opt/jitsi-meet
sudo chown -R ubuntu:ubuntu /opt/jitsi-meet

# Clone the repository
git clone https://github.com/jitsi/jitsi-meet.git /opt/jitsi-meet
cd /opt/jitsi-meet

# Install dependencies
npm install

# Build the application
make

# Setup Nginx configuration
sudo tee /etc/nginx/sites-available/jitsi-meet <<EOF
server {
    listen 80;
    server_name YOUR_DOMAIN;  # Replace with your domain

    root /opt/jitsi-meet;
    index index.html;

    location = /config.js {
        alias /opt/jitsi-meet/config.js;
    }

    location = /interface_config.js {
        alias /opt/jitsi-meet/interface_config.js;
    }

    location = /external_api.js {
        alias /opt/jitsi-meet/libs/external_api.min.js;
    }

    location ~ ^/libs/(.*) {
        alias /opt/jitsi-meet/libs/\$1;
    }

    location ~ ^/static/(.*) {
        alias /opt/jitsi-meet/static/\$1;
    }

    location ~ ^/css/(.*) {
        alias /opt/jitsi-meet/css/\$1;
    }

    location ~ ^/sounds/(.*) {
        alias /opt/jitsi-meet/sounds/\$1;
    }

    location ~ ^/images/(.*) {
        alias /opt/jitsi-meet/images/\$1;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/jitsi-meet /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt (interactive)
echo "Please run the following command manually after updating your domain in the Nginx config:"
echo "sudo certbot --nginx -d YOUR_DOMAIN"

# Create a service file for Jitsi Meet
sudo tee /etc/systemd/system/jitsi-meet.service <<EOF
[Unit]
Description=Jitsi Meet Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/jitsi-meet
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable jitsi-meet
sudo systemctl start jitsi-meet

echo "Deployment complete! Please:"
echo "1. Update the domain in /etc/nginx/sites-available/jitsi-meet"
echo "2. Run: sudo certbot --nginx -d YOUR_DOMAIN"
echo "3. Configure your DNS to point to this server"
echo "4. Update config.js with your specific settings" 