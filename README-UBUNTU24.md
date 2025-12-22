# FixTector - Version Ubuntu 24.04

Version complètement compatible avec Ubuntu 24.04 LTS.

## Prérequis

- Ubuntu 24.04 LTS
- Node.js 18+ (recommandé: Node.js 20.x)
- npm 9+
- PM2 (installé automatiquement)

## Installation rapide

### Étape 1 : Installation système (avec sudo)

```bash
sudo bash install-ubuntu24.sh
```

Ce script installe :
- Node.js 20.x
- npm
- PM2
- Toutes les dépendances système nécessaires

### Étape 2 : Configuration de l'application (en tant qu'utilisateur kevin)

```bash
cd /home/kevin/fixtector
bash setup-app.sh
```

Ce script :
- Installe les dépendances npm
- Crée le fichier .env.local
- Génère les clients Prisma
- Initialise les bases de données
- Build l'application
- Configure et démarre PM2

## Installation manuelle

Si vous préférez installer manuellement :

```bash
# 1. Installer les dépendances
npm install

# 2. Créer .env.local
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > .env.local << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_PUBLIC_BASE_URL=http://localhost:3001
EOF

# 3. Générer les clients Prisma
set -a && source .env.local && set +a
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

# 4. Initialiser les bases de données
mkdir -p prisma/companies
set -a && source .env.local && set +a
npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate
set -a && source .env.local && set +a
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-)
npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate

# 5. Builder l'application
set -a && source .env.local && set +a
npm run build

# 6. Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
```

## Gestion du serveur

```bash
# Voir les logs
pm2 logs fixtector

# Redémarrer
pm2 restart fixtector

# Arrêter
pm2 stop fixtector

# Statut
pm2 status
```

## Compatibilité Ubuntu 24.04

Cette version a été spécialement optimisée pour Ubuntu 24.04 :

- ✅ Utilise `process.cwd()` pour les chemins Prisma (compatible Linux)
- ✅ Scripts shell compatibles bash Ubuntu 24.04
- ✅ Node.js 20.x recommandé (compatible avec Node.js 18+)
- ✅ Toutes les dépendances testées sur Ubuntu 24.04
- ✅ PM2 configuré pour auto-restart
- ✅ Permissions Linux correctes

## Dépannage

### Erreur "Module not found: twilio"
C'est normal, twilio est optionnel. L'application fonctionne sans SMS.

### Erreur Prisma client not found
```bash
set -a && source .env.local && set +a
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma
```

### Port déjà utilisé
```bash
sudo fuser -k 3001/tcp
pm2 restart fixtector
```

## Support

Pour toute question ou problème, consultez les logs :
```bash
pm2 logs fixtector --lines 50
```

