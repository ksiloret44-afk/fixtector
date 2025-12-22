#!/bin/bash

# Script de diagnostic pour vérifier les conflits de routes Next.js

APP_DIR="${1:-/home/fixtector/fixtector}"

echo "=========================================="
echo "  Diagnostic des routes Next.js"
echo "=========================================="
echo ""
echo "Répertoire: $APP_DIR"
echo ""

# Vérifier si le répertoire existe
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Répertoire $APP_DIR n'existe pas"
    exit 1
fi

cd "$APP_DIR" || exit 1

# Vérifier la version
if [ -f "package.json" ]; then
    VERSION=$(grep -oP '"version":\s*"\K[^"]+' package.json || echo "NON TROUVÉ")
    echo "📦 Version dans package.json: $VERSION"
else
    echo "❌ package.json non trouvé"
    exit 1
fi

echo ""
echo "=== Routes dynamiques dans app/api/reviews/ ==="
if [ -d "app/api/reviews" ]; then
    echo "Routes trouvées:"
    find app/api/reviews -type d -name '\[*\]' | sort
    echo ""
    
    # Vérifier les conflits
    echo "Vérification des conflits au même niveau:"
    for dir in app/api/reviews/*/; do
        if [ -d "$dir" ]; then
            dirname=$(basename "$dir")
            if [[ "$dirname" =~ ^\[.*\]$ ]]; then
                echo "  Route dynamique trouvée: $dirname"
                # Vérifier s'il y a d'autres routes dynamiques au même niveau
                siblings=$(find "$(dirname "$dir")" -mindepth 1 -maxdepth 1 -type d -name '\[*\]' | wc -l)
                if [ "$siblings" -gt 1 ]; then
                    echo "    ⚠️  CONFLIT: $siblings routes dynamiques au même niveau!"
                    find "$(dirname "$dir")" -mindepth 1 -maxdepth 1 -type d -name '\[*\]' | while read d; do
                        echo "      - $(basename "$d")"
                    done
                fi
            fi
        fi
    done
else
    echo "❌ app/api/reviews/ n'existe pas"
fi

echo ""
echo "=== Structure complète app/api/reviews/ ==="
if [ -d "app/api/reviews" ]; then
    tree -L 3 app/api/reviews 2>/dev/null || find app/api/reviews -type d | head -20
fi

echo ""
echo "=== Vérification du cache Next.js ==="
if [ -d ".next" ]; then
    echo "⚠️  Cache .next existe - doit être supprimé"
    echo "   Taille: $(du -sh .next 2>/dev/null | awk '{print $1}')"
else
    echo "✅ Pas de cache .next"
fi

echo ""
echo "=== Vérification Git ==="
if [ -d ".git" ]; then
    CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "Pas sur un tag")
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
    echo "Tag actuel: $CURRENT_TAG"
    echo "Branche: $CURRENT_BRANCH"
    echo "Commit: $CURRENT_COMMIT"
else
    echo "⚠️  Pas un repository Git"
fi

echo ""
echo "=== Recommandations ==="
if [ -d ".next" ]; then
    echo "1. Supprimer le cache: sudo -u fixtector rm -rf $APP_DIR/.next"
fi
if [ -d "app/api/reviews/[token]" ]; then
    echo "2. Supprimer le dossier en conflit: sudo -u fixtector rm -rf $APP_DIR/app/api/reviews/[token]"
fi
echo "3. Vérifier la version téléchargée correspond à v1.1.6"
echo "4. Rebuilder: sudo -u fixtector bash -c 'cd $APP_DIR && npm run build'"


