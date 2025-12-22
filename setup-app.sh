#!/bin/bash

###############################################################################
# Script de configuration de l'application pour Ubuntu 24.04
# À exécuter en tant qu'utilisateur kevin dans /home/kevin/fixtector
###############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/home/kevin/fixtector"
PORT="3001"

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    print_error "Le répertoire $APP_DIR n'existe pas!"
    exit 1
fi

cd "$APP_DIR"
print_info "Répertoire de travail: $(pwd)"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Exécutez d'abord install-ubuntu24.sh avec sudo"
    exit 1
fi

NODE_VERSION=$(node -v)
print_info "Node.js version: ${NODE_VERSION}"

# ============================================
# ÉTAPE 1 : Installation des dépendances npm
# ============================================
print_info "Installation des dépendances npm (cela peut prendre plusieurs minutes)..."
unset NODE_ENV  # S'assurer que NODE_ENV n'est pas défini pour installer devDependencies
npm install
print_success "Dépendances installées"

# ============================================
# ÉTAPE 2 : Créer le fichier .env.local
# ============================================
print_info "Création du fichier .env.local..."
if [ ! -f .env.local ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    cat > .env.local << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:${PORT}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_PUBLIC_BASE_URL=http://localhost:${PORT}
EOF
    chmod 640 .env.local
    print_success "Fichier .env.local créé"
else
    print_warning "Le fichier .env.local existe déjà, conservation de l'existant"
fi

# ============================================
# ÉTAPE 3 : Charger les variables d'environnement
# ============================================
print_info "Chargement des variables d'environnement..."
set -a && source .env.local && set +a

# ============================================
# ÉTAPE 4 : Générer les clients Prisma
# ============================================
print_info "Génération des clients Prisma..."
npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

if [ -d "node_modules/.prisma/client-main" ] && [ -d "node_modules/.prisma/client-company" ]; then
    print_success "Clients Prisma générés avec succès"
else
    print_error "Erreur lors de la génération des clients Prisma"
    exit 1
fi

# ============================================
# ÉTAPE 5 : Initialiser les bases de données
# ============================================
print_info "Initialisation des bases de données..."
mkdir -p prisma/companies

set -a && source .env.local && set +a
npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate || {
    print_warning "Erreur lors de l'initialisation de la base principale (peut être normal si déjà initialisée)"
}

set -a && source .env.local && set +a
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-)
npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate || {
    print_warning "Erreur lors de l'initialisation de la base entreprise (peut être normal si déjà initialisée)"
}

print_success "Bases de données initialisées"

# ============================================
# ÉTAPE 6 : Créer l'utilisateur admin par défaut
# ============================================
print_info "Création de l'utilisateur admin par défaut..."
if [ -f "scripts/init-db.ts" ]; then
    set -a && source .env.local && set +a
    npm run db:init || {
        print_warning "Erreur lors de la création de l'utilisateur admin (peut être normal si déjà créé)"
    }
fi

# ============================================
# ÉTAPE 7 : Builder l'application
# ============================================
print_info "Construction de l'application (cela peut prendre plusieurs minutes)..."
set -a && source .env.local && set +a
npm run build

if [ -d ".next" ]; then
    print_success "Build réussi"
else
    print_error "Erreur lors du build"
    exit 1
fi

# ============================================
# ÉTAPE 8 : Configurer PM2
# ============================================
print_info "Configuration de PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fixtector',
    script: 'npm',
    args: 'start',
    cwd: '${APP_DIR}',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: ${PORT}
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

mkdir -p logs
print_success "Configuration PM2 créée"

# ============================================
# ÉTAPE 9 : Démarrer avec PM2
# ============================================
print_info "Démarrage du serveur avec PM2..."
pm2 stop fixtector 2>/dev/null || true
pm2 delete fixtector 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
print_success "Serveur démarré avec PM2"

# ============================================
# ÉTAPE 10 : Vérification
# ============================================
print_info "Vérification du statut..."
sleep 3

pm2 status

print_info "Vérification du port ${PORT}..."
if netstat -tlnp 2>/dev/null | grep -q ":${PORT}" || ss -tlnp 2>/dev/null | grep -q ":${PORT}"; then
    print_success "Le serveur écoute sur le port ${PORT}"
else
    print_warning "Le port ${PORT} ne semble pas être utilisé"
fi

print_info "Test de l'application..."
if curl -s "http://localhost:${PORT}" > /dev/null; then
    print_success "L'application répond correctement"
else
    print_warning "L'application ne répond pas encore (peut prendre quelques secondes)"
fi

# Afficher la version installée
VERSION_INSTALLED=$(grep '"version"' package.json | cut -d'"' -f4)
print_success "Version installée: ${VERSION_INSTALLED}"

echo ""
print_success "=========================================="
print_success "Configuration terminée avec succès!"
print_success "=========================================="
echo ""
print_info "Commandes utiles:"
echo "  - Voir les logs: pm2 logs fixtector"
echo "  - Redémarrer: pm2 restart fixtector"
echo "  - Arrêter: pm2 stop fixtector"
echo "  - Statut: pm2 status"
echo ""
print_info "L'application est accessible sur: http://localhost:${PORT}"

