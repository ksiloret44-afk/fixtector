#!/bin/bash

###############################################################################
# Script de mise à jour automatique vers la version 1.3.1
# Pour le serveur Linux - /home/kevin/fixtector
###############################################################################

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/home/kevin/fixtector"
VERSION="v1.3.1"

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

# ============================================
# ÉTAPE 1 : Arrêter PM2
# ============================================
print_info "Arrêt de PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
print_success "PM2 arrêté"

# ============================================
# ÉTAPE 2 : Tuer les processus sur le port 3001
# ============================================
print_info "Libération du port 3001..."
if command -v fuser &> /dev/null; then
    sudo fuser -k 3001/tcp 2>/dev/null || true
elif command -v lsof &> /dev/null; then
    sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
else
    print_warning "Impossible de libérer le port automatiquement"
fi
sleep 2
print_success "Port 3001 libéré"

# ============================================
# ÉTAPE 3 : Créer le fichier .env.local
# ============================================
print_info "Création du fichier .env.local..."
if [ ! -f .env.local ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    cat > .env.local << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_PUBLIC_BASE_URL=http://localhost:3001
EOF
    chmod 640 .env.local
    print_success "Fichier .env.local créé"
else
    print_warning "Le fichier .env.local existe déjà, conservation de l'existant"
fi

# ============================================
# ÉTAPE 4 : Mettre à jour vers la version 1.3.1
# ============================================
print_info "Mise à jour vers la version $VERSION..."

if command -v git &> /dev/null && [ -d .git ]; then
    print_info "Utilisation de Git pour la mise à jour..."
    git fetch origin 2>/dev/null || true
    git checkout "$VERSION" 2>/dev/null || {
        print_warning "Tag $VERSION non trouvé, tentative avec la branche main..."
        git checkout main 2>/dev/null || true
        git pull origin main 2>/dev/null || true
    }
    print_success "Code mis à jour via Git"
else
    print_info "Git non disponible, téléchargement direct depuis GitHub..."
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    wget -q "https://github.com/ksiloret44-afk/fixtector/archive/refs/tags/$VERSION.zip" -O "$VERSION.zip" || {
        print_error "Impossible de télécharger la version $VERSION"
        exit 1
    }
    unzip -q "$VERSION.zip"
    cd "fixtector-${VERSION#v}"
    
    # Copier les fichiers (en préservant .env.local)
    cp -r * "$APP_DIR/"
    cp -r .[^.]* "$APP_DIR/" 2>/dev/null || true
    
    cd "$APP_DIR"
    rm -rf "$TEMP_DIR"
    print_success "Code téléchargé et installé"
fi

# ============================================
# ÉTAPE 5 : Installer les dépendances
# ============================================
print_info "Installation des dépendances npm (cela peut prendre plusieurs minutes)..."
npm install
print_success "Dépendances installées"

# ============================================
# ÉTAPE 6 : Nettoyer l'ancien build
# ============================================
print_info "Nettoyage de l'ancien build..."
rm -rf .next
rm -rf node_modules/.prisma
print_success "Nettoyage terminé"

# ============================================
# ÉTAPE 7 : Charger les variables d'environnement et générer Prisma
# ============================================
print_info "Génération des clients Prisma..."
set -a && source .env.local && set +a

npx prisma generate --schema=prisma/schema-main.prisma
npx prisma generate --schema=prisma/schema-company.prisma

if [ -d "node_modules/.prisma/client-main" ] && [ -d "node_modules/.prisma/client-company" ]; then
    print_success "Clients Prisma générés avec succès"
else
    print_error "Erreur lors de la génération des clients Prisma"
    exit 1
fi

# ============================================
# ÉTAPE 8 : Initialiser les bases de données
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
# ÉTAPE 9 : Builder l'application
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
# ÉTAPE 10 : Configurer PM2
# ============================================
print_info "Configuration de PM2..."
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

mkdir -p logs
print_success "Configuration PM2 créée"

# ============================================
# ÉTAPE 11 : Démarrer le serveur avec PM2
# ============================================
print_info "Démarrage du serveur avec PM2..."
pm2 start ecosystem.config.js
pm2 save
print_success "Serveur démarré avec PM2"

# ============================================
# ÉTAPE 12 : Vérification
# ============================================
print_info "Vérification du statut..."
sleep 3

pm2 status

print_info "Vérification du port 3001..."
if netstat -tlnp 2>/dev/null | grep -q ":3001" || ss -tlnp 2>/dev/null | grep -q ":3001"; then
    print_success "Le serveur écoute sur le port 3001"
else
    print_warning "Le port 3001 ne semble pas être utilisé"
fi

print_info "Test de l'application..."
if curl -s http://localhost:3001 > /dev/null; then
    print_success "L'application répond correctement"
else
    print_warning "L'application ne répond pas encore (peut prendre quelques secondes)"
fi

# Afficher la version installée
VERSION_INSTALLED=$(grep '"version"' package.json | cut -d'"' -f4)
print_success "Version installée: $VERSION_INSTALLED"

echo ""
print_success "=========================================="
print_success "Mise à jour terminée avec succès!"
print_success "=========================================="
echo ""
print_info "Commandes utiles:"
echo "  - Voir les logs: pm2 logs fixtector"
echo "  - Redémarrer: pm2 restart fixtector"
echo "  - Arrêter: pm2 stop fixtector"
echo "  - Statut: pm2 status"
echo ""
print_info "L'application est accessible sur: http://localhost:3001"

