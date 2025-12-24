#!/bin/bash
# Script de nettoyage de cache pour FixTector (Linux)
# Nettoie les caches Next.js, Prisma, npm, et autres fichiers temporaires

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour formater les tailles
format_bytes() {
    local bytes=$1
    if [ $bytes -eq 0 ]; then
        echo "0 B"
    else
        local k=1024
        local sizes=("B" "KB" "MB" "GB")
        local i=$(echo "l($bytes)/l($k)" | bc -l | cut -d. -f1)
        if [ -z "$i" ]; then i=0; fi
        local size=$(echo "scale=2; $bytes / ($k^$i)" | bc)
        echo "$size ${sizes[$i]}"
    fi
}

# Fonction pour calculer la taille d'un répertoire
get_dir_size() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        echo 0
        return
    fi
    du -sb "$dir" 2>/dev/null | cut -f1 || echo 0
}

TOTAL_FREED=0

echo ""
echo "=========================================="
echo -e "${BLUE}  Nettoyage de cache FixTector${NC}"
echo "=========================================="

# 1. Nettoyage du cache Next.js
echo ""
echo -e "${CYAN}[1/6] Nettoyage du cache Next.js...${NC}"
if [ -d ".next" ]; then
    SIZE_BEFORE=$(get_dir_size ".next")
    
    # Sauvegarder BUILD_ID
    BUILD_ID=""
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
    fi
    
    # Supprimer les sous-dossiers de cache
    [ -d ".next/cache" ] && rm -rf .next/cache
    [ -d ".next/server" ] && rm -rf .next/server
    [ -d ".next/static" ] && rm -rf .next/static
    
    # Restaurer BUILD_ID si nécessaire
    if [ -n "$BUILD_ID" ] && [ ! -f ".next/BUILD_ID" ]; then
        echo "$BUILD_ID" > .next/BUILD_ID
    fi
    
    SIZE_AFTER=$(get_dir_size ".next")
    FREED=$((SIZE_BEFORE - SIZE_AFTER))
    TOTAL_FREED=$((TOTAL_FREED + FREED))
    
    if [ $FREED -gt 0 ]; then
        echo -e "${GREEN}  ✓ Cache Next.js nettoyé: $(format_bytes $FREED) libérés${NC}"
    else
        echo -e "${YELLOW}  ℹ Cache Next.js déjà propre${NC}"
    fi
else
    echo -e "${YELLOW}  ℹ Aucun cache Next.js trouvé${NC}"
fi

# 2. Nettoyage du cache Prisma
echo ""
echo -e "${CYAN}[2/6] Nettoyage du cache Prisma...${NC}"
FREED=0
if [ -d "node_modules/.prisma" ]; then
    for client_dir in node_modules/.prisma/client-*; do
        if [ -d "$client_dir" ]; then
            SIZE_BEFORE=$(get_dir_size "$client_dir")
            [ -d "$client_dir/cache" ] && rm -rf "$client_dir/cache"
            SIZE_AFTER=$(get_dir_size "$client_dir")
            FREED=$((FREED + SIZE_BEFORE - SIZE_AFTER))
        fi
    done
fi

if [ $FREED -gt 0 ]; then
    echo -e "${GREEN}  ✓ Cache Prisma nettoyé: $(format_bytes $FREED) libérés${NC}"
    TOTAL_FREED=$((TOTAL_FREED + FREED))
else
    echo -e "${YELLOW}  ℹ Aucun cache Prisma à nettoyer${NC}"
fi

# 3. Nettoyage du cache npm
echo ""
echo -e "${CYAN}[3/6] Nettoyage du cache npm...${NC}"
if command -v npm >/dev/null 2>&1; then
    SIZE_BEFORE=$(get_dir_size "$(npm config get cache)")
    npm cache clean --force >/dev/null 2>&1 || true
    SIZE_AFTER=$(get_dir_size "$(npm config get cache)")
    FREED=$((SIZE_BEFORE - SIZE_AFTER))
    TOTAL_FREED=$((TOTAL_FREED + FREED))
    
    if [ $FREED -gt 0 ]; then
        echo -e "${GREEN}  ✓ Cache npm nettoyé: $(format_bytes $FREED) libérés${NC}"
    else
        echo -e "${YELLOW}  ℹ Cache npm déjà propre${NC}"
    fi
else
    echo -e "${YELLOW}  ℹ npm non disponible${NC}"
fi

# 4. Nettoyage des fichiers temporaires
echo ""
echo -e "${CYAN}[4/6] Nettoyage des fichiers temporaires...${NC}"
FREED=0

# Nettoyer les logs anciens (plus de 7 jours)
if [ -d "logs" ]; then
    find logs -name "*.log" -type f -mtime +7 -exec rm -f {} \; 2>/dev/null || true
    FREED=$(find logs -name "*.log" -type f -mtime +7 -exec du -sb {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
fi

# Nettoyer les fichiers temporaires
[ -d "tmp" ] && rm -rf tmp/* 2>/dev/null || true
[ -d "temp" ] && rm -rf temp/* 2>/dev/null || true

if [ $FREED -gt 0 ]; then
    echo -e "${GREEN}  ✓ Fichiers temporaires nettoyés: $(format_bytes $FREED) libérés${NC}"
    TOTAL_FREED=$((TOTAL_FREED + FREED))
else
    echo -e "${YELLOW}  ℹ Aucun fichier temporaire à nettoyer${NC}"
fi

# 5. Nettoyage des anciens builds
echo ""
echo -e "${CYAN}[5/6] Nettoyage des anciens builds...${NC}"
FREED=0
if [ -d ".next/static" ]; then
    # Supprimer les fichiers statiques de plus de 30 jours
    find .next/static -type f -mtime +30 -delete 2>/dev/null || true
    # Calculer l'espace libéré (approximatif)
    FREED=$(find .next/static -type f -mtime +30 -exec du -sb {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
fi

if [ $FREED -gt 0 ]; then
    echo -e "${GREEN}  ✓ Anciens builds nettoyés: $(format_bytes $FREED) libérés${NC}"
    TOTAL_FREED=$((TOTAL_FREED + FREED))
else
    echo -e "${YELLOW}  ℹ Aucun ancien build à nettoyer${NC}"
fi

# 6. Optimisation des bases de données
echo ""
echo -e "${CYAN}[6/6] Optimisation des bases de données...${NC}"
FREED=0
if [ -d "prisma" ]; then
    # Trouver toutes les bases SQLite
    DB_FILES=$(find prisma -name "*.db" -type f 2>/dev/null || true)
    
    for db_file in $DB_FILES; do
        if [ -f "$db_file" ]; then
            SIZE_BEFORE=$(stat -f%z "$db_file" 2>/dev/null || stat -c%s "$db_file" 2>/dev/null || echo 0)
            
            # VACUUM si sqlite3 est disponible
            if command -v sqlite3 >/dev/null 2>&1; then
                sqlite3 "$db_file" VACUUM >/dev/null 2>&1 || true
                SIZE_AFTER=$(stat -f%z "$db_file" 2>/dev/null || stat -c%s "$db_file" 2>/dev/null || echo 0)
                FREED=$((FREED + SIZE_BEFORE - SIZE_AFTER))
            fi
        fi
    done
fi

if [ $FREED -gt 0 ]; then
    echo -e "${GREEN}  ✓ Bases de données optimisées: $(format_bytes $FREED) libérés${NC}"
    TOTAL_FREED=$((TOTAL_FREED + FREED))
else
    echo -e "${YELLOW}  ℹ Bases de données déjà optimisées${NC}"
fi

# Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}  Nettoyage terminé !${NC}"
echo -e "${GREEN}  Espace libéré: $(format_bytes $TOTAL_FREED)${NC}"
echo "=========================================="

if [ $TOTAL_FREED -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 Conseil: Redémarrez le serveur pour appliquer les changements${NC}"
fi

exit 0












