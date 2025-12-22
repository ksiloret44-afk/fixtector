#!/bin/bash

###############################################################################
# Script d'installation simplifié FixTector
# Télécharge, installe et démarre le serveur
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="fixtector"
APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/${APP_NAME}"
NODE_VERSION="20"
PORT="3000"
GITHUB_REPO="ksiloret44-afk/fixtector"
GITHUB_TOKEN=""

# Fonctions
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Vérifier que le script est exécuté avec sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec sudo"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Installation FixTector (Simplifié)"
echo "=========================================="
echo ""

# 1. NETTOYAGE COMPLET
print_info "Nettoyage de l'installation existante..."

# Arrêter PM2
if command -v pm2 >/dev/null 2>&1; then
    if sudo -u "$APP_USER" pm2 list 2>/dev/null | grep -q "$APP_NAME"; then
        print_info "Arrêt de PM2..."
        sudo -u "$APP_USER" pm2 delete "$APP_NAME" 2>/dev/null || true
        sudo -u "$APP_USER" pm2 save 2>/dev/null || true
    fi
fi

# Supprimer répertoire application
if [ -d "$APP_DIR" ]; then
    print_info "Suppression de $APP_DIR..."
    sudo rm -rf "$APP_DIR"
fi

# Supprimer utilisateur
if id "$APP_USER" &>/dev/null; then
    print_info "Suppression de l'utilisateur $APP_USER..."
    sudo pkill -u "$APP_USER" 2>/dev/null || true
    sleep 2
    if [ -d "/home/$APP_USER" ]; then
        sudo rm -rf "/home/$APP_USER"
    fi
    sudo userdel -r "$APP_USER" 2>/dev/null || true
fi

print_success "Nettoyage terminé"

# 2. INSTALLATION DÉPENDANCES SYSTÈME
print_info "Installation des dépendances système..."

# Détecter OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    print_error "Impossible de détecter l'OS"
    exit 1
fi

# Installer Node.js
if ! command -v node >/dev/null 2>&1; then
    print_info "Installation de Node.js ${NODE_VERSION}.x..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi

# Installer PM2
if ! command -v pm2 >/dev/null 2>&1; then
    print_info "Installation de PM2..."
    sudo npm install -g pm2
fi

# Installer unzip si nécessaire
if ! command -v unzip >/dev/null 2>&1; then
    print_info "Installation de unzip..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get install -y unzip
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        sudo yum install -y unzip
    fi
fi

print_success "Dépendances système installées"

# 3. CRÉER UTILISATEUR
print_info "Création de l'utilisateur $APP_USER..."
sudo adduser --disabled-password --gecos "" "$APP_USER" || \
sudo useradd -m -s /bin/bash "$APP_USER"
print_success "Utilisateur créé"

# 4. TÉLÉCHARGER LA DERNIÈRE VERSION
print_info "Récupération de la dernière version depuis GitHub..."

# Récupérer le dernier tag
TAGS_URL="https://api.github.com/repos/$GITHUB_REPO/tags?per_page=10"
if [ -n "$GITHUB_TOKEN" ]; then
    TAGS_RESPONSE=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" "$TAGS_URL")
else
    TAGS_RESPONSE=$(curl -s -H "Accept: application/vnd.github.v3+json" "$TAGS_URL")
fi

# Extraire et trier les tags par version
LATEST_TAG=$(echo "$TAGS_RESPONSE" | grep '"name"' | sed -E 's/.*"name":\s*"([^"]+)".*/\1/' | head -1)

if [ -z "$LATEST_TAG" ]; then
    print_error "Impossible de récupérer la dernière version"
    exit 1
fi

print_success "Dernière version trouvée: $LATEST_TAG"

# Télécharger le ZIP
DOWNLOAD_URL="https://github.com/$GITHUB_REPO/archive/refs/tags/$LATEST_TAG.zip"
TEMP_DIR=$(mktemp -d)
ZIP_FILE="$TEMP_DIR/release.zip"

print_info "Téléchargement de $LATEST_TAG..."
if [ -n "$GITHUB_TOKEN" ]; then
    curl -sL -H "Authorization: Bearer $GITHUB_TOKEN" -o "$ZIP_FILE" "$DOWNLOAD_URL"
else
    curl -sL -o "$ZIP_FILE" "$DOWNLOAD_URL"
fi

if [ ! -s "$ZIP_FILE" ]; then
    print_error "Échec du téléchargement"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Extraire
print_info "Extraction de l'archive..."
unzip -q "$ZIP_FILE" -d "$TEMP_DIR"
EXTRACTED_DIR=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -1)

# Créer répertoire application
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER:$APP_USER" "$APP_DIR"

# Copier les fichiers
print_info "Installation des fichiers..."
sudo cp -r "$EXTRACTED_DIR"/* "$APP_DIR/"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Nettoyer
rm -rf "$TEMP_DIR"

print_success "Fichiers installés"

# 5. INSTALLER DÉPENDANCES NPM
print_info "Installation des dépendances npm (cela peut prendre plusieurs minutes)..."
cd "$APP_DIR"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && unset NODE_ENV && npm install"
print_success "Dépendances npm installées"

# 6. CONFIGURER PRISMA
print_info "Configuration de Prisma..."

# Créer .env.local si nécessaire
if [ ! -f "$APP_DIR/.env.local" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    sudo tee "$APP_DIR/.env.local" > /dev/null << EOF
DATABASE_URL_MAIN=file:./prisma/main.db
DATABASE_URL=file:./prisma/main.db
NEXTAUTH_URL=http://localhost:${PORT}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_PUBLIC_BASE_URL=http://localhost:${PORT}
EOF
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR/.env.local"
    sudo chmod 640 "$APP_DIR/.env.local"
fi

# Générer Prisma clients
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma generate --schema=prisma/schema-main.prisma"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma generate --schema=prisma/schema-company.prisma"

# Créer bases de données
sudo -u "$APP_USER" mkdir -p "$APP_DIR/prisma/companies"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && set -a && source .env.local && set +a && npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss --skip-generate" || true
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && set -a && source .env.local && set +a && export DATABASE_URL=\$(grep '^DATABASE_URL=' .env.local | cut -d'=' -f2-) && npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate" || true

print_success "Prisma configuré"

# 7. BUILD
print_info "Construction de l'application (cela peut prendre plusieurs minutes)..."
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && set -a && source .env.local && set +a && npm run build"
print_success "Application construite"

# 8. CRÉER CONFIG PM2
print_info "Configuration de PM2..."
sudo -u "$APP_USER" cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
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

sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"

# 9. DÉMARRER
print_info "Démarrage de l'application..."
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && pm2 start ecosystem.config.js"
sudo -u "$APP_USER" pm2 save

# Configurer PM2 pour démarrer au boot
sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" || true

print_success "Application démarrée"

# 10. RÉSUMÉ
echo ""
echo "=========================================="
print_success "Installation terminée !"
echo "=========================================="
echo ""
echo "Application: $APP_DIR"
echo "Utilisateur: $APP_USER"
echo "Port: $PORT"
echo "URL: http://localhost:$PORT"
echo ""
echo "Commandes utiles:"
echo "  - Logs: sudo -u $APP_USER pm2 logs $APP_NAME"
echo "  - Redémarrer: sudo -u $APP_USER pm2 restart $APP_NAME"
echo "  - Statut: sudo -u $APP_USER pm2 status"
echo ""
INSTALLED_VERSION=$(grep '"version"' "$APP_DIR/package.json" | head -1 | sed -E 's/.*"version":\s*"([^"]+)".*/\1/' || echo "N/A")
echo "Version installée: $INSTALLED_VERSION"
echo ""
print_warning "Compte admin par défaut:"
echo "  Email: admin@admin.com"
echo "  Mot de passe: admin123"
echo "  ⚠️  Changez ce mot de passe après la première connexion!"
echo ""

