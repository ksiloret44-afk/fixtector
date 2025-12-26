#!/bin/bash

###############################################################################
# Script de démarrage FixTector pour Linux
# Version: 2.0.0
###############################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_NAME="fixtector"
APP_DIR="${APP_DIR:-/home/fixtector/fixtector}"
PORT="${PORT:-3001}"
NODE_ENV="${NODE_ENV:-production}"

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

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé!"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé!"
    exit 1
fi

# Vérifier que le répertoire existe
if [ ! -d "$APP_DIR" ]; then
    print_error "Le répertoire $APP_DIR n'existe pas!"
    exit 1
fi

cd "$APP_DIR"

# Vérifier que package.json existe
if [ ! -f "package.json" ]; then
    print_error "package.json introuvable dans $APP_DIR"
    exit 1
fi

print_info "Démarrage de $APP_NAME..."
print_info "Répertoire: $APP_DIR"
print_info "Port: $PORT"
print_info "Environnement: $NODE_ENV"

# Vérifier si .env.local existe
if [ ! -f ".env.local" ]; then
    print_warning ".env.local introuvable. Créez-le avant de démarrer."
fi

# Vérifier et installer les dépendances manquantes
print_info "Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    print_info "Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Erreur lors de l'installation des dépendances"
        exit 1
    fi
    print_success "Dépendances installées avec succès"
else
    # Vérifier si des dépendances manquent
    print_info "Vérification des dépendances manquantes..."
    npm install --dry-run 2>&1 | grep -q "added\|removed\|changed" && {
        print_info "Installation des dépendances manquantes..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Erreur lors de l'installation des dépendances"
            exit 1
        fi
        print_success "Dépendances mises à jour"
    } || print_success "Toutes les dépendances sont installées"
fi

# Générer Prisma Client si nécessaire
if [ -d "prisma" ]; then
    print_info "Génération de Prisma Client..."
    npx prisma generate || print_warning "Erreur lors de la génération de Prisma Client"
fi

# Vérifier si le build existe
if [ ! -d ".next" ]; then
    print_info "Build introuvable. Compilation en cours..."
    npm run build
fi

# Démarrer l'application
print_success "Démarrage de l'application sur le port $PORT..."
export NODE_ENV=$NODE_ENV
export PORT=$PORT

# Utiliser pm2 si disponible, sinon npm start
if command -v pm2 &> /dev/null; then
    print_info "Utilisation de PM2 pour le démarrage..."
    pm2 start npm --name "$APP_NAME" -- start || npm start
else
    print_info "Démarrage avec npm start..."
    npm start
fi

print_success "$APP_NAME démarré avec succès!"











