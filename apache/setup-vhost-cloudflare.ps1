# Script de configuration VHost Apache + Cloudflare
# Ce script configure un virtual host Apache et Cloudflare Tunnel

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$TunnelName = "fixtector",
    
    [Parameter(Mandatory=$false)]
    [string]$ApachePath = "C:\Apache24"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration VHost + Cloudflare     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERREUR] Ce script nécessite des privilèges administrateur!" -ForegroundColor Red
    exit 1
}

# Vérifier Apache
if (-not (Test-Path "$ApachePath\bin\httpd.exe")) {
    Write-Host "[ERREUR] Apache non trouvé dans: $ApachePath" -ForegroundColor Red
    Write-Host "Vérifiez le chemin ou installez Apache." -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Domaine: $Domain" -ForegroundColor Cyan
Write-Host "[INFO] Apache: $ApachePath" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Créer le fichier vhost Apache
Write-Host "[1/4] Création du Virtual Host Apache..." -ForegroundColor Yellow

$vhostContent = Get-Content "$PSScriptRoot\vhost-example.conf" -Raw
$vhostContent = $vhostContent -replace "example\.com", $Domain
$vhostContent = $vhostContent -replace "C:/Apache24", $ApachePath.Replace('\', '/')

$vhostFile = "$ApachePath\conf\extra\vhost-$Domain.conf"
$vhostContent | Out-File -FilePath $vhostFile -Encoding UTF8
Write-Host "[OK] Virtual Host créé: $vhostFile" -ForegroundColor Green

# Ajouter Include dans httpd.conf
$httpdConf = "$ApachePath\conf\httpd.conf"
$httpdContent = Get-Content $httpdConf -Raw
if ($httpdContent -notmatch "Include.*vhost-$Domain.conf") {
    Add-Content $httpdConf "`n# Virtual Host $Domain`nInclude conf/extra/vhost-$Domain.conf"
    Write-Host "[OK] Include ajouté dans httpd.conf" -ForegroundColor Green
}

# Étape 2: Installer/Vérifier Cloudflare Tunnel
Write-Host ""
Write-Host "[2/4] Installation/Vérification de Cloudflare Tunnel..." -ForegroundColor Yellow

$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "[INFO] cloudflared non trouvé, installation en cours..." -ForegroundColor Yellow
    
    # Vérifier si winget est disponible
    $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $wingetPath) {
        Write-Host "[ERREUR] winget n'est pas disponible." -ForegroundColor Red
        Write-Host "Installez cloudflared manuellement:" -ForegroundColor Yellow
        Write-Host "  winget install --id Cloudflare.cloudflared" -ForegroundColor Cyan
        Write-Host "  Ou téléchargez depuis: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Cyan
        exit 1
    }
    
    try {
        Write-Host "[INFO] Installation via winget..." -ForegroundColor Cyan
        winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] cloudflared installé avec succès!" -ForegroundColor Green
            # Rafraîchir le PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            $cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
        } else {
            Write-Host "[ERREUR] Échec de l'installation via winget." -ForegroundColor Red
            Write-Host "Installez manuellement: winget install --id Cloudflare.cloudflared" -ForegroundColor Cyan
            exit 1
        }
    } catch {
        Write-Host "[ERREUR] Erreur lors de l'installation: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] cloudflared trouvé: $($cloudflaredPath.Source)" -ForegroundColor Green
}

# Vérifier la version
$version = & cloudflared --version 2>&1
Write-Host "[INFO] Version: $version" -ForegroundColor Cyan

# Vérifier si l'utilisateur est connecté
Write-Host "[INFO] Vérification de la connexion Cloudflare..." -ForegroundColor Cyan
$tunnels = & cloudflared tunnel list 2>&1
if ($LASTEXITCODE -ne 0 -or $tunnels -match "not logged in" -or $tunnels -match "authentication") {
    Write-Host "[ATTENTION] Vous n'êtes pas connecté à Cloudflare." -ForegroundColor Yellow
    Write-Host "[INFO] Une fenêtre de navigateur va s'ouvrir pour vous connecter..." -ForegroundColor Cyan
    Write-Host "Appuyez sur Entrée pour continuer..." -ForegroundColor Yellow
    Read-Host
    & cloudflared tunnel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Échec de la connexion à Cloudflare." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Connexion réussie!" -ForegroundColor Green
}

# Vérifier si le tunnel existe
$tunnels = & cloudflared tunnel list 2>&1
if ($tunnels -match $TunnelName) {
    Write-Host "[OK] Tunnel '$TunnelName' existe déjà" -ForegroundColor Green
    
    # Récupérer le Tunnel ID
    $tunnelInfo = & cloudflared tunnel info $TunnelName 2>&1
    if ($tunnelInfo -match "ID:\s+([a-f0-9-]+)") {
        $tunnelId = $Matches[1]
        Write-Host "[INFO] Tunnel ID: $tunnelId" -ForegroundColor Cyan
    } elseif ($tunnelInfo -match "(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})") {
        $tunnelId = $Matches[1]
        Write-Host "[INFO] Tunnel ID: $tunnelId" -ForegroundColor Cyan
    }
} else {
    Write-Host "[INFO] Tunnel '$TunnelName' n'existe pas encore" -ForegroundColor Yellow
    Write-Host "[INFO] Création du tunnel..." -ForegroundColor Cyan
    $tunnelOutput = & cloudflared tunnel create $TunnelName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Tunnel créé!" -ForegroundColor Green
        # Récupérer le Tunnel ID
        $tunnelInfo = & cloudflared tunnel info $TunnelName 2>&1
        if ($tunnelInfo -match "ID:\s+([a-f0-9-]+)") {
            $tunnelId = $Matches[1]
            Write-Host "[INFO] Tunnel ID: $tunnelId" -ForegroundColor Cyan
        } elseif ($tunnelInfo -match "(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})") {
            $tunnelId = $Matches[1]
            Write-Host "[INFO] Tunnel ID: $tunnelId" -ForegroundColor Cyan
        }
    } else {
        Write-Host "[ERREUR] Impossible de créer le tunnel" -ForegroundColor Red
        Write-Host $tunnelOutput -ForegroundColor Red
        exit 1
    }
}

# Étape 3: Créer/Modifier la configuration Cloudflare
Write-Host ""
Write-Host "[3/4] Configuration Cloudflare Tunnel..." -ForegroundColor Yellow

$cloudflaredConfigDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $cloudflaredConfigDir)) {
    New-Item -ItemType Directory -Path $cloudflaredConfigDir -Force | Out-Null
}

$configFile = "$cloudflaredConfigDir\config.yml"

if (Test-Path $configFile) {
    Write-Host "[INFO] Fichier de configuration existant trouvé" -ForegroundColor Cyan
    $backupFile = "$configFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $configFile $backupFile
    Write-Host "[OK] Backup créé: $backupFile" -ForegroundColor Green
}

# Demander le Tunnel ID si nécessaire
if (-not $tunnelId) {
    $tunnelId = Read-Host "Entrez le Tunnel ID (ou laissez vide pour créer un nouveau tunnel)"
    if ([string]::IsNullOrWhiteSpace($tunnelId)) {
        Write-Host "[INFO] Création d'un nouveau tunnel..." -ForegroundColor Cyan
        $tunnelOutput = cloudflared tunnel create $TunnelName 2>&1
        if ($tunnelOutput -match "(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})") {
            $tunnelId = $Matches[1]
            Write-Host "[OK] Tunnel créé avec ID: $tunnelId" -ForegroundColor Green
        } else {
            Write-Host "[ERREUR] Impossible de créer le tunnel" -ForegroundColor Red
            Write-Host $tunnelOutput -ForegroundColor Red
            exit 1
        }
    }
}

# Créer/Mettre à jour la configuration
$configContent = @"
tunnel: $tunnelId
credentials-file: $cloudflaredConfigDir\$tunnelId.json

ingress:
  # Règle 1: Trafic HTTPS vers Apache
  - hostname: $Domain
    service: http://localhost:80
  
  # Règle 2: Trafic HTTPS www vers Apache
  - hostname: www.$Domain
    service: http://localhost:80
  
  # Règle 3: Catch-all
  - service: http_status:404
"@

$configContent | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "[OK] Configuration Cloudflare créée: $configFile" -ForegroundColor Green

# Étape 4: Instructions DNS
Write-Host ""
Write-Host "[4/4] Instructions DNS Cloudflare..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration DNS requise            " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Allez sur https://dash.cloudflare.com" -ForegroundColor White
Write-Host "Sélectionnez votre domaine: $Domain" -ForegroundColor White
Write-Host "DNS > Records > Add record" -ForegroundColor White
Write-Host ""
Write-Host "Enregistrement 1 (domaine principal):" -ForegroundColor Yellow
Write-Host "  Type: CNAME" -ForegroundColor White
Write-Host "  Name: @" -ForegroundColor White
Write-Host "  Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
Write-Host "  Proxy: ✅ Proxied (orange cloud)" -ForegroundColor White
Write-Host ""
Write-Host "Enregistrement 2 (www):" -ForegroundColor Yellow
Write-Host "  Type: CNAME" -ForegroundColor White
Write-Host "  Name: www" -ForegroundColor White
Write-Host "  Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
Write-Host "  Proxy: ✅ Proxied (orange cloud)" -ForegroundColor White
Write-Host ""

# Résumé final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration terminée!             " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Configurez les enregistrements DNS ci-dessus" -ForegroundColor White
Write-Host "2. Testez la configuration Apache:" -ForegroundColor White
Write-Host "   $ApachePath\bin\httpd.exe -t" -ForegroundColor Cyan
Write-Host "3. Redémarrez Apache:" -ForegroundColor White
Write-Host "   $ApachePath\bin\httpd.exe -k restart" -ForegroundColor Cyan
Write-Host "4. Démarrez Cloudflare Tunnel:" -ForegroundColor White
Write-Host "   cloudflared tunnel run $TunnelName" -ForegroundColor Cyan
Write-Host "5. Attendez quelques minutes pour la propagation DNS" -ForegroundColor White
Write-Host "6. Testez: https://$Domain" -ForegroundColor Cyan
Write-Host ""


