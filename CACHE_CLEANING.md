# Système de Nettoyage de Cache - FixTector

Le système de nettoyage de cache permet de libérer de l'espace disque et d'améliorer les performances de l'application lorsque le site devient lent.

## 🎯 Fonctionnalités

Le système nettoie automatiquement :

1. **Cache Next.js** - Fichiers de cache de compilation et de rendu
2. **Cache Prisma** - Cache des clients Prisma générés
3. **Cache npm** - Cache global npm
4. **Fichiers temporaires** - Logs anciens (plus de 7 jours) et fichiers temporaires
5. **Anciens builds** - Fichiers statiques de plus de 30 jours
6. **Bases de données** - Optimisation SQLite (VACUUM) si disponible

## 📱 Utilisation via l'Interface Admin

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Administration**
3. Section **Nettoyage de cache**
4. Cliquez sur le type de nettoyage souhaité :
   - **Tout nettoyer** - Nettoie tous les caches
   - **Cache Next.js** - Nettoie uniquement le cache Next.js
   - **Cache Prisma** - Nettoie uniquement le cache Prisma
   - **Cache npm** - Nettoie uniquement le cache npm
   - **Fichiers temporaires** - Nettoie les logs et fichiers temporaires
   - **Anciens builds** - Nettoie les anciens builds

## 💻 Utilisation en Ligne de Commande

### Windows (PowerShell)
```powershell
.\scripts\clean-cache.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/clean-cache.sh
./scripts/clean-cache.sh
```

### TypeScript (Node.js)
```bash
npm run clean:cache
# ou
npm run clean:cache:all  # Force le nettoyage complet
```

## 🔄 Nettoyage Automatique

### Linux (Cron)

Ajoutez une tâche cron pour nettoyer automatiquement le cache tous les jours à 2h du matin :

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne (remplacez /chemin/vers/fixtector par votre chemin)
0 2 * * * cd /chemin/vers/fixtector && ./scripts/clean-cache.sh >> logs/cache-clean.log 2>&1
```

### Windows (Tâche Planifiée)

1. Ouvrez le **Planificateur de tâches**
2. Créez une nouvelle tâche
3. Définissez :
   - **Nom** : Nettoyage cache FixTector
   - **Déclencheur** : Quotidien à 2h00
   - **Action** : Exécuter un programme
   - **Programme** : `powershell.exe`
   - **Arguments** : `-File "C:\chemin\vers\fixtector\scripts\clean-cache.ps1"`

## 📊 Monitoring des Performances

### Détecter quand le site devient lent

Le système peut être déclenché automatiquement lorsque :

1. **Temps de réponse moyen > 2 secondes**
2. **Espace disque < 10% libre**
3. **Taille du cache > 1 GB**

### Script de monitoring (à créer)

```bash
#!/bin/bash
# scripts/monitor-performance.sh

RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3001)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
CACHE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)

if [ $(echo "$RESPONSE_TIME > 2.0" | bc) -eq 1 ] || [ "$DISK_USAGE" -gt 90 ]; then
    echo "Performance dégradée détectée - Nettoyage du cache..."
    ./scripts/clean-cache.sh
fi
```

## ⚠️ Notes Importantes

1. **Redémarrage recommandé** : Après le nettoyage, redémarrez le serveur pour appliquer les changements
2. **BUILD_ID préservé** : Le BUILD_ID Next.js est préservé pour éviter les problèmes de build
3. **Logs conservés** : Seuls les logs de plus de 7 jours sont supprimés
4. **Bases de données** : L'optimisation SQLite nécessite `sqlite3` installé

## 🔍 Vérification de l'Espace Libéré

Après le nettoyage, vous verrez :
- L'espace total libéré
- Le détail par type de cache
- Des recommandations pour améliorer les performances

## 🚀 Amélioration des Performances

Le nettoyage de cache peut améliorer :
- ✅ Temps de chargement des pages
- ✅ Temps de compilation Next.js
- ✅ Espace disque disponible
- ✅ Temps de réponse des API

## 📝 Logs

Les logs de nettoyage sont disponibles dans :
- **Interface admin** : Affichage en temps réel
- **Ligne de commande** : Sortie console
- **Cron** : `logs/cache-clean.log` (si configuré)

## 🆘 Dépannage

### Le nettoyage ne fonctionne pas

1. Vérifiez les permissions : `chmod +x scripts/clean-cache.sh`
2. Vérifiez que vous êtes dans le bon répertoire
3. Vérifiez les logs d'erreur

### Erreur "Permission denied"

```bash
# Linux
sudo chown -R $USER:$USER .
chmod +x scripts/clean-cache.sh

# Windows
# Exécutez PowerShell en tant qu'administrateur
```

### Le cache se regénère trop vite

C'est normal ! Next.js et Prisma régénèrent leur cache automatiquement. Le nettoyage est utile pour :
- Libérer de l'espace disque
- Forcer la régénération après des mises à jour
- Améliorer les performances après une période d'inactivité












