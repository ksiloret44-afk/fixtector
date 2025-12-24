# Script pour créer une release GitHub avec tous les fichiers compilés
# Version: 2.0.0

param(
    [Parameter(Mandatory=$true)]
    [string]$Version = "2.0.0",
    
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    
    [string]$GitHubRepo = "ksiloret44-afk/fixtector",
    
    [string]$ReleaseNotes = "",
    
    [switch]$Draft = $false,
    
    [switch]$Prerelease = $false
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création Release GitHub v$Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier le token GitHub
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Error "GITHUB_TOKEN n'est pas défini!"
    Write-Info "Définissez-le avec: `$env:GITHUB_TOKEN = 'votre-token'"
    Write-Info "Ou passez-le en paramètre: -GitHubToken 'votre-token'"
    exit 1
}

# Vérifier que git est installé
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git n'est pas installé!"
    exit 1
}

# Vérifier que nous sommes dans un repo git
if (-not (Test-Path ".git")) {
    Write-Error "Ce répertoire n'est pas un repository Git!"
    exit 1
}

$rootDir = $PWD
$tempDir = Join-Path $env:TEMP "fixtector-release-$Version"
$zipFile = "fixtector-v$Version.zip"

# Nettoyer le répertoire temporaire
if (Test-Path $tempDir) {
    Write-Info "Nettoyage du répertoire temporaire..."
    Remove-Item -Path $tempDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Info "Répertoire temporaire: $tempDir"

# Étape 1: Build de l'application
Write-Host ""
Write-Info "Étape 1: Compilation de l'application..."
Write-Info "Installation des dépendances..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec de l'installation des dépendances"
    exit 1
}

Write-Info "Génération de Prisma Client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Avertissement lors de la génération de Prisma Client"
}

Write-Info "Build de l'application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du build"
    exit 1
}

Write-Success "Build terminé avec succès!"

# Étape 2: Copier les fichiers nécessaires
Write-Host ""
Write-Info "Étape 2: Préparation des fichiers pour la release..."

# Liste des fichiers/dossiers à inclure
$filesToInclude = @(
    ".next",
    "public",
    "prisma",
    "scripts",
    "apache",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "README.md",
    "INSTALLATION.md",
    "SECURITY.md",
    "start.sh",
    "start.ps1",
    "install.sh",
    "install-initial.sh",
    "update.sh"
)

# Liste des fichiers/dossiers à exclure
$filesToExclude = @(
    ".git",
    ".next/cache",
    "node_modules",
    ".env*",
    "*.log",
    ".DS_Store",
    "Thumbs.db"
)

# Copier les fichiers
foreach ($item in $filesToInclude) {
    $sourcePath = Join-Path $rootDir $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $tempDir $item
        $destParent = Split-Path $destPath -Parent
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        
        if (Test-Path $sourcePath -PathType Container) {
            Write-Info "Copie du dossier: $item"
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        } else {
            Write-Info "Copie du fichier: $item"
            Copy-Item -Path $sourcePath -Destination $destPath -Force
        }
    } else {
        Write-Warning "Fichier/dossier introuvable: $item"
    }
}

# Créer un fichier .gitignore pour la release
$gitignoreContent = @"
node_modules/
.env*
*.log
.next/cache
.DS_Store
Thumbs.db
"@
Set-Content -Path (Join-Path $tempDir ".gitignore") -Value $gitignoreContent

# Créer un fichier VERSION
Set-Content -Path (Join-Path $tempDir "VERSION") -Value $Version

Write-Success "Fichiers préparés!"

# Étape 3: Créer le fichier ZIP
Write-Host ""
Write-Info "Étape 3: Création de l'archive ZIP..."

if (Test-Path $zipFile) {
    Write-Warning "Le fichier $zipFile existe déjà. Suppression..."
    Remove-Item $zipFile -Force
}

# Utiliser Compress-Archive
$zipPath = Join-Path $rootDir $zipFile
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

if (Test-Path $zipPath) {
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Success "Archive créée: $zipFile ($([math]::Round($zipSize, 2)) MB)"
} else {
    Write-Error "Échec de la création de l'archive"
    exit 1
}

# Étape 4: Créer le tag Git
Write-Host ""
Write-Info "Étape 4: Création du tag Git v$Version..."

# Vérifier si le tag existe déjà
$existingTag = git tag -l "v$Version"
if ($existingTag) {
    Write-Warning "Le tag v$Version existe déjà."
    $response = Read-Host "Voulez-vous le supprimer et le recréer? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        git tag -d "v$Version"
        git push origin ":refs/tags/v$Version" 2>$null
    } else {
        Write-Info "Utilisation du tag existant"
    }
}

if (-not $existingTag -or ($response -eq "O" -or $response -eq "o")) {
    git tag -a "v$Version" -m "Release v$Version"
    Write-Success "Tag créé: v$Version"
}

# Étape 5: Pousser le tag vers GitHub
Write-Host ""
Write-Info "Étape 5: Envoi du tag vers GitHub..."
git push origin "v$Version"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec de l'envoi du tag"
    exit 1
}
Write-Success "Tag envoyé vers GitHub!"

# Étape 6: Créer la release GitHub
Write-Host ""
Write-Info "Étape 6: Création de la release GitHub..."

# Préparer les notes de release
if ([string]::IsNullOrEmpty($ReleaseNotes)) {
    $ReleaseNotes = "Release v$Version`n`n## Changements`n- Version majeure 2.0.0`n- Améliorations et corrections de bugs"
}

$releaseData = @{
    tag_name = "v$Version"
    name = "v$Version"
    body = $ReleaseNotes
    draft = [bool]$Draft.IsPresent
    prerelease = [bool]$Prerelease.IsPresent
} | ConvertTo-Json

# Créer la release
$releaseUrl = "https://api.github.com/repos/$GitHubRepo/releases"
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $releaseResponse = Invoke-RestMethod -Uri $releaseUrl -Method Post -Headers $headers -Body $releaseData -ContentType "application/json"
    $releaseId = $releaseResponse.id
    Write-Success "Release créée: $($releaseResponse.html_url)"
} catch {
    Write-Error "Échec de la création de la release: $_"
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Info "La release existe peut-être déjà. Vérifiez sur GitHub."
    }
    exit 1
}

# Étape 7: Uploader le fichier ZIP
Write-Host ""
Write-Info "Étape 7: Upload de l'archive ZIP..."

$uploadUrl = "https://uploads.github.com/repos/$GitHubRepo/releases/$releaseId/assets?name=$zipFile"
$fileBytes = [System.IO.File]::ReadAllBytes($zipPath)
$fileEnc = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes)

$uploadHeaders = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/zip"
}

try {
    $uploadResponse = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $fileBytes
    Write-Success "Archive uploadée: $($uploadResponse.browser_download_url)"
} catch {
    Write-Error "Échec de l'upload: $_"
    exit 1
}

# Nettoyage
Write-Host ""
Write-Info "Nettoyage..."
Remove-Item -Path $tempDir -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Release créée avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Success "Release: $($releaseResponse.html_url)"
Write-Success "Archive: $($uploadResponse.browser_download_url)"
Write-Host ""
Write-Info "Fichier ZIP local: $zipFile"
Write-Host ""

