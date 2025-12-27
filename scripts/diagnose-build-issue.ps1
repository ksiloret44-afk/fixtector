# Script de diagnostic pour identifier les problèmes de build sur le serveur
# Usage: .\scripts\diagnose-build-issue.ps1

Write-Host "=== DIAGNOSTIC BUILD PRODUCTION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Version Node.js
Write-Host "1. Version Node.js:" -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "   Node.js: $nodeVersion"
Write-Host "   npm: $npmVersion"
Write-Host ""

# 2. Variables d'environnement critiques
Write-Host "2. Variables d'environnement:" -ForegroundColor Yellow
Write-Host "   NODE_ENV: $env:NODE_ENV"
Write-Host "   NODE_OPTIONS: $env:NODE_OPTIONS"
Write-Host "   NEXTAUTH_URL: $env:NEXTAUTH_URL"
Write-Host "   NEXTAUTH_SECRET: $(if ($env:NEXTAUTH_SECRET) { 'DÉFINI (' + $env:NEXTAUTH_SECRET.Length + ' caractères)' } else { 'NON DÉFINI' })"
Write-Host ""

# 3. Vérification des fichiers critiques
Write-Host "3. Fichiers critiques:" -ForegroundColor Yellow
$files = @(
    "package.json",
    "next.config.js",
    "scripts/build.js",
    "scripts/pre-build.js",
    ".env.local"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file existe"
    } else {
        Write-Host "   ✗ $file MANQUANT" -ForegroundColor Red
    }
}
Write-Host ""

# 4. Vérification des dépendances
Write-Host "4. Dépendances:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ node_modules existe"
    
    # Vérifier @types/archiver
    if (Test-Path "node_modules\@types\archiver") {
        Write-Host "   ✓ @types/archiver installé"
    } else {
        Write-Host "   ✗ @types/archiver MANQUANT" -ForegroundColor Red
    }
    
    # Vérifier archiver
    if (Test-Path "node_modules\archiver") {
        Write-Host "   ✓ archiver installé"
    } else {
        Write-Host "   ✗ archiver MANQUANT" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ node_modules MANQUANT - Exécutez: npm install" -ForegroundColor Red
}
Write-Host ""

# 5. Vérification du build
Write-Host "5. État du build:" -ForegroundColor Yellow
if (Test-Path ".next\BUILD_ID") {
    $buildId = Get-Content ".next\BUILD_ID" -ErrorAction SilentlyContinue
    Write-Host "   ✓ BUILD_ID existe: $buildId"
} else {
    Write-Host "   ✗ BUILD_ID MANQUANT - Le build n'a pas réussi" -ForegroundColor Red
}
Write-Host ""

# 6. Vérification du script build
Write-Host "6. Script de build:" -ForegroundColor Yellow
$buildScript = Get-Content "package.json" | ConvertFrom-Json
if ($buildScript.scripts.build -like "*scripts/build.js*") {
    Write-Host "   ✓ Le script build.js est utilisé"
} else {
    Write-Host "   ⚠ Le script build.js n'est PAS utilisé dans package.json" -ForegroundColor Yellow
    Write-Host "     Script actuel: $($buildScript.scripts.build)"
}
Write-Host ""

# 7. Test du polyfill self
Write-Host "7. Test du polyfill 'self':" -ForegroundColor Yellow
$testScript = @"
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    console.log('   ✗ self n est pas défini');
    process.exit(1);
} else {
    console.log('   ✓ self est défini');
}
"@
$testScript | node
Write-Host ""

# 8. Vérification des chemins
Write-Host "8. Chemins:" -ForegroundColor Yellow
$currentPath = Get-Location
Write-Host "   Répertoire actuel: $currentPath"
Write-Host "   Contient des espaces: $(if ($currentPath -match ' ') { 'OUI - Peut causer des problèmes' } else { 'NON' })"
Write-Host ""

# 9. Permissions
Write-Host "9. Permissions:" -ForegroundColor Yellow
try {
    $testFile = ".next\test-write.tmp"
    "test" | Out-File $testFile -ErrorAction Stop
    Remove-Item $testFile -ErrorAction Stop
    Write-Host "   ✓ Écriture autorisée dans .next"
} catch {
    Write-Host "   ✗ Problème d'écriture dans .next: $_" -ForegroundColor Red
}
Write-Host ""

# 10. Recommandations
Write-Host "=== RECOMMANDATIONS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le build échoue sur le serveur, vérifiez:" -ForegroundColor Yellow
Write-Host "1. Que NODE_OPTIONS contient '--require scripts/pre-build.js'"
Write-Host "2. Que le script 'build' dans package.json utilise 'node scripts/build.js'"
Write-Host "3. Que toutes les devDependencies sont installées (npm install --include=dev)"
Write-Host "4. Que la version de Node.js est >= 18.x"
Write-Host "5. Que le répertoire ne contient pas d'espaces"
Write-Host "6. Que les permissions d'écriture sont correctes"
Write-Host ""

