# Script de démarrage FixTector pour Windows
# Version: 2.0.0

param(
    [int]$Port = 3001,
    [string]$NodeEnv = "production"
)

# Couleurs
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Variables
$AppName = "fixtector"
$AppDir = if ($env:APP_DIR) { $env:APP_DIR } else { $PWD }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Démarrage FixTector v2.0.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js n'est pas installé!"
    exit 1
}

# Vérifier npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm n'est pas installé!"
    exit 1
}

# Vérifier le répertoire
if (-not (Test-Path $AppDir)) {
    Write-Error "Le répertoire $AppDir n'existe pas!"
    exit 1
}

Set-Location $AppDir

# Vérifier package.json
if (-not (Test-Path "package.json")) {
    Write-Error "package.json introuvable dans $AppDir"
    exit 1
}

Write-Info "Répertoire: $AppDir"
Write-Info "Port: $Port"
Write-Info "Environnement: $NodeEnv"

# Vérifier .env.local
if (-not (Test-Path ".env.local")) {
    Write-Warning ".env.local introuvable. Créez-le avant de démarrer."
}

# Vérifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Info "Installation des dépendances..."
    npm install
}

# Générer Prisma Client
if (Test-Path "prisma") {
    Write-Info "Génération de Prisma Client..."
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Erreur lors de la génération de Prisma Client"
    }
}

# Vérifier le build
if (-not (Test-Path ".next")) {
    Write-Info "Build introuvable. Compilation en cours..."
    npm run build
}

# Arrêter les processus existants sur le port
Write-Info "Vérification du port $Port..."
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existingProcess) {
    Write-Warning "Un processus utilise déjà le port $Port. Arrêt en cours..."
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Définir les variables d'environnement
$env:NODE_ENV = $NodeEnv
$env:PORT = $Port

# Démarrer l'application
Write-Success "Démarrage de l'application sur le port $Port..."
Write-Host ""

try {
    npm start
} catch {
    Write-Error "Erreur lors du démarrage: $_"
    exit 1
}











