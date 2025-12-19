# Script pour diagnostiquer et corriger les problèmes d'authentification

Write-Host "🔍 Diagnostic de l'authentification`n" -ForegroundColor Cyan

# 1. Vérifier le fichier .env.local
Write-Host "1. Vérification du fichier .env.local..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   ✅ Fichier .env.local trouvé" -ForegroundColor Green
    $envContent = Get-Content .env.local
    $hasSecret = $envContent | Select-String -Pattern "NEXTAUTH_SECRET"
    if ($hasSecret) {
        Write-Host "   ✅ NEXTAUTH_SECRET trouvé dans .env.local" -ForegroundColor Green
    } else {
        Write-Host "   ❌ NEXTAUTH_SECRET non trouvé dans .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Fichier .env.local non trouvé!" -ForegroundColor Red
    Write-Host "   Création du fichier..." -ForegroundColor Yellow
    .\create-env.ps1
}

# 2. Arrêter le serveur
Write-Host "`n2. Arrêt du serveur..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Serveur arrêté" -ForegroundColor Green

# 3. Vérifier la base de données
Write-Host "`n3. Vérification de la base de données..." -ForegroundColor Yellow
$env:DATABASE_URL="file:./dev.db"
$result = npx tsx scripts/check-user.ts 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Base de données OK" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Problème avec la base de données" -ForegroundColor Yellow
}

# 4. Redémarrer le serveur
Write-Host "`n4. Redémarrage du serveur..." -ForegroundColor Yellow
Write-Host "   Le serveur va démarrer avec les variables d'environnement`n" -ForegroundColor Cyan

# Démarrer le serveur en arrière-plan serait mieux mais pour l'instant on le laisse visible
npm run dev

