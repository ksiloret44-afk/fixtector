#!/bin/bash

###############################################################################
# Script de mise à jour automatique FixTector
###############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/fixtector"

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que le script est exécuté avec sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec sudo"
    exit 1
fi

print_info "Début de la mise à jour de FixTector..."

# Sauvegarder avant mise à jour
print_info "Création d'une sauvegarde..."
if [ -f "$APP_DIR/backup.sh" ]; then
    sudo -u "$APP_USER" "$APP_DIR/backup.sh"
else
    print_warning "Script de sauvegarde non trouvé, création d'une sauvegarde manuelle..."
    BACKUP_DIR="/home/${APP_USER}/backups"
    sudo -u "$APP_USER" mkdir -p "$BACKUP_DIR"
    DATE=$(date +%Y%m%d_%H%M%S)
    sudo -u "$APP_USER" tar -czf "$BACKUP_DIR/pre-update_$DATE.tar.gz" -C "$APP_DIR" prisma/*.db prisma/companies public/logos public/photos 2>/dev/null || true
fi

# Aller dans le répertoire de l'application
cd "$APP_DIR"

# Sauvegarder le fichier .env.local
if [ -f ".env.local" ]; then
    print_info "Sauvegarde de .env.local..."
    sudo -u "$APP_USER" cp .env.local .env.local.backup
fi

# Mettre à jour depuis Git (si c'est un repository Git)
if [ -d ".git" ]; then
    print_info "Mise à jour depuis Git..."
    sudo -u "$APP_USER" git pull || print_warning "Impossible de mettre à jour depuis Git"
else
    print_warning "Ce n'est pas un repository Git, mise à jour manuelle nécessaire"
fi

# Installer les nouvelles dépendances
print_info "Installation des dépendances..."
sudo -u "$APP_USER" npm install --production

# Régénérer Prisma
print_info "Régénération des clients Prisma..."
sudo -u "$APP_USER" npx prisma generate --schema=prisma/schema-main.prisma
sudo -u "$APP_USER" npx prisma generate --schema=prisma/schema-company.prisma

# Mettre à jour les bases de données
print_info "Mise à jour des schémas de base de données..."
sudo -u "$APP_USER" npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss || true
sudo -u "$APP_USER" npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss || true

# Rebuild l'application
print_info "Reconstruction de l'application..."
sudo -u "$APP_USER" npm run build

# Redémarrer l'application
print_info "Redémarrage de l'application..."
sudo -u "$APP_USER" pm2 restart fixtector

# Attendre un peu pour vérifier que ça démarre
sleep 3

# Vérifier le statut
if sudo -u "$APP_USER" pm2 list | grep -q "fixtector.*online"; then
    print_info "Mise à jour terminée avec succès !"
    sudo -u "$APP_USER" pm2 status
else
    print_error "L'application ne semble pas démarrée correctement"
    print_info "Vérifiez les logs avec: sudo -u $APP_USER pm2 logs fixtector"
    exit 1
fi

