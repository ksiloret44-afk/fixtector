# Guide de déploiement VPS - FixTector

## Configuration minimale recommandée

### Pour démarrer (petite entreprise)
- **CPU** : 2 cœurs
- **RAM** : 4 GB ⚠️ (2 GB minimum mais non recommandé)
- **Stockage** : 50 GB SSD
- **OS** : Ubuntu 22.04 LTS

### Pour la production (moyenne entreprise)
- **CPU** : 4 cœurs
- **RAM** : 8 GB
- **Stockage** : 100 GB SSD
- **OS** : Ubuntu 22.04 LTS

## Installation rapide

### 1. Préparation du serveur

```bash
# Mise à jour
sudo apt update && sudo apt upgrade -y

# Installation Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification
node --version  # Doit afficher v20.x.x
npm --version   # Doit afficher 9.x.x ou supérieur

# Installation Git
sudo apt install -y git

# Installation PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installation Nginx
sudo apt install -y nginx
```

### 2. Déploiement de l'application

```bash
# Créer un utilisateur pour l'application (optionnel mais recommandé)
sudo adduser --disabled-password --gecos "" fixtector
sudo su - fixtector

# Cloner le repository
git clone https://github.com/votre-repo/fixtector.git
cd fixtector

# Installer les dépendances
npm install --production

# Générer les clients Prisma
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# Créer le fichier .env.local
cat > .env.local << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
EOF

# Initialiser les bases de données
npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss
npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss

# Construire l'application
npm run build

# Créer le dossier pour les logos
mkdir -p public/logos
chmod 755 public/logos
```

### 3. Configuration PM2

```bash
# Créer le fichier ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fixtector',
    script: 'npm',
    args: 'start',
    cwd: '/home/fixtector/fixtector',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Créer le dossier logs
mkdir -p logs

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées
```

### 4. Configuration Nginx

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/fixtector
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTP vers HTTPS (après configuration SSL)
    # return 301 https://$server_name$request_uri;

    # Pour l'instant, proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour les uploads de fichiers
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Taille maximale des uploads (logos, photos)
    client_max_body_size 10M;
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/fixtector /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 5. Configuration SSL (Let's Encrypt)

```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Génération du certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Le certificat sera renouvelé automatiquement
```

### 6. Configuration du firewall

```bash
# Installation de UFW
sudo apt install -y ufw

# Autoriser SSH (important avant d'activer le firewall !)
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 7. Configuration des sauvegardes

```bash
# Créer un script de sauvegarde
cat > /home/fixtector/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/fixtector/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarder les bases de données
tar -czf $BACKUP_DIR/db_$DATE.tar.gz prisma/*.db prisma/companies/*.db

# Sauvegarder les fichiers uploadés
tar -czf $BACKUP_DIR/files_$DATE.tar.gz public/logos public/photos

# Supprimer les sauvegardes de plus de 7 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /home/fixtector/backup.sh

# Ajouter une tâche cron pour les sauvegardes quotidiennes
(crontab -l 2>/dev/null; echo "0 2 * * * /home/fixtector/backup.sh") | crontab -
```

## Commandes utiles

### Gestion de l'application

```bash
# Voir les logs en temps réel
pm2 logs fixtector

# Redémarrer l'application
pm2 restart fixtector

# Arrêter l'application
pm2 stop fixtector

# Voir le statut
pm2 status

# Monitoring
pm2 monit
```

### Maintenance

```bash
# Mettre à jour l'application
cd /home/fixtector/fixtector
git pull
npm install --production
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma
npm run build
pm2 restart fixtector

# Vérifier l'espace disque
df -h

# Vérifier l'utilisation mémoire
free -h

# Vérifier les processus
htop
```

## Variables d'environnement

Fichier `.env.local` à créer à la racine du projet :

```env
# Base de données principale
DATABASE_URL_MAIN=file:./prisma/main.db

# NextAuth
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-secret-aleatoire-tres-long

# Base URL publique
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com

# Optionnel : Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@votre-domaine.com

# Optionnel : SMS (Twilio)
TWILIO_ACCOUNT_SID=votre-sid
TWILIO_AUTH_TOKEN=votre-token
TWILIO_PHONE_NUMBER=+33612345678
```

## Optimisations

### Pour réduire l'utilisation RAM

1. **Limiter les instances PM2** : `instances: 1` dans ecosystem.config.js
2. **Activer la compression Nginx** :
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

3. **Nettoyer régulièrement les logs** :
```bash
pm2 flush  # Vider les logs PM2
```

### Pour améliorer les performances

1. **Activer le cache Next.js** (déjà fait avec `force-dynamic` où nécessaire)
2. **Utiliser un CDN** pour les assets statiques (Cloudflare, etc.)
3. **Optimiser les images** avant upload
4. **Configurer Redis** pour le cache (optionnel, nécessite installation)

## Monitoring

### Outils recommandés

- **PM2 Plus** : Monitoring gratuit (https://pm2.io)
- **Uptime Robot** : Monitoring de disponibilité (gratuit)
- **Cloudflare** : CDN + Analytics (gratuit)

### Alertes

Configurer des alertes pour :
- Utilisation CPU > 80%
- Utilisation RAM > 90%
- Espace disque < 20%
- Application down

## Sécurité

### Checklist

- [ ] Firewall configuré (UFW)
- [ ] SSL/TLS activé (HTTPS)
- [ ] NEXTAUTH_SECRET fort et unique
- [ ] Mots de passe forts pour tous les comptes
- [ ] Fail2ban installé et configuré
- [ ] Mises à jour système automatiques
- [ ] Sauvegardes automatiques configurées
- [ ] Logs surveillés régulièrement

### Installation Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Support

En cas de problème :
1. Vérifier les logs : `pm2 logs fixtector`
2. Vérifier Nginx : `sudo tail -f /var/log/nginx/error.log`
3. Vérifier les ressources : `htop`, `df -h`, `free -h`
4. Redémarrer les services : `pm2 restart fixtector`, `sudo systemctl restart nginx`

