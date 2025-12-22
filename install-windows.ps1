# Script d'installation pour Windows - FixTector v1.4.0
# Optimisé pour Windows avec build de production

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Installation FixTector v1.4.0 Windows" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
Write-Host "[INFO] Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[SUCCESS] Node.js installé: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Vérifier npm
Write-Host "[INFO] Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "[SUCCESS] npm installé: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm n'est pas installé." -ForegroundColor Red
    exit 1
}

# Installation des dépendances
Write-Host ""
Write-Host "[INFO] Installation des dépendances npm (cela peut prendre plusieurs minutes)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Échec de l'installation des dépendances" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Dépendances installées" -ForegroundColor Green

# Génération des clients Prisma
Write-Host ""
Write-Host "[INFO] Génération des clients Prisma..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Échec de la génération des clients Prisma" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Clients Prisma générés" -ForegroundColor Green

# Initialisation des bases de données
Write-Host ""
Write-Host "[INFO] Initialisation des bases de données..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Problème lors de l'initialisation des bases de données" -ForegroundColor Yellow
}
Write-Host "[SUCCESS] Bases de données initialisées" -ForegroundColor Green

# Création du fichier .env.local si nécessaire
Write-Host ""
if (-not (Test-Path ".env.local")) {
    Write-Host "[INFO] Création du fichier .env.local..." -ForegroundColor Yellow
    $envContent = @"
# Base de données principale
DATABASE_URL=file:./prisma/main.db

# Base de données des entreprises (sera remplacée dynamiquement)
DATABASE_URL_MAIN=file:./prisma/main.db

# NextAuth
NEXTAUTH_SECRET=$(New-Guid).ToString().Replace('-', '')
NEXTAUTH_URL=http://localhost:3001

# URL publique
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# SMTP (optionnel)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Twilio (optionnel)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "[SUCCESS] Fichier .env.local créé" -ForegroundColor Green
    Write-Host "[WARNING] N'oubliez pas de configurer SMTP et SMS si nécessaire dans .env.local" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Le fichier .env.local existe déjà" -ForegroundColor Yellow
}

# Build de production
Write-Host ""
Write-Host "[INFO] Construction de l'application en mode production (cela peut prendre plusieurs minutes)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Échec du build" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Application construite en mode production" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Installation terminée avec succès !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour démarrer le serveur en mode production:" -ForegroundColor Yellow
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Le serveur sera accessible sur: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

