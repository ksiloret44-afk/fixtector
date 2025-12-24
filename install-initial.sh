#!/bin/bash

###############################################################################
# Script d'installation initial FixTector pour Linux
# Ce script télécharge le script install.sh complet depuis GitHub
# Compatible avec Ubuntu 20.04+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux
###############################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_REPO="ksiloret44-afk/fixtector"
GITHUB_TOKEN=""

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fonction pour télécharger install.sh depuis GitHub
download_install_script() {
    local repo=$1
    local token=$2
    local version=${3:-"latest"}
    
    print_info "Téléchargement du script install.sh..."
    
    # Méthode 1 : Télécharger depuis la dernière release (si disponible)
    if [ "$version" = "latest" ]; then
        print_info "Récupération de la dernière release..."
        
        local release_url="https://api.github.com/repos/$repo/releases/latest"
        local headers="Accept: application/vnd.github.v3+json"
        
        if [ -n "$token" ]; then
            headers="Authorization: Bearer $token
$headers"
            local release_info=$(curl -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github.v3+json" "$release_url")
        else
            local release_info=$(curl -s -H "Accept: application/vnd.github.v3+json" "$release_url")
        fi
        
        if echo "$release_info" | grep -q '"tag_name"'; then
            local tag_name=$(echo "$release_info" | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
            print_success "Dernière release trouvée: $tag_name"
            version=$tag_name
        else
            print_warning "Aucune release trouvée, utilisation de la branche main"
            version="main"
        fi
    fi
    
    # Télécharger install.sh depuis GitHub
    local file_url="https://api.github.com/repos/$repo/contents/install.sh?ref=$version"
    local temp_file=$(mktemp)
    
    if [ -n "$token" ]; then
        print_info "Téléchargement depuis GitHub (repository privé)..."
        if curl -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github.v3.raw" -o "$temp_file" "$file_url"; then
            if [ -s "$temp_file" ] && ! grep -q '"message"' "$temp_file"; then
                chmod +x "$temp_file"
                echo "$temp_file"
                return 0
            fi
        fi
    else
        # Essayer avec raw.githubusercontent.com (fonctionne pour les repos publics)
        print_info "Téléchargement depuis raw.githubusercontent.com..."
        if curl -sL -o "$temp_file" "https://raw.githubusercontent.com/$repo/$version/install.sh"; then
            if [ -s "$temp_file" ] && ! grep -q "404" "$temp_file"; then
                chmod +x "$temp_file"
                echo "$temp_file"
                return 0
            fi
        fi
    fi
    
    rm -f "$temp_file"
    return 1
}

# Vérifier que curl est installé
if ! command -v curl >/dev/null 2>&1; then
    print_error "curl n'est pas installé. Installez-le avec:"
    echo "  Ubuntu/Debian: sudo apt install curl"
    echo "  CentOS/Rocky: sudo yum install curl"
    exit 1
fi

# Demander le token GitHub si nécessaire
echo ""
echo "=========================================="
echo "  Installation initiale FixTector"
echo "=========================================="
echo ""
echo "Ce script télécharge le script install.sh complet depuis GitHub."
echo ""
read -p "Token GitHub (optionnel, requis pour repository privé): " GITHUB_TOKEN
echo ""

# Télécharger install.sh
INSTALL_SCRIPT=$(download_install_script "$GITHUB_REPO" "$GITHUB_TOKEN")

if [ -z "$INSTALL_SCRIPT" ] || [ ! -f "$INSTALL_SCRIPT" ]; then
    print_error "Impossible de télécharger install.sh depuis GitHub"
    echo ""
    echo "Solutions alternatives:"
    echo "  1. Cloner le repository:"
    echo "     git clone https://github.com/$GITHUB_REPO.git"
    echo "     cd fixtector"
    echo "     sudo ./install.sh"
    echo ""
    echo "  2. Télécharger depuis la release GitHub:"
    echo "     - Allez sur https://github.com/$GITHUB_REPO/releases"
    echo "     - Téléchargez la dernière release"
    echo "     - Extrayez install.sh et exécutez-le"
    echo ""
    echo "  3. Si le repository est privé, utilisez un token GitHub:"
    echo "     GITHUB_TOKEN=votre_token ./install-initial.sh"
    exit 1
fi

print_success "Script install.sh téléchargé avec succès"
echo ""
print_info "Exécution du script install.sh..."
echo ""

# Exécuter install.sh avec les arguments passés
exec "$INSTALL_SCRIPT" "$@"














