#!/bin/bash

###############################################################################
# Script de vérification de santé FixTector
###############################################################################

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_USER="fixtector"
APP_DIR="/home/${APP_USER}/fixtector"
PORT="3000"

# Détecter l'OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi

print_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo ""
echo "=========================================="
echo "  Vérification de santé FixTector"
echo "=========================================="
echo ""

# Vérifier PM2
echo "1. Vérification PM2..."
if command -v pm2 >/dev/null 2>&1; then
    if sudo -u "$APP_USER" pm2 list | grep -q "fixtector"; then
        STATUS=$(sudo -u "$APP_USER" pm2 jlist | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ "$STATUS" = "online" ]; then
            print_ok "PM2: Application en cours d'exécution"
        else
            print_error "PM2: Application non démarrée (statut: $STATUS)"
        fi
    else
        print_error "PM2: Application non trouvée dans PM2"
    fi
else
    print_error "PM2: Non installé"
fi

# Vérifier le port
echo ""
echo "2. Vérification du port $PORT..."
if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
    print_ok "Port $PORT: Écoute active"
else
    print_error "Port $PORT: Non accessible"
fi

# Vérifier Nginx
echo ""
echo "3. Vérification Nginx..."
if command -v nginx >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        print_ok "Nginx: Service actif"
        if sudo nginx -t >/dev/null 2>&1; then
            print_ok "Nginx: Configuration valide"
        else
            print_error "Nginx: Erreur dans la configuration"
        fi
    else
        print_warning "Nginx: Service inactif"
    fi
else
    print_warning "Nginx: Non installé"
fi

# Vérifier les bases de données
echo ""
echo "4. Vérification des bases de données..."
if [ -f "$APP_DIR/prisma/main.db" ]; then
    SIZE=$(du -h "$APP_DIR/prisma/main.db" | cut -f1)
    print_ok "Base principale: Présente ($SIZE)"
else
    print_error "Base principale: Absente"
fi

if [ -d "$APP_DIR/prisma/companies" ]; then
    COUNT=$(find "$APP_DIR/prisma/companies" -name "*.db" 2>/dev/null | wc -l)
    print_ok "Bases d'entreprise: $COUNT base(s) trouvée(s)"
else
    print_warning "Bases d'entreprise: Dossier absent"
fi

# Vérifier l'espace disque
echo ""
echo "5. Vérification de l'espace disque..."
DISK_USAGE=$(df -h "$APP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_ok "Espace disque: ${DISK_USAGE}% utilisé"
elif [ "$DISK_USAGE" -lt 90 ]; then
    print_warning "Espace disque: ${DISK_USAGE}% utilisé (attention)"
else
    print_error "Espace disque: ${DISK_USAGE}% utilisé (critique)"
fi

# Vérifier la mémoire
echo ""
echo "6. Vérification de la mémoire..."
MEM_TOTAL=$(free -m | awk 'NR==2{printf "%.0f", $2}')
MEM_USED=$(free -m | awk 'NR==2{printf "%.0f", $3}')
MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
if [ "$MEM_PERCENT" -lt 80 ]; then
    print_ok "Mémoire: ${MEM_PERCENT}% utilisée (${MEM_USED}MB / ${MEM_TOTAL}MB)"
elif [ "$MEM_PERCENT" -lt 90 ]; then
    print_warning "Mémoire: ${MEM_PERCENT}% utilisée (attention)"
else
    print_error "Mémoire: ${MEM_PERCENT}% utilisée (critique)"
fi

# Vérifier les fichiers .env
echo ""
echo "7. Vérification de la configuration..."
if [ -f "$APP_DIR/.env.local" ]; then
    print_ok "Fichier .env.local: Présent"
    if grep -q "NEXTAUTH_SECRET" "$APP_DIR/.env.local"; then
        print_ok "NEXTAUTH_SECRET: Configuré"
    else
        print_error "NEXTAUTH_SECRET: Manquant"
    fi
else
    print_error "Fichier .env.local: Absent"
fi

# Vérifier les logs récents
echo ""
echo "8. Vérification des logs récents..."
if [ -f "$APP_DIR/logs/err.log" ]; then
    ERROR_COUNT=$(tail -100 "$APP_DIR/logs/err.log" 2>/dev/null | grep -i "error" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_ok "Logs: Aucune erreur récente"
    else
        print_warning "Logs: $ERROR_COUNT erreur(s) récente(s)"
    fi
else
    print_warning "Logs: Fichier de logs non trouvé"
fi

# Test de connexion HTTP
echo ""
echo "9. Test de connexion HTTP..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200\|302\|301"; then
    print_ok "HTTP: Application accessible"
else
    print_error "HTTP: Application non accessible"
fi

# Vérifier les sauvegardes
echo ""
echo "10. Vérification des sauvegardes..."
if [ -d "/home/${APP_USER}/backups" ]; then
    BACKUP_COUNT=$(find "/home/${APP_USER}/backups" -name "*.tar.gz" -mtime -7 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        print_ok "Sauvegardes: $BACKUP_COUNT sauvegarde(s) récente(s) (7 derniers jours)"
    else
        print_warning "Sauvegardes: Aucune sauvegarde récente"
    fi
else
    print_warning "Sauvegardes: Dossier absent"
fi

echo ""
echo "=========================================="
echo "  Vérification terminée"
echo "=========================================="
echo ""

