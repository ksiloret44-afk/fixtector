#!/bin/bash

###############################################################################
# Script de mise à jour automatique FixTector
# Télécharge et installe automatiquement la dernière release depuis GitHub
###############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/fixtector"
GITHUB_REPO="ksiloret44-afk/fixtector"
GITHUB_TOKEN=""  # Optionnel, pour repository privé (peut être défini via variable d'environnement)

# Vérifier si le token est défini dans les variables d'environnement
if [ -z "$GITHUB_TOKEN" ] && [ -n "${GITHUB_TOKEN_ENV}" ]; then
    GITHUB_TOKEN="${GITHUB_TOKEN_ENV}"
fi

# Vérifier si le token est passé en argument
if [ "$1" = "--token" ] && [ -n "$2" ]; then
    GITHUB_TOKEN="$2"
fi

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

# Fonction pour récupérer la dernière release depuis GitHub
get_latest_release() {
    local repo=$1
    local token=$2
    
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

# Fonction pour récupérer la version actuelle depuis package.json
get_current_version() {
    if [ -f "$APP_DIR/package.json" ]; then
        grep '"version"' "$APP_DIR/package.json" | head -1 | sed -E 's/.*"version":\s*"([^"]+)".*/\1/'
    else
        echo "0.0.0"
    fi
}

# Fonction pour comparer les versions (simple)
compare_versions() {
    local v1=$1
    local v2=$2
    
    # Normaliser les versions (enlever le préfixe 'v' si présent)
    v1=$(echo "$v1" | sed 's/^v//')
    v2=$(echo "$v2" | sed 's/^v//')
    
    if [ "$v1" = "$v2" ]; then
        echo "0"
        return
    fi
    
    # Comparaison simple (format X.Y.Z)
    local IFS='.'
    read -ra v1_parts <<< "$v1"
    read -ra v2_parts <<< "$v2"
    
    for i in {0..2}; do
        local v1_part=${v1_parts[$i]:-0}
        local v2_part=${v2_parts[$i]:-0}
        
        if [ "$v1_part" -gt "$v2_part" ]; then
            echo "1"
            return
        elif [ "$v1_part" -lt "$v2_part" ]; then
            echo "-1"
            return
        fi
    done
    
    echo "0"
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
    if [ -n "$token" ]; then
        if ! curl -sL -H "Authorization: Bearer $token" -o "$zip_file" "$download_url"; then
            print_error "Impossible de télécharger la release"
            rm -rf "$temp_dir"
            return 1
        fi
    else
        if ! curl -sL -o "$zip_file" "$download_url"; then
            print_error "Impossible de télécharger la release"
            rm -rf "$temp_dir"
            return 1
        fi
    fi
    
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
    
    # Sauvegarder les fichiers importants avant remplacement
    print_info "Sauvegarde des fichiers de configuration..."
    if [ -f "$dest_dir/.env.local" ]; then
        sudo -u "$APP_USER" cp "$dest_dir/.env.local" "$dest_dir/.env.local.backup"
    fi
    
    # Copier les fichiers vers le répertoire de destination (sauf certains dossiers)
    print_info "Installation des nouveaux fichiers..."
    sudo -u "$APP_USER" rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='prisma/*.db' --exclude='prisma/companies' --exclude='public/logos' --exclude='public/photos' --exclude='public/uploads' "$extracted_dir/" "$dest_dir/"
    
    # Restaurer .env.local si sauvegardé
    if [ -f "$dest_dir/.env.local.backup" ]; then
        sudo -u "$APP_USER" mv "$dest_dir/.env.local.backup" "$dest_dir/.env.local"
    fi
    
    # Nettoyer
    rm -rf "$temp_dir"
    
    print_success "Release $version téléchargée et installée"
}

# Vérifier que le script est exécuté avec sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec sudo"
    exit 1
fi

print_info "Début de la mise à jour de FixTector..."

# Vérifier si le répertoire de l'application existe
if [ ! -d "$APP_DIR" ]; then
    print_error "Le répertoire de l'application n'existe pas: $APP_DIR"
    print_info "Utilisez install.sh pour installer l'application"
    exit 1
fi

# Vérifier la version actuelle
CURRENT_VERSION=$(get_current_version)
print_info "Version actuelle: $CURRENT_VERSION"

# Récupérer la dernière version depuis GitHub
print_info "Vérification de la dernière version disponible..."
LATEST_VERSION=$(get_latest_release "$GITHUB_REPO" "$GITHUB_TOKEN")

if [ -z "$LATEST_VERSION" ]; then
    print_error "Impossible de récupérer la dernière version depuis GitHub"
    print_info "Vérifiez votre connexion internet et le repository: $GITHUB_REPO"
    print_info "Tentative de mise à jour via Git..."
    
    # Fallback: utiliser git pull si disponible
    if [ -d "$APP_DIR/.git" ]; then
        cd "$APP_DIR"
        sudo -u "$APP_USER" git pull || {
            print_error "Échec de la mise à jour"
            exit 1
        }
    else
        print_error "Aucune méthode de mise à jour disponible"
        exit 1
    fi
else
    # Normaliser les versions pour comparaison
    LATEST_VERSION_CLEAN=$(echo "$LATEST_VERSION" | sed 's/^v//')
    CURRENT_VERSION_CLEAN=$(echo "$CURRENT_VERSION" | sed 's/^v//')
    
    print_success "Dernière version disponible: $LATEST_VERSION"
    
    # Comparer les versions
    COMPARE=$(compare_versions "$LATEST_VERSION_CLEAN" "$CURRENT_VERSION_CLEAN")
    
    if [ "$COMPARE" = "0" ]; then
        print_success "Vous êtes déjà sur la dernière version ($CURRENT_VERSION)"
        exit 0
    elif [ "$COMPARE" = "-1" ]; then
        print_warning "La version actuelle ($CURRENT_VERSION) est plus récente que la dernière release ($LATEST_VERSION)"
        read -p "Voulez-vous quand même télécharger $LATEST_VERSION ? (o/N): " CONFIRM
        if [[ ! "$CONFIRM" =~ ^[OoYy]$ ]]; then
            print_info "Mise à jour annulée"
            exit 0
        fi
    fi
    
    # Vérifier si unzip est installé
    if ! command -v unzip >/dev/null 2>&1; then
        print_info "Installation de unzip..."
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get install -y unzip
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y unzip
        else
            print_error "Impossible d'installer unzip automatiquement"
            exit 1
        fi
    fi
    
    # Télécharger et installer la release
    if ! download_release "$GITHUB_REPO" "$LATEST_VERSION" "$GITHUB_TOKEN" "$APP_DIR"; then
        print_error "Échec du téléchargement de la release"
        exit 1
    fi
fi

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

# Le téléchargement de la release a déjà été fait plus haut si nécessaire
# On continue avec l'installation des dépendances

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
    echo ""
    echo "=========================================="
    print_success "Mise à jour terminée avec succès !"
    echo "=========================================="
    echo ""
    echo "Version installée: $(get_current_version)"
    echo ""
    echo "Commandes utiles:"
    echo "  - Voir les logs: sudo -u $APP_USER pm2 logs fixtector"
    echo "  - Redémarrer: sudo -u $APP_USER pm2 restart fixtector"
    echo "  - Statut: sudo -u $APP_USER pm2 status"
    echo ""
    sudo -u "$APP_USER" pm2 status
else
    print_error "L'application ne semble pas démarrée correctement"
    print_info "Vérifiez les logs avec: sudo -u $APP_USER pm2 logs fixtector"
    exit 1
fi

