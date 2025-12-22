# Script de démarrage pour Windows PowerShell
$env:DATABASE_URL="file:./dev.db"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:NEXTAUTH_SECRET="changez-moi-en-production-changez-moi-en-production"

Write-Host "Démarrage du serveur avec les variables d'environnement..." -ForegroundColor Green
Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Cyan
Write-Host "NEXTAUTH_URL: $env:NEXTAUTH_URL" -ForegroundColor Cyan
Write-Host "NEXTAUTH_SECRET: [défini]" -ForegroundColor Cyan
Write-Host ""

npm run dev

