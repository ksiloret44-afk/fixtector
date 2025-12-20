# Configuration VPS minimale pour FixTector

## Spécifications matérielles recommandées

### Configuration minimale (petite entreprise, < 10 utilisateurs)
- **CPU** : 1-2 cœurs
- **RAM** : 2 GB (minimum absolu), 4 GB fortement recommandé
- **Stockage** : 30 GB SSD (minimum), 50 GB recommandé
- **Bande passante** : 100 GB/mois

⚠️ **Note importante** : Avec 2 GB de RAM, l'application peut fonctionner mais sera limitée. 4 GB est fortement recommandé pour une utilisation confortable.

### Configuration recommandée (moyenne entreprise, 10-50 utilisateurs)
- **CPU** : 2-4 cœurs
- **RAM** : 4 GB (minimum), 8 GB recommandé
- **Stockage** : 50 GB SSD (minimum), 100 GB recommandé
- **Bande passante** : 500 GB/mois

### Configuration optimale (grande entreprise, 50+ utilisateurs)
- **CPU** : 4+ cœurs
- **RAM** : 8 GB (minimum), 16 GB recommandé
- **Stockage** : 100 GB SSD (minimum), 250 GB+ recommandé
- **Bande passante** : 1 TB+/mois

## Logiciels requis

### Système d'exploitation
- **Linux** : Ubuntu 22.04 LTS ou Debian 12 (recommandé)
- **Alternative** : CentOS 8+, Rocky Linux, ou AlmaLinux

### Runtime et dépendances
- **Node.js** : Version 18.x LTS ou 20.x LTS (minimum)
- **npm** : Version 9.x ou supérieure
- **Git** : Pour le déploiement et les mises à jour

### Base de données
- **SQLite** : Inclus avec Node.js (pas d'installation séparée nécessaire)
- **Alternative** : PostgreSQL ou MySQL pour de meilleures performances avec beaucoup d'utilisateurs

### Serveur web (optionnel mais recommandé)
- **Nginx** : Version 1.20+ (recommandé pour reverse proxy)
- **Alternative** : Apache 2.4+

### Process Manager (recommandé)
- **PM2** : Pour gérer les processus Node.js en production
- **Alternative** : systemd, supervisor

## Ports à ouvrir

- **Port 3000** : Application Next.js (ou port personnalisé)
- **Port 80** : HTTP (si Nginx/Apache)
- **Port 443** : HTTPS (si SSL/TLS activé)
- **Port 22** : SSH (pour l'accès administrateur)

## Espace disque détaillé

### Application
- **Code source** : ~500 MB
- **node_modules** : ~1-2 GB (avec toutes les dépendances : jsPDF, xmlbuilder2, canvas, react-big-calendar, etc.)
- **Build Next.js** : ~300-500 MB

### Bases de données
- **Base principale** (main.db) : ~10-50 MB par entreprise
- **Bases d'entreprise** : ~50-200 MB par entreprise (selon le volume de données)
- **Logs** : ~100-500 MB/mois

### Fichiers uploadés
- **Logos entreprises** : ~1-5 MB par entreprise
- **Photos réparations** : ~10-50 MB par réparation (selon le nombre de photos)
- **PDFs générés** : ~1-5 MB par document

### Estimation totale
- **Minimum** : 30 GB (petite entreprise, avec node_modules complets)
- **Recommandé** : 50-100 GB (croissance prévue)
- **Optimal** : 100 GB+ (avec sauvegardes)

### Répartition détaillée
- **Application + dépendances** : ~2-3 GB
- **Bases de données** : ~100-500 MB par entreprise
- **Fichiers uploadés** : ~1-10 GB selon usage
- **Logs** : ~500 MB - 2 GB/mois
- **Sauvegardes** : ~2-5x la taille des données actives

## Services externes (optionnels)

### Email (SMTP)
- **Gmail SMTP** : Gratuit (limite 500 emails/jour)
- **SendGrid** : Gratuit jusqu'à 100 emails/jour
- **Mailgun** : Gratuit jusqu'à 5000 emails/mois
- **OVH/Scaleway** : Payant selon volume

### SMS
- **Twilio** : Payant (~0.05€/SMS)
- **OVH SMS** : Payant selon volume
- **API personnalisée** : Selon fournisseur

### Stockage cloud (optionnel)
- **AWS S3** : Pour stocker les fichiers
- **Cloudflare R2** : Alternative moins chère
- **Backblaze B2** : Alternative économique

## Variables d'environnement requises

```env
# Base de données principale
DATABASE_URL_MAIN=file:./prisma/main.db

# NextAuth
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-secret-aleatoire-tres-long

# Optionnel : Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@votre-domaine.com

# Optionnel : SMS
TWILIO_ACCOUNT_SID=votre-sid
TWILIO_AUTH_TOKEN=votre-token
TWILIO_PHONE_NUMBER=+33612345678

# Optionnel : Base URL pour les liens
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

## Installation et déploiement

### 1. Prérequis système
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de Git
sudo apt install -y git

# Installation de Nginx (optionnel)
sudo apt install -y nginx

# Installation de PM2
sudo npm install -g pm2
```

### 2. Déploiement de l'application
```bash
# Cloner le repository
git clone https://github.com/votre-repo/fixtector.git
cd fixtector

# Installer les dépendances
npm install

# Générer les clients Prisma
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# Initialiser les bases de données
npx prisma db push --schema=prisma/schema-main.prisma
npx prisma db push --schema=prisma/schema-company.prisma

# Construire l'application
npm run build

# Démarrer avec PM2
pm2 start npm --name "fixtector" -- start
pm2 save
pm2 startup
```

### 3. Configuration Nginx (reverse proxy)
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

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
    }
}
```

### 4. Configuration SSL (Let's Encrypt)
```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Génération du certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

## Monitoring et maintenance

### Outils recommandés
- **PM2 Monitoring** : `pm2 monit`
- **htop** : Monitoring système
- **logrotate** : Rotation des logs
- **fail2ban** : Protection contre les attaques

### Sauvegardes
- **Fréquence** : Quotidienne (recommandé)
- **Contenu** : Bases de données + fichiers uploadés
- **Rétention** : 7-30 jours selon besoins

### Commandes utiles
```bash
# Vérifier l'utilisation des ressources
htop
df -h
free -h

# Voir les logs de l'application
pm2 logs fixtector

# Redémarrer l'application
pm2 restart fixtector

# Vérifier le statut
pm2 status
```

## Coûts estimés (exemples de fournisseurs)

### Configuration minimale
- **Hetzner** : ~4€/mois (CX11 : 1 vCPU, 2 GB RAM, 20 GB SSD)
- **OVH** : ~3.50€/mois (Starter : 1 vCPU, 2 GB RAM, 20 GB SSD)
- **Scaleway** : ~3€/mois (DEV1-S : 1 vCPU, 2 GB RAM, 20 GB SSD)
- **DigitalOcean** : ~6$/mois (Basic : 1 vCPU, 1 GB RAM, 25 GB SSD)

### Configuration recommandée
- **Hetzner** : ~8€/mois (CPX11 : 2 vCPU, 4 GB RAM, 40 GB SSD)
- **OVH** : ~7€/mois (B2-7 : 2 vCPU, 7 GB RAM, 50 GB SSD)
- **Scaleway** : ~8€/mois (DEV1-M : 2 vCPU, 4 GB RAM, 80 GB SSD)
- **DigitalOcean** : ~12$/mois (Basic : 2 vCPU, 2 GB RAM, 50 GB SSD)

## Optimisations possibles

### Pour réduire l'utilisation des ressources
1. **Activer la compression** dans Nginx
2. **Utiliser un CDN** pour les assets statiques
3. **Mettre en cache** les requêtes fréquentes
4. **Optimiser les images** avant upload
5. **Nettoyer régulièrement** les anciens fichiers

### Pour améliorer les performances
1. **Passer à PostgreSQL** pour les grandes bases
2. **Utiliser Redis** pour le cache
3. **Activer le cache Next.js** (ISR)
4. **Utiliser un CDN** (Cloudflare, etc.)
5. **Optimiser les requêtes Prisma**

## Sécurité

### Mesures essentielles
- ✅ Firewall configuré (UFW)
- ✅ SSL/TLS activé (HTTPS)
- ✅ Mots de passe forts
- ✅ Mises à jour régulières
- ✅ Backups automatiques
- ✅ Fail2ban configuré
- ✅ Variables d'environnement sécurisées

## Support et documentation

- **Documentation Next.js** : https://nextjs.org/docs
- **Documentation Prisma** : https://www.prisma.io/docs
- **Documentation PM2** : https://pm2.keymetrics.io/docs

