# Guide d'installation automatique - FixTector

## Installation rapide

### Prérequis
- Serveur Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux)
- Accès root ou sudo
- Connexion Internet

### Méthode 1 : Installation depuis le repository Git

```bash
# Télécharger le script d'installation
wget https://raw.githubusercontent.com/votre-repo/fixtector/main/install.sh
chmod +x install.sh

# Exécuter le script (avec sudo)
sudo ./install.sh
```

### Méthode 2 : Installation depuis les fichiers locaux

```bash
# Si vous avez déjà les fichiers du projet
cd /chemin/vers/fixtector
chmod +x install.sh
sudo ./install.sh
```

## Ce que fait le script

Le script `install.sh` effectue automatiquement :

1. ✅ **Détection du système d'exploitation**
2. ✅ **Installation des dépendances système**
   - Node.js 20.x LTS
   - npm
   - Git
   - Nginx
   - PM2
3. ✅ **Création de l'utilisateur** `fixtector`
4. ✅ **Installation de l'application**
   - Copie des fichiers
   - Installation des dépendances npm
5. ✅ **Configuration de Prisma**
   - Génération des clients
   - Initialisation des bases de données
6. ✅ **Configuration des variables d'environnement**
   - Création du fichier `.env.local`
   - Génération d'un secret NextAuth sécurisé
7. ✅ **Build de l'application**
8. ✅ **Configuration PM2**
   - Démarrage automatique
   - Gestion des processus
9. ✅ **Configuration Nginx** (si domaine fourni)
   - Reverse proxy
   - Configuration SSL (Let's Encrypt)
10. ✅ **Configuration du firewall**
11. ✅ **Script de sauvegarde automatique**

## Utilisation

### Exécution interactive

Le script vous demandera :
- Le domaine (optionnel, laisser vide pour localhost)
- L'email pour Let's Encrypt (optionnel)

```bash
sudo ./install.sh
```

### Exécution non-interactive

```bash
# Avec domaine et email
echo -e "votre-domaine.com\nvotre@email.com" | sudo ./install.sh

# Sans domaine (localhost)
echo -e "\n" | sudo ./install.sh
```

## Après l'installation

### 1. Vérifier que l'application fonctionne

```bash
# Vérifier le statut PM2
sudo -u fixtector pm2 status

# Voir les logs
sudo -u fixtector pm2 logs fixtector

# Tester l'URL
curl http://localhost:3000
```

### 2. Créer un compte administrateur

```bash
cd /home/fixtector/fixtector
sudo -u fixtector npx tsx scripts/init-db.ts
```

### 3. Configurer les services optionnels

Éditer `/home/fixtector/fixtector/.env.local` pour ajouter :
- Configuration SMTP (email)
- Configuration SMS (Twilio, etc.)

### 4. Accéder à l'application

- **Sans domaine** : http://VOTRE_IP:3000
- **Avec domaine** : https://votre-domaine.com

## Commandes de gestion

### PM2

```bash
# Voir le statut
sudo -u fixtector pm2 status

# Voir les logs
sudo -u fixtector pm2 logs fixtector

# Redémarrer
sudo -u fixtector pm2 restart fixtector

# Arrêter
sudo -u fixtector pm2 stop fixtector

# Monitoring
sudo -u fixtector pm2 monit
```

### Nginx

```bash
# Tester la configuration
sudo nginx -t

# Redémarrer
sudo systemctl restart nginx

# Voir les logs
sudo tail -f /var/log/nginx/error.log
```

### Sauvegardes

```bash
# Sauvegarde manuelle
sudo -u fixtector /home/fixtector/fixtector/backup.sh

# Voir les sauvegardes
ls -lh /home/fixtector/backups/
```

## Mise à jour de l'application

```bash
cd /home/fixtector/fixtector

# Sauvegarder avant mise à jour
sudo -u fixtector ./backup.sh

# Mettre à jour depuis Git
sudo -u fixtector git pull

# Installer les nouvelles dépendances
sudo -u fixtector npm install --production

# Régénérer Prisma
sudo -u fixtector npx prisma generate --schema=prisma/schema-main.prisma
sudo -u fixtector npx prisma generate --schema=prisma/schema-company.prisma

# Mettre à jour les bases de données
sudo -u fixtector npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss
sudo -u fixtector npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss

# Rebuild
sudo -u fixtector npm run build

# Redémarrer
sudo -u fixtector pm2 restart fixtector
```

## Désinstallation

```bash
# Arrêter l'application
sudo -u fixtector pm2 stop fixtector
sudo -u fixtector pm2 delete fixtector

# Supprimer les fichiers
sudo rm -rf /home/fixtector

# Supprimer la configuration Nginx
sudo rm /etc/nginx/sites-enabled/fixtector
sudo rm /etc/nginx/sites-available/fixtector
sudo systemctl reload nginx

# Supprimer l'utilisateur (optionnel)
sudo userdel -r fixtector
```

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
sudo -u fixtector pm2 logs fixtector --lines 50

# Vérifier les variables d'environnement
sudo -u fixtector cat /home/fixtector/fixtector/.env.local

# Vérifier les permissions
ls -la /home/fixtector/fixtector
```

### Erreur de base de données

```bash
cd /home/fixtector/fixtector
sudo -u fixtector npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss
sudo -u fixtector npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss
```

### Port déjà utilisé

```bash
# Changer le port dans ecosystem.config.js et .env.local
# Puis redémarrer
sudo -u fixtector pm2 restart fixtector
```

### Problèmes de mémoire

```bash
# Vérifier l'utilisation
free -h

# Augmenter la limite de mémoire dans ecosystem.config.js
# max_memory_restart: '2G'
```

## Support

Pour plus d'informations, consultez :
- `VPS_REQUIREMENTS.md` - Spécifications système
- `DEPLOY.md` - Guide de déploiement détaillé

