#!/bin/bash

###############################################################################
# Script de dépannage pour l'installation FixTector
# Ce script vérifie et corrige les problèmes d'installation
###############################################################################

set -e

APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/fixtector"
GITHUB_REPO="ksiloret44-afk/fixtector"
GITHUB_TOKEN=""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier que le script est exécuté avec sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec sudo"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Diagnostic et correction installation"
echo "=========================================="
echo ""

# Demander le token GitHub
read -p "Token GitHub (requis pour repository privé): " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    print_error "Token GitHub requis pour un repository privé"
    exit 1
fi

# Vérifier que le répertoire existe
if [ ! -d "$APP_DIR" ]; then
    print_info "Création du répertoire $APP_DIR..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR"
fi

# Vérifier si package.json existe
if [ -f "$APP_DIR/package.json" ]; then
    print_success "package.json trouvé dans $APP_DIR"
    print_info "Version actuelle: $(grep '"version"' "$APP_DIR/package.json" | head -1 | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')"
    read -p "Voulez-vous réinstaller quand même ? (o/N): " REINSTALL
    if [[ ! "$REINSTALL" =~ ^[OoYy]$ ]]; then
        print_info "Installation annulée"
        exit 0
    fi
    print_info "Nettoyage du répertoire..."
    sudo rm -rf "$APP_DIR"/*
elif [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR 2>/dev/null)" ]; then
    print_warning "Le répertoire $APP_DIR existe mais ne contient pas package.json"
    print_info "Contenu actuel:"
    sudo ls -la "$APP_DIR" | head -10
    read -p "Voulez-vous nettoyer et réinstaller ? (o/N): " CLEAN
    if [[ "$CLEAN" =~ ^[OoYy]$ ]]; then
        print_info "Nettoyage du répertoire..."
        sudo rm -rf "$APP_DIR"/*
    fi
fi

# Installer Git si nécessaire
if ! command_exists git; then
    print_warning "Git n'est pas installé, installation..."
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y git
    elif command_exists yum; then
        sudo yum install -y git
    else
        print_error "Impossible d'installer Git automatiquement"
        exit 1
    fi
fi

# Méthode 1 : Cloner avec Git (le plus fiable)
print_info "Méthode 1 : Clonage du repository avec Git..."
if command_exists git; then
    # Si le répertoire existe et n'est pas vide, le supprimer d'abord
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR 2>/dev/null)" ]; then
        print_warning "Le répertoire $APP_DIR existe déjà et n'est pas vide"
        print_info "Suppression du contenu existant..."
        sudo rm -rf "$APP_DIR"/* "$APP_DIR"/.git 2>/dev/null || true
    fi
    
    local repo_url="https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
    
    print_info "Clonage directement dans $APP_DIR..."
    if sudo -u "$APP_USER" git clone "$repo_url" "$APP_DIR" 2>&1; then
        # Vérifier que package.json existe
        if [ -f "$APP_DIR/package.json" ]; then
            print_success "Repository cloné avec succès !"
            
            # S'assurer que les permissions sont correctes
            sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
            
            # Afficher quelques fichiers pour vérification
            echo ""
            print_info "Vérification des fichiers copiés:"
            sudo ls -la "$APP_DIR" | head -10
            echo ""
            print_success "Installation réussie ! Vous pouvez maintenant exécuter:"
            echo "  cd $APP_DIR"
            echo "  sudo -u $APP_USER npm install --production"
            exit 0
        else
            print_error "package.json non trouvé dans le repository cloné"
            print_info "Contenu de $APP_DIR:"
            sudo ls -la "$APP_DIR" | head -10
        fi
    else
        print_error "Échec du clonage Git"
        rm -rf "$temp_repo_dir"
    fi
else
    print_warning "Git n'est pas installé"
fi

# Méthode 2 : Télécharger depuis la release
print_info "Méthode 2 : Téléchargement depuis la release GitHub..."
if command_exists curl && command_exists unzip; then
    local latest_version=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | \
        grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
    
    if [ -n "$latest_version" ]; then
        print_success "Dernière version trouvée: $latest_version"
        local download_url="https://github.com/$GITHUB_REPO/archive/refs/tags/$latest_version.zip"
        local temp_dir=$(mktemp -d)
        local zip_file="$temp_dir/release.zip"
        
        print_info "Téléchargement de $download_url..."
        if curl -sL -H "Authorization: Bearer $GITHUB_TOKEN" -o "$zip_file" "$download_url"; then
            if [ -s "$zip_file" ]; then
                print_info "Extraction de l'archive..."
                if unzip -q "$zip_file" -d "$temp_dir"; then
                    local extracted_dir=$(find "$temp_dir" -mindepth 1 -maxdepth 1 -type d | head -1)
                    
                    if [ -f "$extracted_dir/package.json" ]; then
                        print_success "Archive extraite avec succès"
                        print_info "Copie des fichiers vers $APP_DIR..."
                        
                        sudo -u "$APP_USER" cp -r "$extracted_dir"/* "$APP_DIR/" 2>/dev/null || {
                            find "$extracted_dir" -mindepth 1 -maxdepth 1 -exec sudo -u "$APP_USER" cp -r {} "$APP_DIR/" \;
                        }
                        sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
                        
                        if [ -f "$APP_DIR/package.json" ]; then
                            print_success "Fichiers copiés avec succès depuis la release !"
                            rm -rf "$temp_dir"
                            exit 0
                        fi
                    fi
                fi
            fi
        fi
        rm -rf "$temp_dir"
    fi
fi

print_error "Toutes les méthodes ont échoué"
print_info "Vérifications à faire:"
echo "  1. Token GitHub valide et avec les permissions 'repo'"
echo "  2. Connexion internet fonctionnelle"
echo "  3. Repository accessible: https://github.com/$GITHUB_REPO"
echo ""
print_info "Vous pouvez essayer de cloner manuellement:"
echo "  sudo -u $APP_USER git clone https://${GITHUB_TOKEN}@github.com/$GITHUB_REPO.git $APP_DIR"
exit 1

