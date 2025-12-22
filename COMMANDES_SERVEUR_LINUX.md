# Commandes complètes pour le serveur Linux - Version 1.3.1

## Toutes les commandes à exécuter dans l'ordre

```bash
# ============================================
# ÉTAPE 1 : Aller dans le dossier et arrêter PM2
# ============================================
cd /home/kevin/fixtector
pm2 stop all
pm2 delete all
pm2 list

# ============================================
# ÉTAPE 2 : Tuer les processus sur le port 3001
# ============================================
sudo fuser -k 3001/tcp
# OU si fuser n'est pas disponible :
# sudo lsof -ti:3001 | xargs sudo kill -9

# ============================================
# ÉTAPE 3 : Créer le fichier .env.local
# ============================================
# Générer un secret aléatoire
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Créer le fichier .env.local
cat > .env.local << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_PUBLIC_BASE_URL=http://localhost:3001
EOF

# Sécuriser le fichier
chmod 640 .env.local

# Vérifier que le fichier a été créé
cat .env.local

# ============================================
# ÉTAPE 4 : Mettre à jour vers la version 1.3.1
# ============================================
# Option A : Si vous avez git installé
git fetch origin
git checkout v1.3.1

# Option B : Télécharger directement depuis GitHub
# wget https://github.com/ksiloret44-afk/fixtector/archive/refs/tags/v1.3.1.zip -O /tmp/v1.3.1.zip
# unzip -q /tmp/v1.3.1.zip -d /tmp/
# cp -r /tmp/fixtector-1.3.1/* /home/kevin/fixtector/
# cp -r /tmp/fixtector-1.3.1/.* /home/kevin/fixtector/ 2>/dev/null || true
# rm -rf /tmp/v1.3.1.zip /tmp/fixtector-1.3.1

# ============================================
# ÉTAPE 5 : Installer les dépendances
# ============================================
npm install

# ============================================
# ÉTAPE 6 : Nettoyer l'ancien build
# ============================================
rm -rf .next
rm -rf node_modules/.prisma

# ============================================
# ÉTAPE 7 : Charger les variables d'environnement et générer Prisma
# ============================================
set -a && source .env.local && set +a

# Générer les clients Prisma (IMPORTANT pour la compatibilité Linux)
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# Vérifier que les clients Prisma ont été générés
ls -la node_modules/.prisma/

# ============================================
# ÉTAPE 8 : Initialiser les bases de données
# ============================================
mkdir -p prisma/companies

# Initialiser la base de données principale
set -a && source .env.local && set +a && npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate

# Initialiser la base de données des entreprises
set -a && source .env.local && set +a && export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-) && npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate

# ============================================
# ÉTAPE 9 : Builder l'application
# ============================================
set -a && source .env.local && set +a && npm run build

# Vérifier que le build a réussi
ls -la .next

# ============================================
# ÉTAPE 10 : Créer/Configurer le fichier ecosystem.config.js pour PM2
# ============================================
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fixtector',
    script: 'npm',
    args: 'start',
    cwd: '/home/kevin/fixtector',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

# Créer le dossier logs
mkdir -p logs

# ============================================
# ÉTAPE 11 : Démarrer le serveur avec PM2
# ============================================
pm2 start ecosystem.config.js
pm2 save
pm2 status

# ============================================
# ÉTAPE 12 : Vérifier que tout fonctionne
# ============================================
# Vérifier les logs
pm2 logs fixtector --lines 30

# Vérifier le port
sudo netstat -tlnp | grep 3001

# Tester l'application
curl http://localhost:3001

# Vérifier la version installée
cat package.json | grep '"version"'
```

## Commandes utiles pour le monitoring

```bash
# Voir les logs en temps réel
pm2 logs fixtector --lines 50

# Redémarrer le serveur
pm2 restart fixtector

# Arrêter le serveur
pm2 stop fixtector

# Voir le statut
pm2 status

# Voir les informations détaillées
pm2 describe fixtector

# Voir l'utilisation des ressources
pm2 monit
```

## En cas d'erreur

### Si le build échoue
```bash
# Vérifier les erreurs
npm run build 2>&1 | tail -50

# Nettoyer et réessayer
rm -rf .next node_modules/.prisma
npm install
set -a && source .env.local && set +a
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma
npm run build
```

### Si le port est toujours utilisé
```bash
# Trouver le processus
sudo lsof -i :3001

# Tuer le processus (remplacer PID)
sudo kill -9 PID

# OU forcer la libération du port
sudo fuser -k 3001/tcp
```

### Si Prisma ne génère pas les clients
```bash
# Vérifier que les schémas existent
ls -la prisma/

# Vérifier les variables d'environnement
cat .env.local

# Régénérer manuellement
set -a && source .env.local && set +a
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma
```


