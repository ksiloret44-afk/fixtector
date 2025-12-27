# Guide de Diagnostic - Problèmes de Build sur Serveur Windows

## Pourquoi ça marche en local mais pas sur le serveur ?

Plusieurs différences peuvent expliquer ce problème. Voici les causes les plus courantes :

## 🔍 Causes Probables

### 1. **NODE_OPTIONS non défini**
Le polyfill `self` se charge via `NODE_OPTIONS --require scripts/pre-build.js`. Si cette variable n'est pas définie sur le serveur, le build échouera.

**Solution :**
```powershell
# Vérifier si NODE_OPTIONS est défini
echo $env:NODE_OPTIONS

# Si vide, définir avant le build :
$env:NODE_OPTIONS = "--require scripts/pre-build.js"
npm run build
```

### 2. **Script build.js non utilisé**
Le script `package.json` doit utiliser `node scripts/build.js` et non `next build` directement.

**Vérifier dans package.json :**
```json
"build": "npm run db:generate && node scripts/build.js"
```

### 3. **devDependencies non installées**
Sur le serveur, si `NODE_ENV=production` est défini avant `npm install`, les `devDependencies` (comme `@types/archiver`) ne seront pas installées.

**Solution :**
```powershell
# Installer TOUTES les dépendances (y compris dev)
npm install --include=dev
# OU
$env:NODE_ENV = $null
npm install
```

### 4. **Version Node.js différente**
Vérifier que la version de Node.js est identique ou compatible.

**Vérifier :**
```powershell
node --version
npm --version
```

### 5. **Chemins avec espaces**
Si le répertoire contient des espaces, cela peut causer des problèmes avec les scripts.

**Solution :** Déplacer le projet dans un chemin sans espaces.

### 6. **Permissions insuffisantes**
Le build nécessite des permissions d'écriture dans `.next/`.

**Solution :** Exécuter en tant qu'administrateur ou vérifier les permissions.

### 7. **Cache corrompu**
Le cache `.next/` peut être corrompu.

**Solution :**
```powershell
Remove-Item -Recurse -Force .next
npm run build
```

## 📋 Checklist de Diagnostic

Exécutez ces commandes sur le serveur :

```powershell
# 1. Vérifier Node.js
node --version
npm --version

# 2. Vérifier les variables d'environnement
echo "NODE_ENV: $env:NODE_ENV"
echo "NODE_OPTIONS: $env:NODE_OPTIONS"

# 3. Vérifier les fichiers
Test-Path "scripts/build.js"
Test-Path "scripts/pre-build.js"
Test-Path "package.json"

# 4. Vérifier les dépendances
Test-Path "node_modules\@types\archiver"
Test-Path "node_modules\archiver"

# 5. Vérifier le script de build
Get-Content package.json | Select-String "build"

# 6. Tester le polyfill
node -e "if (typeof global.self === 'undefined') { console.log('ERREUR: self non défini'); process.exit(1); } else { console.log('OK: self défini'); }"
```

## 🔧 Solution Rapide

Si le build échoue sur le serveur, exécutez cette séquence :

```powershell
# 1. Nettoyer
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 2. Réinstaller (sans NODE_ENV=production)
$env:NODE_ENV = $null
npm install

# 3. Définir NODE_OPTIONS
$env:NODE_OPTIONS = "--require scripts/pre-build.js"

# 4. Builder
npm run build

# 5. Vérifier
Test-Path ".next\BUILD_ID"
```

## 🚀 Script de Build pour Serveur

Créez un fichier `build-server.ps1` sur le serveur :

```powershell
# build-server.ps1
Write-Host "=== BUILD PRODUCTION SERVEUR ===" -ForegroundColor Cyan

# Nettoyer
Write-Host "Nettoyage..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Installer dépendances
Write-Host "Installation des dépendances..." -ForegroundColor Yellow
$env:NODE_ENV = $null
npm install

# Définir NODE_OPTIONS pour le polyfill
Write-Host "Configuration du polyfill..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--require scripts/pre-build.js"

# Builder
Write-Host "Build en cours..." -ForegroundColor Yellow
npm run build

# Vérifier
if (Test-Path ".next\BUILD_ID") {
    Write-Host "✓ Build réussi!" -ForegroundColor Green
} else {
    Write-Host "✗ Build échoué!" -ForegroundColor Red
    exit 1
}
```

## 📝 Notes Importantes

1. **Le script `build.js` est CRITIQUE** - Il charge le polyfill `self` via `NODE_OPTIONS`
2. **Les devDependencies sont REQUISES** - `@types/archiver` est nécessaire pour le build TypeScript
3. **NODE_OPTIONS doit être défini** - Sinon le polyfill ne se charge pas
4. **Le chemin de `pre-build.js` doit être correct** - Utilise `path.resolve(__dirname, 'pre-build.js')`

## 🐛 Erreurs Courantes

### "ReferenceError: self is not defined"
→ Le polyfill n'est pas chargé. Vérifier `NODE_OPTIONS`.

### "Could not find a declaration file for module 'archiver'"
→ `@types/archiver` n'est pas installé. Exécuter `npm install --include=dev`.

### "Build failed: BUILD_ID not found"
→ Le build a échoué. Vérifier les logs pour l'erreur exacte.

### "EPERM: operation not permitted"
→ Fichiers verrouillés. Arrêter le serveur avant de builder.

