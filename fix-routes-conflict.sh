#!/bin/bash

# Script pour corriger le conflit de routes Next.js

APP_DIR="${1:-/home/fixtector/fixtector}"

echo "=========================================="
echo "  Correction du conflit de routes Next.js"
echo "=========================================="
echo ""

cd "$APP_DIR" || exit 1

# 1. Supprimer le dossier [token] qui cause le conflit
if [ -d "app/api/reviews/[token]" ]; then
    echo "🗑️  Suppression du dossier app/api/reviews/[token]..."
    sudo -u fixtector rm -rf "app/api/reviews/[token]"
    if [ ! -d "app/api/reviews/[token]" ]; then
        echo "✅ Dossier [token] supprimé avec succès"
    else
        echo "❌ Échec de la suppression"
        exit 1
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
    sudo -u fixtector rm -rf .next
    echo "✅ Cache supprimé"
else
    echo "✅ Pas de cache à supprimer"
fi

# 4. Vérifier la version
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

# 5. Vérifier la structure finale
echo ""
echo "=== Structure finale app/api/reviews/ ==="
find app/api/reviews -type d -name '\[*\]' | sort

echo ""
echo "✅ Correction terminée !"
echo ""
echo "Prochaines étapes:"
echo "  1. Rebuilder: sudo -u fixtector bash -c 'cd $APP_DIR && npm run build'"
echo "  2. Si le build réussit, redémarrer: sudo -u fixtector pm2 restart fixtector"

