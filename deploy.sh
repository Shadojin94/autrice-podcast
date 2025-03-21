#!/bin/bash

# Script de déploiement automatisé pour l'application Podcast
# Usage: ./deploy.sh [serveur] [domaine]
# Exemple: ./deploy.sh user@example.com example.com

# Vérifier les arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 [utilisateur@serveur] [domaine]"
  echo "Exemple: $0 user@example.com example.com"
  exit 1
fi

SERVER=$1
DOMAIN=$2
APP_DIR="/var/www/podcast"

echo "🚀 Déploiement de l'application Podcast sur $SERVER avec le domaine $DOMAIN"

# Créer un fichier de configuration Nginx temporaire
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Frontend - fichiers statiques
    location / {
        root $APP_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Créer un fichier de configuration PM2 temporaire
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'podcast-backend',
      cwd: '$APP_DIR/backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    }
  ]
};
EOF

# Créer un script d'installation sur le serveur
cat > setup.sh << EOF
#!/bin/bash

# Mettre à jour les paquets
sudo apt update
sudo apt upgrade -y

# Installer Node.js et npm
if ! command -v node &> /dev/null; then
  echo "Installation de Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# Installer Git
if ! command -v git &> /dev/null; then
  echo "Installation de Git..."
  sudo apt install -y git
fi

# Installer Nginx
if ! command -v nginx &> /dev/null; then
  echo "Installation de Nginx..."
  sudo apt install -y nginx
fi

# Installer PM2
if ! command -v pm2 &> /dev/null; then
  echo "Installation de PM2..."
  sudo npm install -g pm2
fi

# Créer le répertoire de l'application
sudo mkdir -p $APP_DIR
sudo chown \$(whoami):\$(whoami) $APP_DIR

# Configurer Nginx
sudo cp nginx.conf /etc/nginx/sites-available/podcast
sudo ln -sf /etc/nginx/sites-available/podcast /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Configurer HTTPS avec Let's Encrypt
echo "Voulez-vous configurer HTTPS avec Let's Encrypt? (o/n)"
read -r setup_https
if [[ \$setup_https == "o" ]]; then
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
fi

echo "✅ Configuration du serveur terminée!"
EOF

# Rendre les scripts exécutables
chmod +x setup.sh

echo "📦 Préparation des fichiers pour le déploiement..."

# Construire le frontend
echo "🔨 Construction du frontend..."
cd frontend
npm install
npm run build
cd ..

# Construire le backend
echo "🔨 Construction du backend..."
cd backend
npm install
npm run build
cd ..

# Créer une archive de déploiement
echo "📦 Création de l'archive de déploiement..."
tar -czf deploy.tar.gz \
  frontend/dist \
  backend/dist \
  backend/package.json \
  backend/package-lock.json \
  backend/.env.example \
  nginx.conf \
  ecosystem.config.js \
  setup.sh

# Transférer les fichiers vers le serveur
echo "📤 Transfert des fichiers vers le serveur..."
ssh $SERVER "mkdir -p ~/podcast-deploy"
scp deploy.tar.gz $SERVER:~/podcast-deploy/

# Exécuter le déploiement sur le serveur
echo "🚀 Exécution du déploiement sur le serveur..."
ssh $SERVER "cd ~/podcast-deploy && \
  tar -xzf deploy.tar.gz && \
  ./setup.sh && \
  cp -r frontend/dist $APP_DIR/frontend/ && \
  mkdir -p $APP_DIR/backend && \
  cp -r backend/dist backend/package.json backend/package-lock.json $APP_DIR/backend/ && \
  cp ecosystem.config.js $APP_DIR/ && \
  cd $APP_DIR/backend && \
  npm install --production && \
  cd .. && \
  pm2 start ecosystem.config.js && \
  pm2 save && \
  pm2 startup"

# Nettoyer les fichiers temporaires
echo "🧹 Nettoyage des fichiers temporaires..."
rm -f nginx.conf ecosystem.config.js setup.sh deploy.tar.gz

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Votre application est maintenant accessible à l'adresse: http://$DOMAIN"
echo "⚙️ Backend API: http://$DOMAIN/api"
