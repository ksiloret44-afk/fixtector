# Script pour compiler toutes les pages au démarrage
Write-Host "=== COMPILATION COMPLETE DE L'APPLICATION ===" -ForegroundColor Cyan
Write-Host ""

# Arrêter les processus Node.js existants
Write-Host "[1/3] Arret des processus Node.js existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Nettoyer le cache Next.js
Write-Host "[2/3] Nettoyage du cache Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}
Write-Host "  Cache nettoye" -ForegroundColor Green

# Compiler toutes les pages
Write-Host "[3/3] Compilation de toutes les pages..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre quelques minutes..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== COMPILATION TERMINEE ===" -ForegroundColor Green
    Write-Host "Demarrage du serveur en mode production..." -ForegroundColor Cyan
    Write-Host ""
    npm run start
} else {
    Write-Host ""
    Write-Host "=== ERREUR LORS DE LA COMPILATION ===" -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs avant de continuer." -ForegroundColor Yellow
    exit 1
}











