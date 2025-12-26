# Script d'installation de Cloudflare Tunnel (cloudflared) pour Windows
# Ce script installe cloudflared et configure un tunnel Cloudflare

Write-Host "`n=== Installation de Cloudflare Tunnel (cloudflared) ===" -ForegroundColor Cyan

# Vérifier si cloudflared est déjà installé
$cloudflaredInstalled = $false
try {
    $version = cloudflared --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Cloudflared est déjà installé: $version" -ForegroundColor Green
        $cloudflaredInstalled = $true
    }
} catch {
    $cloudflaredInstalled = $false
}

if (-not $cloudflaredInstalled) {
    Write-Host "`nInstallation de cloudflared..." -ForegroundColor Yellow
    
    # Méthode 1: Via winget (recommandé)
    try {
        Write-Host "Tentative d'installation via winget..." -ForegroundColor Cyan
        winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Cloudflared installé via winget!" -ForegroundColor Green
            $cloudflaredInstalled = $true
        }
    } catch {
        Write-Host "[INFO] Installation via winget échouée, tentative via téléchargement direct..." -ForegroundColor Yellow
    }
    
    # Méthode 2: Téléchargement direct si winget échoue
    if (-not $cloudflaredInstalled) {
        Write-Host "Téléchargement de cloudflared depuis GitHub..." -ForegroundColor Cyan
        
        $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        $installPath = "$env:ProgramFiles\cloudflared\cloudflared.exe"
        $installDir = "$env:ProgramFiles\cloudflared"
        
        # Créer le répertoire d'installation
        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        # Télécharger cloudflared
        try {
            Write-Host "Téléchargement en cours..." -ForegroundColor Yellow
            Invoke-WebRequest -Uri $downloadUrl -OutFile $installPath -UseBasicParsing
            Write-Host "[OK] Cloudflared téléchargé!" -ForegroundColor Green
        } catch {
            Write-Host "[ERREUR] Échec du téléchargement: $_" -ForegroundColor Red
            Write-Host "`nInstallation manuelle:" -ForegroundColor Yellow
            Write-Host "1. Téléchargez cloudflared depuis: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
            Write-Host "2. Extrayez cloudflared.exe dans: $installDir" -ForegroundColor White
            Write-Host "3. Ajoutez $installDir au PATH" -ForegroundColor White
            exit 1
        }
        
        # Ajouter au PATH si pas déjà présent
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        if ($currentPath -notlike "*$installDir*") {
            Write-Host "Ajout de cloudflared au PATH..." -ForegroundColor Cyan
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
            $env:Path += ";$installDir"
            Write-Host "[OK] cloudflared ajouté au PATH!" -ForegroundColor Green
        }
        
        $cloudflaredInstalled = $true
    }
}

# Vérifier l'installation
if ($cloudflaredInstalled) {
    Write-Host "`nVérification de l'installation..." -ForegroundColor Cyan
    try {
        $version = cloudflared --version 2>&1
        Write-Host "[OK] Version installée: $version" -ForegroundColor Green
    } catch {
        Write-Host "[ERREUR] cloudflared n'est pas accessible. Redémarrez PowerShell et réessayez." -ForegroundColor Red
        exit 1
    }
}

# Créer le répertoire de configuration
$configDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "[OK] Répertoire de configuration créé: $configDir" -ForegroundColor Green
}

Write-Host "`n=== Configuration Cloudflare Tunnel ===" -ForegroundColor Cyan
Write-Host "`nPour configurer un tunnel Cloudflare:" -ForegroundColor Yellow
Write-Host "1. Connectez-vous à Cloudflare: https://dash.cloudflare.com/" -ForegroundColor White
Write-Host "2. Allez dans Zero Trust > Networks > Tunnels" -ForegroundColor White
Write-Host "3. Créez un nouveau tunnel" -ForegroundColor White
Write-Host "4. Exécutez la commande fournie par Cloudflare pour authentifier:" -ForegroundColor White
Write-Host "   cloudflared tunnel login" -ForegroundColor Cyan
Write-Host "`n5. Créez un tunnel:" -ForegroundColor White
Write-Host "   cloudflared tunnel create fixtector" -ForegroundColor Cyan
Write-Host "`n6. Configurez le tunnel (créer config.yml dans $configDir):" -ForegroundColor White
Write-Host "   tunnel: fixtector" -ForegroundColor Cyan
Write-Host "   credentials-file: $configDir\fixtector.json" -ForegroundColor Cyan
Write-Host "   ingress:" -ForegroundColor Cyan
Write-Host "     - hostname: votre-domaine.com" -ForegroundColor Cyan
Write-Host "       service: http://localhost:3001" -ForegroundColor Cyan
Write-Host "     - service: http_status:404" -ForegroundColor Cyan
Write-Host "`n7. Routez le tunnel dans Cloudflare Dashboard" -ForegroundColor White
Write-Host "`n8. Démarrez le tunnel:" -ForegroundColor White
Write-Host "   cloudflared tunnel run fixtector" -ForegroundColor Cyan
Write-Host "`nOu utilisez cloudflared tunnel --help pour plus d'options" -ForegroundColor Yellow

Write-Host "`n[OK] Cloudflare Tunnel (cloudflared) est prêt!" -ForegroundColor Green
Write-Host "`nDocumentation: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/" -ForegroundColor Cyan














