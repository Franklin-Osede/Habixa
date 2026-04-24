#!/bin/bash
# ==============================================================================
# Habixa EC2 Setup Script (Phase 1 MVP)
# Architecture: Single Box (Postgres + Redis + API + OpenClaw + Nginx)
# OS Provider: Amazon Linux 2023 or Ubuntu 22.04 LTS (Tested on Ubuntu)
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install essential tools (curl, git, ufw, nginx)
echo "🛠 Installing baseline tools..."
sudo apt-get install -y curl git ufw nginx

# 3. Install Docker & Docker Compose Plugin
echo "🐳 Installing Docker & Compose..."
# Remove any old versions
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove -y $pkg; done

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Optional: Add user to docker group (requires logout/login to take effect)
sudo usermod -aG docker $USER

# 4. Configure UFW (Firewall)
echo "🛡 Configuring Firewall (UFW)..."

# DEFAULT DENY (Deny all incoming, allow all outgoing)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# === IMPORTANT SECURITY ===
# BEFORE RUNNING: Replace YOUR_STATIC_IP with your actual IP address to prevent locking yourself out. 
# Example: sudo ufw allow from 203.0.113.5 to any port 22
echo "⚠️  Ensure you allow your IP for SSH! Skipping blanket port 22 access."
# sudo ufw allow from YOUR_STATIC_IP to any port 22

# Allow Web Traffic (HTTP/HTTPS) to hit Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Notice: Ports 8000 (OpenClaw), 3000/3008 (Nest API), 5436 (Postgres), 6380 (Redis)
# are EXPLICITLY NOT OPEN as they will run entirely on 127.0.0.1/Internal Docker Network.

sudo ufw --force enable
sudo ufw status verbose

# 5. Provide Nginx Template Boilerplate
echo "🌐 Writing Nginx configuration template..."
cat << 'EOF' > ~/habixa-nginx-template.conf
server {
    listen 80;
    server_name api.habixa.com; # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:3000; # Adjust to 3008 if needed
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
# Later you will use Certbot to add HTTPS:
# sudo apt-get install certbot python3-certbot-nginx
# sudo certbot --nginx -d api.habixa.com
EOF

echo ""
echo "✅ EC2 Setup Base Complete."
echo "👉 Next steps:"
echo "1. Logout and login again to apply Docker group permissions: 'newgrp docker'"
echo "2. Lock down SSH to your static IP in UFW."
echo "3. Copy your .env and docker-compose.yml here."
echo "4. Use '~/habixa-nginx-template.conf' as a guide for /etc/nginx/sites-available/habixa"
