#!/bin/bash
# Script d'installation de Cloudflare Tunnel (cloudflared) pour Linux
# Ce script installe cloudflared et configure un tunnel Cloudflare

echo ""
echo "=== Installation de Cloudflare Tunnel (cloudflared) ==="

# Vérifier si cloudflared est déjà installé
if command -v cloudflared &> /dev/null; then
    VERSION=$(cloudflared --version)
    echo "[OK] Cloudflared est déjà installé: $VERSION"
    exit 0
fi

# Détecter la distribution Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "[ERREUR] Impossible de détecter la distribution Linux"
    exit 1
fi

echo "Distribution détectée: $OS"
echo "Installation de cloudflared..."

# Installation selon la distribution
case $OS in
    ubuntu|debian)
        echo "Installation pour Ubuntu/Debian..."
        
        # Ajouter la clé GPG de Cloudflare
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
        
        if [ -f /tmp/cloudflared.deb ]; then
            sudo dpkg -i /tmp/cloudflared.deb || sudo apt-get install -f -y
            rm /tmp/cloudflared.deb
        else
            # Méthode alternative: téléchargement direct
            echo "Téléchargement direct..."
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
            chmod +x /tmp/cloudflared
            sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
        fi
        ;;
    
    fedora|rhel|centos)
        echo "Installation pour Fedora/RHEL/CentOS..."
        
        # Télécharger le binaire
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
        chmod +x /tmp/cloudflared
        sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
        ;;
    
    arch|manjaro)
        echo "Installation pour Arch Linux..."
        if command -v yay &> /dev/null; then
            yay -S cloudflared-bin
        elif command -v pacman &> /dev/null; then
            # Télécharger depuis AUR ou GitHub
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
            chmod +x /tmp/cloudflared
            sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
        fi
        ;;
    
    *)
        echo "Distribution non supportée automatiquement. Installation manuelle..."
        echo "Téléchargez cloudflared depuis: https://github.com/cloudflare/cloudflared/releases"
        echo "Puis:"
        echo "  chmod +x cloudflared"
        echo "  sudo mv cloudflared /usr/local/bin/"
        exit 1
        ;;
esac

# Vérifier l'installation
if command -v cloudflared &> /dev/null; then
    VERSION=$(cloudflared --version)
    echo "[OK] Cloudflared installé avec succès: $VERSION"
else
    echo "[ERREUR] Échec de l'installation de cloudflared"
    exit 1
fi

# Créer le répertoire de configuration
CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"
echo "[OK] Répertoire de configuration créé: $CONFIG_DIR"

# Créer un service systemd pour cloudflared (optionnel)
echo ""
echo "=== Configuration Cloudflare Tunnel ==="
echo ""
echo "Pour configurer un tunnel Cloudflare:"
echo "1. Connectez-vous à Cloudflare: https://dash.cloudflare.com/"
echo "2. Allez dans Zero Trust > Networks > Tunnels"
echo "3. Créez un nouveau tunnel"
echo "4. Exécutez la commande fournie par Cloudflare pour authentifier:"
echo "   cloudflared tunnel login"
echo ""
echo "5. Créez un tunnel:"
echo "   cloudflared tunnel create fixtector"
echo ""
echo "6. Configurez le tunnel (créer config.yml dans $CONFIG_DIR):"
echo "   tunnel: fixtector"
echo "   credentials-file: $CONFIG_DIR/fixtector.json"
echo "   ingress:"
echo "     - hostname: votre-domaine.com"
echo "       service: http://localhost:3001"
echo "     - service: http_status:404"
echo ""
echo "7. Routez le tunnel dans Cloudflare Dashboard"
echo ""
echo "8. Démarrez le tunnel:"
echo "   cloudflared tunnel run fixtector"
echo ""
echo "Ou créez un service systemd pour démarrer automatiquement:"
echo "   sudo nano /etc/systemd/system/cloudflared.service"
echo ""
echo "[OK] Cloudflare Tunnel (cloudflared) est prêt!"
echo ""
echo "Documentation: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/"














