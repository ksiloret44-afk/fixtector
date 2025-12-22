#!/bin/bash

###############################################################################
# Script d'installation pour Ubuntu 24.04
# Installation complète de FixTector avec toutes les dépendances
###############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/home/kevin/fixtector"
APP_USER="kevin"
NODE_VERSION="20"  # Ubuntu 24.04 supporte Node.js 18+ mais 20 est recommandé

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

# Vérifier que nous sommes root ou avec sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Ce script doit être exécuté avec sudo"
    exit 1
fi

print_info "=========================================="
print_info "Installation FixTector pour Ubuntu 24.04"
print_info "=========================================="

# ============================================
# ÉTAPE 1 : Mise à jour du système
# ============================================
print_info "Mise à jour du système..."
apt-get update -qq
apt-get upgrade -y -qq

# ============================================
# ÉTAPE 2 : Installation des dépendances système
# ============================================
print_info "Installation des dépendances système..."
apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

print_success "Dépendances système installées"

# ============================================
# ÉTAPE 3 : Installation de Node.js 20.x (recommandé pour Ubuntu 24.04)
# ============================================
print_info "Installation de Node.js ${NODE_VERSION}.x..."

# Vérifier si Node.js est déjà installé
if command -v node &> /dev/null; then
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -ge 18 ]; then
        print_warning "Node.js $(node -v) est déjà installé"
    else
        print_info "Mise à jour de Node.js vers la version ${NODE_VERSION}.x..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y -qq nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi

# Vérifier l'installation
NODE_VERSION_INSTALLED=$(node -v)
NPM_VERSION_INSTALLED=$(npm -v)
print_success "Node.js ${NODE_VERSION_INSTALLED} installé"
print_success "npm ${NPM_VERSION_INSTALLED} installé"

# ============================================
# ÉTAPE 4 : Installation de PM2 globalement
# ============================================
print_info "Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2@latest
    print_success "PM2 installé"
else
    print_warning "PM2 est déjà installé"
fi

# ============================================
# ÉTAPE 5 : Création de l'utilisateur (si nécessaire)
# ============================================
print_info "Vérification de l'utilisateur ${APP_USER}..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    print_success "Utilisateur ${APP_USER} créé"
else
    print_warning "Utilisateur ${APP_USER} existe déjà"
fi

# ============================================
# ÉTAPE 6 : Création du répertoire de l'application
# ============================================
print_info "Création du répertoire ${APP_DIR}..."
mkdir -p "$APP_DIR"
chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"
print_success "Répertoire créé"

# ============================================
# ÉTAPE 7 : Instructions pour continuer
# ============================================
print_success "=========================================="
print_success "Installation système terminée!"
print_success "=========================================="
echo ""
print_info "Prochaines étapes:"
echo "  1. Copiez les fichiers de l'application dans ${APP_DIR}"
echo "  2. Exécutez en tant que ${APP_USER}:"
echo "     cd ${APP_DIR}"
echo "     npm install"
echo "     npm run setup"
echo ""
print_info "Ou utilisez le script setup-app.sh pour automatiser ces étapes"

