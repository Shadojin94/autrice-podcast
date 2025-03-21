# Guide de déploiement sur VPS

Ce guide explique comment déployer l'application Podcast sur un serveur VPS.

## Prérequis

Votre serveur VPS doit avoir les éléments suivants installés :

- Node.js (v16 ou supérieur)
- npm (v8 ou supérieur)
- Git
- Nginx (pour servir l'application et faire office de proxy inverse)
- PM2 (pour gérer les processus Node.js)

## 1. Préparation du serveur

Connectez-vous à votre VPS via SSH :

```bash
ssh utilisateur@adresse-ip-du-vps
```

Installez les dépendances nécessaires si elles ne sont pas déjà installées :

```bash
# Mettre à jour les paquets
sudo apt update
sudo apt upgrade -y

# Installer Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node -v
npm -v

# Installer Git
sudo apt install -y git

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 globalement
sudo npm install -g pm2
```

## 2. Cloner le projet

Créez un répertoire pour votre application et clonez le dépôt Git :

```bash
mkdir -p /var/www/podcast
cd /var/www/podcast
git clone [URL_DE_VOTRE_DÉPÔT_GIT] .
```

## 3. Configuration du backend

### Installation des dépendances

```bash
cd /var/www/podcast/backend
npm install
```

### Configuration des variables d'environnement

Créez un fichier `.env` dans le répertoire backend :

```bash
cp .env.example .env
nano .env
```

Ajoutez les variables d'environnement nécessaires, notamment :

```
OPENAI_API_KEY=votre_clé_api_openai
PORT=3001
```

### Compilation du backend

```bash
npm run build
```

### Configuration de PM2 pour le backend

Créez un fichier de configuration PM2 :

```bash
cd /var/www/podcast
nano ecosystem.config.js
```

Ajoutez la configuration suivante :

```javascript
module.exports = {
  apps: [
    {
      name: 'podcast-backend',
      cwd: '/var/www/podcast/backend',
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
```

Démarrez le backend avec PM2 :

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Configuration du frontend

### Installation des dépendances

```bash
cd /var/www/podcast/frontend
npm install
```

### Construction du frontend

```bash
npm run build
```

Cela créera un répertoire `dist` contenant les fichiers statiques du frontend.

## 5. Configuration de Nginx

Créez un fichier de configuration Nginx pour votre application :

```bash
sudo nano /etc/nginx/sites-available/podcast
```

Ajoutez la configuration suivante :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Frontend - fichiers statiques
    location / {
        root /var/www/podcast/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration et redémarrez Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/podcast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Configuration HTTPS (recommandé)

Pour sécuriser votre application, vous devriez configurer HTTPS avec Let's Encrypt :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions pour obtenir et installer un certificat SSL.

## 7. Maintenance et mises à jour

Pour mettre à jour votre application :

```bash
cd /var/www/podcast
git pull

# Mettre à jour le backend
cd backend
npm install
npm run build
pm2 restart podcast-backend

# Mettre à jour le frontend
cd ../frontend
npm install
npm run build
```

## Dépannage

### Vérifier les logs du backend

```bash
pm2 logs podcast-backend
```

### Vérifier les logs de Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Redémarrer les services

```bash
pm2 restart podcast-backend
sudo systemctl restart nginx
```
# Guide de déploiement sur VPS

Ce guide explique comment déployer l'application Podcast sur un serveur VPS.

## Prérequis

Votre serveur VPS doit avoir les éléments suivants installés :

- Node.js (v16 ou supérieur)
- npm (v8 ou supérieur)
- Git
- Nginx (pour servir l'application et faire office de proxy inverse)
- PM2 (pour gérer les processus Node.js)

## 1. Préparation du serveur

Connectez-vous à votre VPS via SSH :

```bash
ssh utilisateur@adresse-ip-du-vps
```

Installez les dépendances nécessaires si elles ne sont pas déjà installées :

```bash
# Mettre à jour les paquets
sudo apt update
sudo apt upgrade -y

# Installer Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node -v
npm -v

# Installer Git
sudo apt install -y git

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 globalement
sudo npm install -g pm2
```

## 2. Cloner le projet

Créez un répertoire pour votre application et clonez le dépôt Git :

```bash
mkdir -p /var/www/podcast
cd /var/www/podcast
git clone [URL_DE_VOTRE_DÉPÔT_GIT] .
```

## 3. Configuration du backend

### Installation des dépendances

```bash
cd /var/www/podcast/backend
npm install
```

### Configuration des variables d'environnement

Créez un fichier `.env` dans le répertoire backend :

```bash
cp .env.example .env
nano .env
```

Ajoutez les variables d'environnement nécessaires, notamment :

```
OPENAI_API_KEY=votre_clé_api_openai
PORT=3001
```

### Compilation du backend

```bash
npm run build
```

### Configuration de PM2 pour le backend

Créez un fichier de configuration PM2 :

```bash
cd /var/www/podcast
nano ecosystem.config.js
```

Ajoutez la configuration suivante :

```javascript
module.exports = {
  apps: [
    {
      name: 'podcast-backend',
      cwd: '/var/www/podcast/backend',
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
```

Démarrez le backend avec PM2 :

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Configuration du frontend

### Installation des dépendances

```bash
cd /var/www/podcast/frontend
npm install
```

### Construction du frontend

```bash
npm run build
```

Cela créera un répertoire `dist` contenant les fichiers statiques du frontend.

## 5. Configuration de Nginx

Créez un fichier de configuration Nginx pour votre application :

```bash
sudo nano /etc/nginx/sites-available/podcast
```

Ajoutez la configuration suivante :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Frontend - fichiers statiques
    location / {
        root /var/www/podcast/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration et redémarrez Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/podcast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Configuration HTTPS (recommandé)

Pour sécuriser votre application, vous devriez configurer HTTPS avec Let's Encrypt :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions pour obtenir et installer un certificat SSL.

## 7. Maintenance et mises à jour

Pour mettre à jour votre application :

```bash
cd /var/www/podcast
git pull

# Mettre à jour le backend
cd backend
npm install
npm run build
pm2 restart podcast-backend

# Mettre à jour le frontend
cd ../frontend
npm install
npm run build
```

## Dépannage

### Vérifier les logs du backend

```bash
pm2 logs podcast-backend
```

### Vérifier les logs de Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Redémarrer les services

```bash
# Guide de déploiement sur VPS

Ce guide explique comment déployer l'application Podcast sur un serveur VPS.

## Prérequis

Votre serveur VPS doit avoir les éléments suivants installés :

- Node.js (v16 ou supérieur)
- npm (v8 ou supérieur)
- Git
- Nginx (pour servir l'application et faire office de proxy inverse)
- PM2 (pour gérer les processus Node.js)

## 1. Préparation du serveur

Connectez-vous à votre VPS via SSH :

```bash
ssh utilisateur@adresse-ip-du-vps
```

Installez les dépendances nécessaires si elles ne sont pas déjà installées :

```bash
# Mettre à jour les paquets
sudo apt update
sudo apt upgrade -y

# Installer Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier les versions
node -v
npm -v

# Installer Git
sudo apt install -y git

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 globalement
sudo npm install -g pm2
```

## 2. Cloner le projet

Créez un répertoire pour votre application et clonez le dépôt Git :

```bash
mkdir -p /var/www/podcast
cd /var/www/podcast
git clone [URL_DE_VOTRE_DÉPÔT_GIT] .
```

## 3. Configuration du backend

### Installation des dépendances

```bash
cd /var/www/podcast/backend
npm install
```

### Configuration des variables d'environnement

Créez un fichier `.env` dans le répertoire backend :

```bash
cp .env.example .env
nano .env
```

Ajoutez les variables d'environnement nécessaires, notamment :

```
OPENAI_API_KEY=votre_clé_api_openai
PORT=3001
```

### Compilation du backend

```bash
npm run build
```

### Configuration de PM2 pour le backend

Créez un fichier de configuration PM2 :

```bash
cd /var/www/podcast
nano ecosystem.config.js
```

Ajoutez la configuration suivante :

```javascript
module.exports = {
  apps: [
    {
      name: 'podcast-backend',
      cwd: '/var/www/podcast/backend',
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
```

Démarrez le backend avec PM2 :

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Configuration du frontend

### Installation des dépendances

```bash
cd /var/www/podcast/frontend
npm install
```

### Construction du frontend

```bash
npm run build
```

Cela créera un répertoire `dist` contenant les fichiers statiques du frontend.

## 5. Configuration de Nginx

Créez un fichier de configuration Nginx pour votre application :

```bash
sudo nano /etc/nginx/sites-available/podcast
```

Ajoutez la configuration suivante :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Frontend - fichiers statiques
    location / {
        root /var/www/podcast/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration et redémarrez Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/podcast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Configuration HTTPS (recommandé)

Pour sécuriser votre application, vous devriez configurer HTTPS avec Let's Encrypt :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions pour obtenir et installer un certificat SSL.

## 7. Maintenance et mises à jour

Pour mettre à jour votre application :

```bash
cd /var/www/podcast
git pull

# Mettre à jour le backend
cd backend
npm install
npm run build
pm2 restart podcast-backend

# Mettre à jour le frontend
cd ../frontend
npm install
npm run build
```

## Dépannage

### Vérifier les logs du backend

```bash
pm2 logs podcast-backend
```

### Vérifier les logs de Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Redémarrer les services

```bash
pm2 restart podcast-backend
sudo systemctl restart nginx
