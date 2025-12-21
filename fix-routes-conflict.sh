#!/bin/bash

# Script pour corriger le conflit de routes Next.js

APP_DIR="${1:-/home/fixtector/fixtector}"
APP_USER="${2:-fixtector}"

echo "=========================================="
echo "  Correction du conflit de routes Next.js"
echo "=========================================="
echo ""

# Vérifier si l'utilisateur existe
if ! id "$APP_USER" &>/dev/null; then
    echo "⚠️  Utilisateur $APP_USER n'existe pas"
    echo "   Utilisation de l'utilisateur actuel: $(whoami)"
    APP_USER=$(whoami)
    USE_SUDO=""
else
    USE_SUDO="sudo -u $APP_USER"
    echo "✅ Utilisateur $APP_USER trouvé"
fi

echo "Répertoire: $APP_DIR"
echo "Utilisateur: $APP_USER"
echo ""

# Vérifier si le répertoire existe
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Répertoire $APP_DIR n'existe pas"
    exit 1
fi

cd "$APP_DIR" || exit 1

# 1. Supprimer le dossier [token] qui cause le conflit
if [ -d "app/api/reviews/[token]" ]; then
    echo "🗑️  Suppression du dossier app/api/reviews/[token]..."
    if [ -n "$USE_SUDO" ]; then
        $USE_SUDO rm -rf "app/api/reviews/[token]" 2>&1 || sudo rm -rf "app/api/reviews/[token]"
    else
        rm -rf "app/api/reviews/[token]"
    fi
    
    if [ ! -d "app/api/reviews/[token]" ]; then
        echo "✅ Dossier [token] supprimé avec succès"
    else
        echo "⚠️  Tentative avec sudo..."
        sudo rm -rf "app/api/reviews/[token]"
        if [ ! -d "app/api/reviews/[token]" ]; then
            echo "✅ Dossier [token] supprimé avec sudo"
        else
            echo "❌ Échec de la suppression - suppression manuelle nécessaire"
            echo "   Exécutez: sudo rm -rf '$APP_DIR/app/api/reviews/[token]'"
        fi
    fi
else
    echo "✅ Dossier [token] n'existe pas (déjà supprimé)"
fi

# 2. Vérifier que by-token/[token] existe
if [ -d "app/api/reviews/by-token/[token]" ]; then
    echo "✅ Route by-token/[token] existe (correct)"
else
    echo "⚠️  Route by-token/[token] n'existe pas"
fi

# 3. Supprimer le cache Next.js
if [ -d ".next" ]; then
    echo "🗑️  Suppression du cache Next.js..."
    if [ -n "$USE_SUDO" ]; then
        $USE_SUDO rm -rf .next 2>&1 || sudo rm -rf .next
    else
        rm -rf .next
    fi
    echo "✅ Cache supprimé"
else
    echo "✅ Pas de cache à supprimer"
fi

# 4. Vérifier la version
if [ -f "package.json" ]; then
    VERSION=$(grep -oP '"version":\s*"\K[^"]+' package.json || echo "NON TROUVÉ")
    echo ""
    echo "📦 Version actuelle: $VERSION"
    
    if [ "$VERSION" != "1.1.6" ]; then
        echo "⚠️  Version incorrecte. Mise à jour recommandée vers v1.1.6"
        echo ""
        echo "Pour mettre à jour:"
        echo "  1. Télécharger v1.1.6 depuis GitHub"
        echo "  2. Ou utiliser: git checkout v1.1.6 (si Git est disponible)"
    fi
else
    echo "⚠️  package.json non trouvé"
fi

# 5. Vérifier la structure finale
echo ""
echo "=== Structure finale app/api/reviews/ ==="
if [ -d "app/api/reviews" ]; then
    find app/api/reviews -type d -name '\[*\]' | sort
else
    echo "⚠️  app/api/reviews/ n'existe pas"
fi

# 6. Vérifier les permissions
echo ""
echo "=== Vérification des permissions ==="
if [ -d "app/api/reviews" ]; then
    OWNER=$(stat -c '%U' app/api/reviews 2>/dev/null || echo "N/A")
    PERMS=$(stat -c '%a' app/api/reviews 2>/dev/null || echo "N/A")
    echo "Propriétaire de app/api/reviews: $OWNER"
    echo "Permissions: $PERMS"
    
    if [ "$OWNER" != "$APP_USER" ] && [ -n "$USE_SUDO" ]; then
        echo "⚠️  Correction des permissions..."
        sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR" 2>/dev/null || echo "   Échec (peut nécessiter sudo)"
    fi
fi

echo ""
echo "✅ Correction terminée !"
echo ""
echo "Prochaines étapes:"
if [ -n "$USE_SUDO" ]; then
    echo "  1. Rebuilder: sudo -u $APP_USER bash -c 'cd $APP_DIR && npm run build'"
    echo "  2. Si le build réussit, redémarrer: sudo -u $APP_USER pm2 restart fixtector"
else
    echo "  1. Rebuilder: cd $APP_DIR && npm run build"
    echo "  2. Si le build réussit, redémarrer: pm2 restart fixtector"
fi

