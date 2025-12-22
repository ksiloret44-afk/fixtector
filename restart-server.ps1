# Script pour redémarrer le serveur avec les bonnes variables d'environnement

Write-Host "Arrêt du serveur actuel..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Vérification du fichier .env.local..." -ForegroundColor Cyan
if (Test-Path .env.local) {
    Write-Host "✅ Fichier .env.local trouvé" -ForegroundColor Green
    Get-Content .env.local | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ Fichier .env.local non trouvé!" -ForegroundColor Red
    Write-Host "   Exécutez: .\create-env.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDémarrage du serveur..." -ForegroundColor Green
Write-Host "   Le serveur va démarrer sur http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Appuyez sur Ctrl+C pour arrêter`n" -ForegroundColor Gray

npm run dev

