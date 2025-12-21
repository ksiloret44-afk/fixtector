#!/bin/bash

###############################################################################
# Script d'installation automatique FixTector pour Linux
# Compatible avec Ubuntu 20.04+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuration
APP_NAME="fixtector"
APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/${APP_NAME}"
NODE_VERSION="20"
PORT="3000"
DOMAIN=""
EMAIL=""
WEB_SERVER=""  # nginx, apache, ou les deux
GITHUB_REPO="ksiloret44-afk/fixtector"
GITHUB_TOKEN=""  # Optionnel, pour repository privé
INSTALL_METHOD=""  # "release" ou "local"

# Fonction pour afficher les messages
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

# Fonction pour vérifier si la commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour récupérer la dernière release depuis GitHub
get_latest_release() {
    local repo=$1
    local token=$2
    
    local headers="Accept: application/vnd.github.v3+json"
    if [ -n "$token" ]; then
        headers="Authorization: Bearer $token\n$headers"
    fi
    
    local url="https://api.github.com/repos/$repo/releases/latest"
    
    if [ -n "$token" ]; then
        local response=$(curl -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github.v3+json" "$url")
    else
        local response=$(curl -s -H "Accept: application/vnd.github.v3+json" "$url")
    fi
    
    if echo "$response" | grep -q '"tag_name"'; then
        echo "$response" | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/'
    else
        # Si pas de release, essayer les tags
        local tags_url="https://api.github.com/repos/$repo/tags?per_page=1"
        if [ -n "$token" ]; then
            local tags_response=$(curl -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github.v3+json" "$tags_url")
        else
            local tags_response=$(curl -s -H "Accept: application/vnd.github.v3+json" "$tags_url")
        fi
        
        if echo "$tags_response" | grep -q '"name"'; then
            echo "$tags_response" | grep '"name"' | head -1 | sed -E 's/.*"name":\s*"([^"]+)".*/\1/'
        else
            return 1
        fi
    fi
}

# Fonction pour télécharger un fichier depuis GitHub (avec token si repository privé)
download_file_from_github() {
    local repo=$1
    local file_path=$2
    local branch=$3
    local token=$4
    local output_path=$5
    
    local url="https://api.github.com/repos/$repo/contents/$file_path?ref=$branch"
    
    if [ -n "$token" ]; then
        local response=$(curl -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github.v3.raw" "$url")
    else
        local response=$(curl -s -H "Accept: application/vnd.github.v3.raw" "$url")
    fi
    
    # Vérifier si c'est une erreur JSON
    if echo "$response" | grep -q '"message"'; then
        return 1
    fi
    
    # Sauvegarder le contenu
    echo "$response" > "$output_path"
    return 0
}

# Fonction pour télécharger et extraire une release GitHub
download_release() {
    local repo=$1
    local version=$2
    local token=$3
    local dest_dir=$4
    
    print_info "Téléchargement de la version $version depuis GitHub..."
    
    # Construire l'URL de téléchargement
    local download_url="https://github.com/$repo/archive/refs/tags/$version.zip"
    
    # Créer un répertoire temporaire
    local temp_dir=$(mktemp -d)
    local zip_file="$temp_dir/release.zip"
    
    # Télécharger le ZIP
    print_info "Téléchargement depuis: $download_url"
    if [ -n "$token" ]; then
        if ! curl -sL -H "Authorization: Bearer $token" -o "$zip_file" "$download_url"; then
            print_error "Impossible de télécharger la release (vérifiez votre token GitHub)"
            rm -rf "$temp_dir"
            return 1
        fi
    else
        if ! curl -sL -o "$zip_file" "$download_url"; then
            print_error "Impossible de télécharger la release"
            print_info "Si le repository est privé, vous devez fournir un token GitHub"
            rm -rf "$temp_dir"
            return 1
        fi
    fi
    
    # Vérifier que le fichier ZIP a été téléchargé et n'est pas vide
    if [ ! -s "$zip_file" ]; then
        print_error "Le fichier ZIP téléchargé est vide ou invalide"
        rm -rf "$temp_dir"
        return 1
    fi
    
    print_info "Archive téléchargée: $(du -h "$zip_file" | cut -f1)"
    
    # Extraire le ZIP
    print_info "Extraction de l'archive..."
    if ! unzip -q "$zip_file" -d "$temp_dir"; then
        print_error "Impossible d'extraire l'archive"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Trouver le dossier extrait (format: repo-version)
    local extracted_dir=$(find "$temp_dir" -mindepth 1 -maxdepth 1 -type d | head -1)
    
    if [ -z "$extracted_dir" ] || [ ! -f "$extracted_dir/package.json" ]; then
        print_error "Structure de l'archive invalide"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Copier les fichiers vers le répertoire de destination
    print_info "Installation des fichiers..."
    sudo mkdir -p "$dest_dir"
    sudo chown "$APP_USER:$APP_USER" "$dest_dir"
    
    # Vérifier que rsync est disponible, sinon utiliser cp
    if command_exists rsync; then
        print_info "Copie des fichiers avec rsync..."
        sudo -u "$APP_USER" rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' "$extracted_dir/" "$dest_dir/"
    else
        print_info "rsync non disponible, utilisation de cp..."
        sudo -u "$APP_USER" cp -r "$extracted_dir"/* "$dest_dir/" 2>/dev/null || {
            # Si cp échoue, essayer avec find
            find "$extracted_dir" -mindepth 1 -maxdepth 1 -exec sudo -u "$APP_USER" cp -r {} "$dest_dir/" \;
        }
    fi
    
    # Vérifier que package.json a été copié
    if [ ! -f "$dest_dir/package.json" ]; then
        print_error "package.json n'a pas été copié correctement"
        print_info "Répertoire source: $extracted_dir"
        print_info "Répertoire destination: $dest_dir"
        print_info "Fichiers dans le répertoire source:"
        ls -la "$extracted_dir" | head -10
        rm -rf "$temp_dir"
        return 1
    fi
    
    # S'assurer que les permissions sont correctes
    sudo chown -R "$APP_USER:$APP_USER" "$dest_dir"
    
    # Nettoyer
    rm -rf "$temp_dir"
    
    print_success "Release $version téléchargée et installée"
    print_info "Vérification: package.json trouvé dans $dest_dir"
}

# Fonction pour détecter le système d'exploitation
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "Impossible de détecter le système d'exploitation"
        exit 1
    fi
    
    print_info "Système détecté: $OS $OS_VERSION"
}

# Fonction pour détecter les serveurs web installés
detect_web_servers() {
    HAS_NGINX=false
    HAS_APACHE=false
    
    if command_exists nginx; then
        HAS_NGINX=true
        print_info "Nginx détecté"
    fi
    
    if command_exists apache2 || command_exists httpd; then
        HAS_APACHE=true
        print_info "Apache détecté"
    fi
    
    # Décider quel serveur web utiliser
    if [ "$HAS_NGINX" = true ] && [ "$HAS_APACHE" = true ]; then
        print_warning "Nginx et Apache sont tous les deux installés"
        echo ""
        echo "Options:"
        echo "  1) Utiliser Nginx (recommandé pour Next.js)"
        echo "  2) Utiliser Apache"
        echo "  3) Utiliser les deux (Nginx en reverse proxy, Apache pour autres sites)"
        echo ""
        read -p "Votre choix (1-3) [1]: " WEB_CHOICE
        WEB_CHOICE=${WEB_CHOICE:-1}
        
        case $WEB_CHOICE in
            1)
                WEB_SERVER="nginx"
                print_info "Configuration avec Nginx uniquement"
                ;;
            2)
                WEB_SERVER="apache"
                print_info "Configuration avec Apache uniquement"
                # Arrêter Nginx pour éviter les conflits de port
                if systemctl is-active --quiet nginx 2>/dev/null; then
                    print_warning "Arrêt de Nginx pour éviter les conflits..."
                    sudo systemctl stop nginx
                    sudo systemctl disable nginx
                fi
                ;;
            3)
                WEB_SERVER="both"
                print_info "Configuration avec Nginx (port 80/443) et Apache (port 8080)"
                # Configurer Apache sur un port différent
                if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                    if ! grep -q "Listen 8080" /etc/apache2/ports.conf 2>/dev/null; then
                        echo "Listen 8080" | sudo tee -a /etc/apache2/ports.conf > /dev/null
                    fi
                elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
                    if ! grep -q "Listen 8080" /etc/httpd/conf/httpd.conf 2>/dev/null; then
                        echo "Listen 8080" | sudo tee -a /etc/httpd/conf/httpd.conf > /dev/null
                    fi
                fi
                ;;
            *)
                WEB_SERVER="nginx"
                print_info "Choix par défaut: Nginx"
                ;;
        esac
    elif [ "$HAS_NGINX" = true ]; then
        WEB_SERVER="nginx"
        print_info "Utilisation de Nginx"
    elif [ "$HAS_APACHE" = true ]; then
        WEB_SERVER="apache"
        print_info "Utilisation d'Apache"
    else
        # Aucun serveur web installé, installer Nginx par défaut
        WEB_SERVER="nginx"
        print_info "Aucun serveur web détecté, installation de Nginx..."
    fi
}

# Fonction pour installer les dépendances système
install_system_dependencies() {
    print_info "Installation des dépendances système..."
    
    # Détecter les serveurs web existants
    detect_web_servers
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt update
        sudo apt install -y curl wget git build-essential python3
        
        # Installation de Node.js via NodeSource
        if ! command_exists node; then
            print_info "Installation de Node.js ${NODE_VERSION}.x..."
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt install -y nodejs
        else
            NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
            if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
                print_warning "Node.js version $NODE_CURRENT détectée, mise à jour vers ${NODE_VERSION}.x..."
                curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                sudo apt install -y nodejs
            fi
        fi
        
        # Installation de Nginx si nécessaire
        if [ "$WEB_SERVER" = "nginx" ] || [ "$WEB_SERVER" = "both" ]; then
            if ! command_exists nginx; then
                print_info "Installation de Nginx..."
                sudo apt install -y nginx
            fi
        fi
        
        # Installation d'Apache si nécessaire
        if [ "$WEB_SERVER" = "apache" ] || [ "$WEB_SERVER" = "both" ]; then
            if ! command_exists apache2; then
                print_info "Installation d'Apache..."
                sudo apt install -y apache2
            fi
        fi
        
        # Installation de PM2
        if ! command_exists pm2; then
            print_info "Installation de PM2..."
            sudo npm install -g pm2
        fi
        
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y curl wget git python3
        
        # Installation de Node.js via NodeSource
        if ! command_exists node; then
            print_info "Installation de Node.js ${NODE_VERSION}.x..."
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
            sudo yum install -y nodejs
        fi
        
        # Installation de Nginx si nécessaire
        if [ "$WEB_SERVER" = "nginx" ] || [ "$WEB_SERVER" = "both" ]; then
            if ! command_exists nginx; then
                print_info "Installation de Nginx..."
                sudo yum install -y nginx
            fi
        fi
        
        # Installation d'Apache si nécessaire
        if [ "$WEB_SERVER" = "apache" ] || [ "$WEB_SERVER" = "both" ]; then
            if ! command_exists httpd; then
                print_info "Installation d'Apache..."
                sudo yum install -y httpd
            fi
        fi
        
        # Installation de PM2
        if ! command_exists pm2; then
            print_info "Installation de PM2..."
            sudo npm install -g pm2
        fi
    else
        print_error "Système d'exploitation non supporté: $OS"
        exit 1
    fi
    
    print_success "Dépendances système installées"
}

# Fonction pour créer l'utilisateur de l'application
create_app_user() {
    if id "$APP_USER" &>/dev/null; then
        print_warning "L'utilisateur $APP_USER existe déjà"
    else
        print_info "Création de l'utilisateur $APP_USER..."
        sudo adduser --disabled-password --gecos "" "$APP_USER" || \
        sudo useradd -m -s /bin/bash "$APP_USER"
        print_success "Utilisateur $APP_USER créé"
    fi
}

# Fonction pour installer l'application
install_application() {
    print_info "Installation de l'application..."
    
    # Créer le répertoire de l'application
    sudo mkdir -p "$APP_DIR"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR"
    
    # Déterminer la méthode d'installation
    if [ "$INSTALL_METHOD" = "release" ]; then
        # Télécharger depuis GitHub
        local latest_version=$(get_latest_release "$GITHUB_REPO" "$GITHUB_TOKEN")
        
        if [ -z "$latest_version" ]; then
            print_error "Impossible de récupérer la dernière version depuis GitHub"
            print_info "Vérifiez votre connexion internet et le repository: $GITHUB_REPO"
            exit 1
        fi
        
        print_success "Dernière version trouvée: $latest_version"
        
        # Vérifier si unzip est installé
        if ! command_exists unzip; then
            print_info "Installation de unzip..."
            if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                sudo apt install -y unzip
            elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
                sudo yum install -y unzip
            fi
        fi
        
        # Télécharger et installer la release
        if ! download_release "$GITHUB_REPO" "$latest_version" "$GITHUB_TOKEN" "$APP_DIR"; then
            print_error "Échec du téléchargement de la release"
            exit 1
        fi
    else
        # Installation depuis les fichiers locaux
        if [ -f "package.json" ]; then
            print_info "Copie des fichiers de l'application..."
            sudo -u "$APP_USER" cp -r . "$APP_DIR/"
            sudo -u "$APP_USER" rm -rf "$APP_DIR/.git" "$APP_DIR/node_modules" "$APP_DIR/.next" 2>/dev/null || true
        else
            print_error "package.json non trouvé dans le répertoire actuel"
            print_info "Utilisez l'option --from-release pour télécharger depuis GitHub"
            exit 1
        fi
    fi
    
    # Aller dans le répertoire de l'application
    cd "$APP_DIR"
    
    # Vérifier que package.json existe
    if [ ! -f "package.json" ]; then
        print_error "package.json non trouvé dans $APP_DIR"
        print_info "Contenu du répertoire:"
        ls -la "$APP_DIR" | head -20
        print_error "L'installation a échoué. Vérifiez que les fichiers ont été correctement téléchargés."
        exit 1
    fi
    
    print_success "Fichiers de l'application vérifiés (package.json trouvé)"
    
    # Installer les dépendances npm
    print_info "Installation des dépendances npm (cela peut prendre plusieurs minutes)..."
    sudo -u "$APP_USER" npm install --production
    
    print_success "Application installée"
}

# Fonction pour configurer Prisma
configure_prisma() {
    print_info "Configuration de Prisma..."
    
    cd "$APP_DIR"
    
    # Générer les clients Prisma
    print_info "Génération des clients Prisma..."
    sudo -u "$APP_USER" npx prisma generate --schema=prisma/schema-main.prisma
    sudo -u "$APP_USER" npx prisma generate --schema=prisma/schema-company.prisma
    
    # Créer les bases de données
    print_info "Initialisation des bases de données..."
    sudo -u "$APP_USER" mkdir -p prisma/companies
    sudo -u "$APP_USER" npx prisma db push --schema=prisma/schema-main.prisma --accept-data-loss || true
    sudo -u "$APP_USER" npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss || true
    
    # Créer l'utilisateur admin par défaut
    print_info "Création du compte administrateur par défaut..."
    if [ -f "scripts/init-db.ts" ]; then
        sudo -u "$APP_USER" npx tsx scripts/init-db.ts || print_warning "Impossible de créer l'utilisateur admin (peut-être déjà existant)"
    else
        print_warning "Script init-db.ts non trouvé, création de l'admin ignorée"
    fi
    
    print_success "Prisma configuré"
}

# Fonction pour créer le fichier .env.local
create_env_file() {
    print_info "Configuration des variables d'environnement..."
    
    cd "$APP_DIR"
    
    # Générer un secret aléatoire pour NextAuth
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Déterminer l'URL
    if [ -z "$DOMAIN" ]; then
        NEXTAUTH_URL="http://localhost:${PORT}"
        NEXT_PUBLIC_BASE_URL="http://localhost:${PORT}"
    else
        NEXTAUTH_URL="https://${DOMAIN}"
        NEXT_PUBLIC_BASE_URL="https://${DOMAIN}"
    fi
    
    # Créer le fichier .env.local
    sudo -u "$APP_USER" cat > .env.local << EOF
# Base de données principale
DATABASE_URL_MAIN=file:./prisma/main.db

# NextAuth
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Base URL publique
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# Optionnel : Configuration SMTP (à compléter manuellement)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=votre-email@gmail.com
# SMTP_PASSWORD=votre-mot-de-passe-app
# SMTP_FROM=noreply@${DOMAIN:-localhost}

# Optionnel : Configuration SMS (à compléter manuellement)
# TWILIO_ACCOUNT_SID=votre-sid
# TWILIO_AUTH_TOKEN=votre-token
# TWILIO_PHONE_NUMBER=+33612345678
EOF
    
    sudo chmod 600 .env.local
    
    print_success "Fichier .env.local créé"
    print_warning "N'oubliez pas de configurer SMTP et SMS si nécessaire dans .env.local"
}

# Fonction pour builder l'application
build_application() {
    print_info "Construction de l'application (cela peut prendre plusieurs minutes)..."
    
    cd "$APP_DIR"
    
    sudo -u "$APP_USER" npm run build
    
    print_success "Application construite"
}

# Fonction pour configurer PM2
configure_pm2() {
    print_info "Configuration de PM2..."
    
    cd "$APP_DIR"
    
    # Créer le fichier ecosystem.config.js
    sudo -u "$APP_USER" cat > ecosystem.config.js << EOF
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
    
    # Créer les dossiers nécessaires
    sudo -u "$APP_USER" mkdir -p logs
    sudo -u "$APP_USER" mkdir -p public/logos
    sudo -u "$APP_USER" mkdir -p public/photos
    sudo -u "$APP_USER" chmod 755 public/logos public/photos
    
    # Démarrer avec PM2
    print_info "Démarrage de l'application avec PM2..."
    sudo -u "$APP_USER" pm2 start ecosystem.config.js
    sudo -u "$APP_USER" pm2 save
    
    # Configurer PM2 pour démarrer au boot
    print_info "Configuration de PM2 pour le démarrage automatique..."
    sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" || true
    
    print_success "PM2 configuré"
}

# Fonction pour configurer Nginx
configure_nginx() {
    if [ "$WEB_SERVER" != "nginx" ] && [ "$WEB_SERVER" != "both" ]; then
        return
    fi
    
    if [ -z "$DOMAIN" ]; then
        print_warning "Aucun domaine configuré, Nginx ne sera pas configuré"
        return
    fi
    
    print_info "Configuration de Nginx..."
    
    # Vérifier si Nginx est installé
    if ! command_exists nginx; then
        print_warning "Nginx n'est pas installé, configuration ignorée"
        return
    fi
    
    # Créer la configuration Nginx
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        CONFIG_FILE="/etc/nginx/sites-available/${APP_NAME}"
        ENABLED_DIR="/etc/nginx/sites-enabled"
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        CONFIG_FILE="/etc/nginx/conf.d/${APP_NAME}.conf"
        ENABLED_DIR="/etc/nginx/conf.d"
    fi
    
    # Sauvegarder la configuration existante si elle existe
    if [ -f "$CONFIG_FILE" ]; then
        print_warning "Configuration Nginx existante détectée, sauvegarde..."
        sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Créer la configuration
    sudo tee "$CONFIG_FILE" > /dev/null << EOF
# Configuration FixTector - HTTP
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirection HTTP vers HTTPS (sera activée après configuration SSL)
    # return 301 https://\$server_name\$request_uri;

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}

# Configuration HTTPS (sera ajoutée/modifiée par Certbot)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name ${DOMAIN} www.${DOMAIN};
#
#     ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     location / {
#         proxy_pass http://localhost:${PORT};
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_cache_bypass \$http_upgrade;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         
#         proxy_connect_timeout 60s;
#         proxy_send_timeout 60s;
#         proxy_read_timeout 60s;
#     }
#
#     client_max_body_size 10M;
# }
EOF
    
    # Activer le site (Ubuntu/Debian uniquement)
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo ln -sf "$CONFIG_FILE" "$ENABLED_DIR/${APP_NAME}"
        # Ne pas supprimer default si d'autres sites l'utilisent
        if [ ! -f "$ENABLED_DIR/default" ] || [ "$(ls -A $ENABLED_DIR 2>/dev/null | wc -l)" -eq 1 ]; then
            sudo rm -f "$ENABLED_DIR/default"
        fi
    fi
    
    # Tester la configuration
    if sudo nginx -t; then
        sudo systemctl restart nginx
        sudo systemctl enable nginx
        print_success "Nginx configuré"
    else
        print_error "Erreur dans la configuration Nginx"
        print_info "Vérifiez la configuration avec: sudo nginx -t"
    fi
}

# Fonction pour configurer Apache
configure_apache() {
    if [ "$WEB_SERVER" != "apache" ] && [ "$WEB_SERVER" != "both" ]; then
        return
    fi
    
    if [ -z "$DOMAIN" ]; then
        print_warning "Aucun domaine configuré, Apache ne sera pas configuré"
        return
    fi
    
    print_info "Configuration d'Apache..."
    
    # Vérifier si Apache est installé
    APACHE_CMD="apache2"
    APACHE_DIR="/etc/apache2"
    if [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        APACHE_CMD="httpd"
        APACHE_DIR="/etc/httpd"
    fi
    
    if ! command_exists "$APACHE_CMD"; then
        print_warning "Apache n'est pas installé, configuration ignorée"
        return
    fi
    
    # Activer les modules nécessaires
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo a2enmod proxy
        sudo a2enmod proxy_http
        sudo a2enmod headers
        sudo a2enmod rewrite
        CONFIG_FILE="$APACHE_DIR/sites-available/${APP_NAME}.conf"
        ENABLED_DIR="$APACHE_DIR/sites-enabled"
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        # Vérifier que les modules sont chargés
        if ! grep -q "LoadModule proxy_module" "$APACHE_DIR/conf/httpd.conf"; then
            echo "LoadModule proxy_module modules/mod_proxy.so" | sudo tee -a "$APACHE_DIR/conf/httpd.conf" > /dev/null
        fi
        if ! grep -q "LoadModule proxy_http_module" "$APACHE_DIR/conf/httpd.conf"; then
            echo "LoadModule proxy_http_module modules/mod_proxy_http.so" | sudo tee -a "$APACHE_DIR/conf/httpd.conf" > /dev/null
        fi
        CONFIG_FILE="$APACHE_DIR/conf.d/${APP_NAME}.conf"
        ENABLED_DIR="$APACHE_DIR/conf.d"
    fi
    
    # Sauvegarder la configuration existante
    if [ -f "$CONFIG_FILE" ]; then
        print_warning "Configuration Apache existante détectée, sauvegarde..."
        sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Déterminer le port Apache
    APACHE_PORT="80"
    if [ "$WEB_SERVER" = "both" ]; then
        APACHE_PORT="8080"
        print_info "Apache configuré sur le port 8080 (Nginx sur 80/443)"
    fi
    
    # Créer la configuration Apache
    sudo tee "$CONFIG_FILE" > /dev/null << EOF
# Configuration FixTector
<VirtualHost *:${APACHE_PORT}>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    
    # Redirection vers HTTPS (sera activée après configuration SSL)
    # Redirect permanent / https://${DOMAIN}/
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy vers l'application Next.js
    ProxyPass / http://localhost:${PORT}/
    ProxyPassReverse / http://localhost:${PORT}/
    
    # Headers nécessaires
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "${APACHE_PORT}"
    
    # Taille maximale des uploads
    LimitRequestBody 10485760
</VirtualHost>

# Configuration HTTPS (sera ajoutée par Certbot)
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${DOMAIN}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:${PORT}/
    ProxyPassReverse / http://localhost:${PORT}/
    
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    
    LimitRequestBody 10485760
</VirtualHost>
</IfModule>
EOF
    
    # Activer le site (Ubuntu/Debian uniquement)
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo a2ensite "${APP_NAME}.conf" 2>/dev/null || true
    fi
    
    # Tester la configuration
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        if sudo apache2ctl configtest; then
            sudo systemctl restart apache2
            sudo systemctl enable apache2
            print_success "Apache configuré"
        else
            print_error "Erreur dans la configuration Apache"
        fi
    elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
        if sudo httpd -t; then
            sudo systemctl restart httpd
            sudo systemctl enable httpd
            print_success "Apache configuré"
        else
            print_error "Erreur dans la configuration Apache"
        fi
    fi
}

# Fonction pour configurer le firewall
configure_firewall() {
    print_info "Configuration du firewall..."
    
    if command_exists ufw; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        echo "y" | sudo ufw enable || true
        print_success "Firewall UFW configuré"
    elif command_exists firewall-cmd; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewall firewalld configuré"
    else
        print_warning "Aucun firewall détecté, configuration manuelle nécessaire"
    fi
}

# Fonction pour configurer SSL (Let's Encrypt)
configure_ssl() {
    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        print_warning "Domaine ou email non fourni, SSL ne sera pas configuré"
        return
    fi
    
    print_info "Configuration de SSL avec Let's Encrypt..."
    
    # Installer Certbot selon le serveur web utilisé
    if [ "$WEB_SERVER" = "nginx" ] || [ "$WEB_SERVER" = "both" ]; then
        print_info "Configuration SSL pour Nginx..."
        
        # Installer Certbot pour Nginx
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            sudo apt install -y certbot python3-certbot-nginx
        elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
            sudo yum install -y certbot python3-certbot-nginx
        fi
        
        # Vérifier que Nginx est installé et configuré
        if command_exists nginx; then
            # Générer le certificat pour Nginx
            print_info "Génération du certificat SSL pour Nginx..."
            sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect || {
                print_warning "Échec de la génération du certificat SSL pour Nginx"
                print_info "Tentative manuelle recommandée: sudo certbot --nginx -d $DOMAIN"
            }
            
            # Vérifier que la configuration HTTPS a été ajoutée
            if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                CONFIG_FILE="/etc/nginx/sites-available/${APP_NAME}"
            else
                CONFIG_FILE="/etc/nginx/conf.d/${APP_NAME}.conf"
            fi
            
            if [ -f "$CONFIG_FILE" ] && grep -q "listen 443" "$CONFIG_FILE"; then
                print_success "SSL configuré pour Nginx"
                sudo nginx -t && sudo systemctl reload nginx
            else
                print_warning "Configuration HTTPS non détectée dans Nginx, vérification manuelle recommandée"
            fi
        else
            print_warning "Nginx n'est pas installé, SSL pour Nginx ignoré"
        fi
    fi
    
    if [ "$WEB_SERVER" = "apache" ] || [ "$WEB_SERVER" = "both" ]; then
        print_info "Configuration SSL pour Apache..."
        
        # Installer Certbot pour Apache
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            sudo apt install -y certbot python3-certbot-apache
            
            # Activer le module SSL si nécessaire
            sudo a2enmod ssl 2>/dev/null || true
        elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
            sudo yum install -y certbot python3-certbot-apache mod_ssl
        fi
        
        # Vérifier qu'Apache est installé
        APACHE_CMD="apache2"
        if [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
            APACHE_CMD="httpd"
        fi
        
        if command_exists "$APACHE_CMD"; then
            # Si Apache est sur le port 8080 (mode both), on ne configure pas SSL pour lui
            if [ "$WEB_SERVER" = "both" ]; then
                print_info "Apache est sur le port 8080, SSL sera configuré uniquement pour Nginx"
            else
                # Générer le certificat pour Apache
                print_info "Génération du certificat SSL pour Apache..."
                sudo certbot --apache -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect || {
                    print_warning "Échec de la génération du certificat SSL pour Apache"
                    print_info "Tentative manuelle recommandée: sudo certbot --apache -d $DOMAIN"
                }
                
                # Vérifier que la configuration HTTPS a été ajoutée
                if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                    CONFIG_FILE="/etc/apache2/sites-available/${APP_NAME}.conf"
                else
                    CONFIG_FILE="/etc/httpd/conf.d/${APP_NAME}.conf"
                fi
                
                if [ -f "$CONFIG_FILE" ] && grep -q "<VirtualHost \*:443>" "$CONFIG_FILE"; then
                    print_success "SSL configuré pour Apache"
                    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                        sudo apache2ctl configtest && sudo systemctl reload apache2
                    else
                        sudo httpd -t && sudo systemctl reload httpd
                    fi
                else
                    print_warning "Configuration HTTPS non détectée dans Apache, vérification manuelle recommandée"
                fi
            fi
        else
            print_warning "Apache n'est pas installé, SSL pour Apache ignoré"
        fi
    fi
    
    # Afficher les informations de renouvellement
    echo ""
    print_info "Certificat SSL configuré avec succès !"
    echo ""
    echo "Le certificat sera automatiquement renouvelé par Certbot."
    echo "Vérifiez le renouvellement automatique avec: sudo certbot renew --dry-run"
    echo ""
    
    print_success "Configuration SSL terminée"
}

# Fonction pour créer le script de sauvegarde
create_backup_script() {
    print_info "Création du script de sauvegarde..."
    
    sudo -u "$APP_USER" cat > "$APP_DIR/backup.sh" << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/home/fixtector/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/fixtector/fixtector"

mkdir -p $BACKUP_DIR

echo "Début de la sauvegarde..."

# Sauvegarder les bases de données
if [ -d "$APP_DIR/prisma" ]; then
    tar -czf $BACKUP_DIR/db_$DATE.tar.gz -C $APP_DIR prisma/*.db prisma/companies/*.db 2>/dev/null || true
    echo "Bases de données sauvegardées"
fi

# Sauvegarder les fichiers uploadés
if [ -d "$APP_DIR/public/logos" ] || [ -d "$APP_DIR/public/photos" ]; then
    tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $APP_DIR public/logos public/photos 2>/dev/null || true
    echo "Fichiers uploadés sauvegardés"
fi

# Supprimer les sauvegardes de plus de 7 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $BACKUP_DIR"
BACKUP_EOF
    
    sudo chmod +x "$APP_DIR/backup.sh"
    
    # Ajouter une tâche cron pour les sauvegardes quotidiennes à 2h du matin
    (sudo -u "$APP_USER" crontab -l 2>/dev/null | grep -v "backup.sh"; echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | sudo -u "$APP_USER" crontab -
    
    print_success "Script de sauvegarde créé et configuré"
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    echo "=========================================="
    print_success "Installation terminée avec succès !"
    echo "=========================================="
    echo ""
    echo "Informations de l'installation:"
    echo "  - Application: $APP_DIR"
    echo "  - Utilisateur: $APP_USER"
    echo "  - Port: $PORT"
    if [ -n "$DOMAIN" ]; then
        echo "  - Domaine: $DOMAIN"
        echo "  - URL: https://$DOMAIN"
    else
        echo "  - URL: http://localhost:$PORT"
    fi
    echo ""
    echo "Commandes utiles:"
    echo "  - Voir les logs: sudo -u $APP_USER pm2 logs $APP_NAME"
    echo "  - Redémarrer: sudo -u $APP_USER pm2 restart $APP_NAME"
    echo "  - Statut: sudo -u $APP_USER pm2 status"
    echo "  - Sauvegarde: $APP_DIR/backup.sh"
    if [ -f "$APP_DIR/update.sh" ]; then
        echo "  - Mise à jour: sudo $APP_DIR/update.sh"
    fi
    if [ -f "$APP_DIR/health-check.sh" ]; then
        echo "  - Vérification santé: sudo $APP_DIR/health-check.sh"
    fi
    echo ""
    if [ -z "$DOMAIN" ]; then
        print_warning "Pour configurer un domaine et SSL, exécutez:"
        echo "  sudo certbot --nginx -d votre-domaine.com"
    fi
    echo ""
    # Afficher la version installée
    if [ -f "$APP_DIR/package.json" ]; then
        INSTALLED_VERSION=$(grep '"version"' "$APP_DIR/package.json" | head -1 | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')
        echo "  - Version installée: $INSTALLED_VERSION"
    fi
    echo ""
    print_success "Compte administrateur créé automatiquement:"
    echo "   Email: admin@admin.com"
    echo "   Mot de passe: admin123"
    echo "   ⚠️  Changez ce mot de passe après la première connexion!"
    echo ""
    print_warning "N'oubliez pas de:"
    echo "  1. Configurer SMTP/SMS dans $APP_DIR/.env.local"
    echo "  2. Configurer les informations légales de l'entreprise"
    echo ""
    if [ "$INSTALL_METHOD" = "release" ]; then
        echo "Pour mettre à jour l'application, utilisez:"
        echo "  sudo $APP_DIR/update.sh"
        echo ""
    fi
}

# Fonction principale
main() {
    echo ""
    echo "=========================================="
    echo "  Installation automatique FixTector"
    echo "=========================================="
    echo ""
    
    # Vérifier que le script est exécuté en root ou avec sudo
    if [ "$EUID" -ne 0 ]; then
        print_error "Ce script doit être exécuté avec sudo"
        exit 1
    fi
    
    # Détecter l'OS
    detect_os
    
    # Demander les informations
    echo ""
    echo "Méthode d'installation:"
    echo "  1) Télécharger la dernière release depuis GitHub (recommandé)"
    echo "  2) Utiliser les fichiers locaux"
    read -p "Votre choix (1-2) [1]: " INSTALL_CHOICE
    INSTALL_CHOICE=${INSTALL_CHOICE:-1}
    
    case $INSTALL_CHOICE in
        1)
            INSTALL_METHOD="release"
            print_info "Installation depuis GitHub"
            
            # Demander le token GitHub si repository privé
            read -p "Token GitHub (optionnel, pour repository privé): " GITHUB_TOKEN
            if [ -n "$GITHUB_TOKEN" ]; then
                print_info "Token GitHub fourni pour repository privé"
            fi
            ;;
        2)
            INSTALL_METHOD="local"
            print_info "Installation depuis les fichiers locaux"
            ;;
        *)
            INSTALL_METHOD="release"
            print_info "Choix par défaut: Installation depuis GitHub"
            ;;
    esac
    
    read -p "Domaine (laisser vide pour localhost): " DOMAIN
    read -p "Email pour Let's Encrypt (laisser vide pour ignorer SSL): " EMAIL
    
    # Confirmer
    echo ""
    echo "Configuration:"
    echo "  - Domaine: ${DOMAIN:-localhost}"
    echo "  - Email: ${EMAIL:-non configuré}"
    echo "  - Port: $PORT"
    echo ""
    read -p "Continuer l'installation ? (o/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[OoYy]$ ]]; then
        print_info "Installation annulée"
        exit 0
    fi
    
    # Étapes d'installation
    install_system_dependencies
    create_app_user
    install_application
    configure_prisma
    create_env_file
    build_application
    configure_pm2
    configure_nginx
    configure_apache
    configure_firewall
    
    if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        configure_ssl
    fi
    
    create_backup_script
    
    # Copier les scripts utilitaires si présents
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Toujours copier update.sh depuis le script d'installation (même si installé depuis release)
    if [ -f "$SCRIPT_DIR/update.sh" ]; then
        print_info "Copie du script de mise à jour..."
        sudo -u "$APP_USER" cp "$SCRIPT_DIR/update.sh" "$APP_DIR/"
        sudo chmod +x "$APP_DIR/update.sh"
    elif [ -f "$APP_DIR/update.sh" ]; then
        # Si update.sh existe déjà dans l'application téléchargée, s'assurer qu'il est exécutable
        sudo chmod +x "$APP_DIR/update.sh"
    fi
    
    if [ -f "$SCRIPT_DIR/health-check.sh" ]; then
        print_info "Copie du script de vérification..."
        sudo -u "$APP_USER" cp "$SCRIPT_DIR/health-check.sh" "$APP_DIR/"
        sudo chmod +x "$APP_DIR/health-check.sh"
    elif [ -f "$APP_DIR/health-check.sh" ]; then
        sudo chmod +x "$APP_DIR/health-check.sh"
    fi
    
    # Afficher le résumé
    show_summary
}

# Exécuter le script principal
main

