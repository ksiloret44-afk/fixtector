# Script d'installation et configuration Cloudflare Tunnel pour Windows
# Usage: .\scripts\setup-cloudflare-windows.ps1

param(
    [string]$TunnelName = "fixtector",
    [string]$Domain = "",
    [int]$LocalPort = 80,
    [switch]$InstallService = $false
)

# Couleurs pour les messages
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[ATTENTION] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERREUR] $Message" -ForegroundColor Red
}

# Vérifier si on est administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Ce script doit être exécuté en tant qu'administrateur."
    Write-Info "Relancez PowerShell en tant qu'administrateur et réessayez."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Vérifier/Installer cloudflared
Write-Info "Étape 1: Vérification de cloudflared..."

$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflaredPath) {
    Write-Warning "cloudflared n'est pas installé."
    Write-Info "Installation via winget..."
    
    # Vérifier si winget est disponible
    $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $wingetPath) {
        Write-Error "winget n'est pas disponible. Installez cloudflared manuellement:"
        Write-Info "  https://github.com/cloudflare/cloudflared/releases"
        Write-Info "  Ou installez winget depuis le Microsoft Store"
        exit 1
    }
    
    try {
        winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            Write-Success "cloudflared installé avec succès!"
            # Rafraîchir le PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        } else {
            Write-Error "Échec de l'installation via winget. Installez manuellement:"
            Write-Info "  winget install --id Cloudflare.cloudflared"
            exit 1
        }
    } catch {
        Write-Error "Erreur lors de l'installation: $_"
        exit 1
    }
} else {
    Write-Success "cloudflared est déjà installé: $($cloudflaredPath.Source)"
}

# Vérifier la version
$version = & cloudflared --version 2>&1
Write-Info "Version: $version"

Write-Host ""

# Étape 2: Connexion à Cloudflare
Write-Info "Étape 2: Connexion à Cloudflare..."
Write-Warning "Une fenêtre de navigateur va s'ouvrir pour vous connecter à Cloudflare."
Write-Info "Appuyez sur Entrée pour continuer..."
Read-Host

try {
    & cloudflared tunnel login
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connexion à Cloudflare réussie!"
    } else {
        Write-Error "Échec de la connexion à Cloudflare."
        exit 1
    }
} catch {
    Write-Error "Erreur lors de la connexion: $_"
    exit 1
}

Write-Host ""

# Étape 3: Créer le tunnel
Write-Info "Étape 3: Création du tunnel '$TunnelName'..."

# Vérifier si le tunnel existe déjà
$existingTunnels = & cloudflared tunnel list 2>&1
if ($existingTunnels -match $TunnelName) {
    Write-Warning "Le tunnel '$TunnelName' existe déjà."
    $response = Read-Host "Voulez-vous le réutiliser? (O/N)"
    if ($response -ne "O" -and $response -ne "o") {
        Write-Info "Suppression du tunnel existant..."
        & cloudflared tunnel delete $TunnelName
        Write-Info "Création d'un nouveau tunnel..."
        & cloudflared tunnel create $TunnelName
    } else {
        Write-Success "Réutilisation du tunnel existant."
    }
} else {
    try {
        & cloudflared tunnel create $TunnelName
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tunnel '$TunnelName' créé avec succès!"
        } else {
            Write-Error "Échec de la création du tunnel."
            exit 1
        }
    } catch {
        Write-Error "Erreur lors de la création du tunnel: $_"
        exit 1
    }
}

# Récupérer le Tunnel ID
$tunnelInfo = & cloudflared tunnel info $TunnelName 2>&1
$tunnelId = ""
if ($tunnelInfo -match "ID:\s+([a-f0-9-]+)") {
    $tunnelId = $matches[1]
    Write-Success "Tunnel ID: $tunnelId"
} else {
    Write-Warning "Impossible de récupérer le Tunnel ID automatiquement."
    Write-Info "Récupérez-le avec: cloudflared tunnel list"
    $tunnelId = Read-Host "Entrez le Tunnel ID manuellement"
}

Write-Host ""

# Étape 4: Configuration du fichier config.yml
Write-Info "Étape 4: Configuration du fichier config.yml..."

$cloudflaredDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $cloudflaredDir)) {
    New-Item -ItemType Directory -Path $cloudflaredDir -Force | Out-Null
    Write-Success "Répertoire créé: $cloudflaredDir"
}

# Demander le domaine si non fourni
if ([string]::IsNullOrEmpty($Domain)) {
    $Domain = Read-Host "Entrez votre domaine (ex: example.com)"
}

$configPath = "$cloudflaredDir\config.yml"
$credentialsPath = "$cloudflaredDir\$tunnelId.json"

# Vérifier si le fichier de credentials existe
if (-not (Test-Path $credentialsPath)) {
    Write-Warning "Le fichier de credentials n'existe pas: $credentialsPath"
    Write-Info "Il devrait être créé automatiquement lors de la création du tunnel."
}

# Créer le fichier de configuration
$configContent = @"
tunnel: $tunnelId
credentials-file: $credentialsPath

ingress:
  # Trafic HTTPS vers Apache/Node.js
  - hostname: $Domain
    service: http://localhost:$LocalPort
  
  # Trafic HTTPS www vers Apache/Node.js
  - hostname: www.$Domain
    service: http://localhost:$LocalPort
  
  # Catch-all (pour développement)
  - service: http_status:404
"@

Set-Content -Path $configPath -Value $configContent -Encoding UTF8
Write-Success "Fichier de configuration créé: $configPath"

Write-Host ""
Write-Info "Contenu du fichier de configuration:"
Write-Host $configContent -ForegroundColor Gray
Write-Host ""

# Étape 5: Instructions pour DNS
Write-Info "Étape 5: Configuration DNS dans Cloudflare Dashboard"
Write-Host ""
Write-Host "Vous devez maintenant configurer le DNS dans Cloudflare:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur https://dash.cloudflare.com" -ForegroundColor Cyan
Write-Host "2. Sélectionnez votre domaine: $Domain" -ForegroundColor Cyan
Write-Host "3. Allez dans DNS > Records" -ForegroundColor Cyan
Write-Host "4. Créez un enregistrement CNAME:" -ForegroundColor Cyan
Write-Host "   - Type: CNAME" -ForegroundColor White
Write-Host "   - Name: @ (ou www pour sous-domaine)" -ForegroundColor White
Write-Host "   - Target: $tunnelId.cfargotunnel.com" -ForegroundColor White
Write-Host "   - Proxy: ✅ Proxied (orange cloud)" -ForegroundColor White
Write-Host "   - TTL: Auto" -ForegroundColor White
Write-Host ""
Write-Warning "Appuyez sur Entrée une fois la configuration DNS terminée..."
Read-Host

Write-Host ""

# Étape 6: Tester le tunnel
Write-Info "Étape 6: Test du tunnel..."
Write-Info "Démarrage du tunnel en mode test (Ctrl+C pour arrêter)..."
Write-Host ""
Write-Warning "Le tunnel va démarrer. Vérifiez qu'il fonctionne correctement."
Write-Info "Une fois le test terminé, appuyez sur Ctrl+C pour arrêter."
Write-Host ""

$testResponse = Read-Host "Voulez-vous tester le tunnel maintenant? (O/N)"
if ($testResponse -eq "O" -or $testResponse -eq "o") {
    Write-Info "Démarrage du tunnel en mode test..."
    Write-Info "Ouvrez un autre terminal pour continuer pendant que le tunnel tourne."
    Write-Host ""
    & cloudflared tunnel run $TunnelName
}

Write-Host ""

# Étape 7: Installation comme service Windows (optionnel)
if ($InstallService) {
    Write-Info "Étape 7: Installation comme service Windows..."
    
    try {
        & cloudflared service install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Service cloudflared installé!"
            Write-Info "Démarrage du service..."
            Start-Service cloudflared
            Write-Success "Service démarré!"
            Write-Info "Vérification du statut..."
            Get-Service cloudflared
        } else {
            Write-Error "Échec de l'installation du service."
        }
    } catch {
        Write-Error "Erreur lors de l'installation du service: $_"
    }
} else {
    Write-Info "Étape 7: Installation comme service (optionnel)"
    Write-Host ""
    Write-Info "Pour installer cloudflared comme service Windows (démarrage automatique):"
    Write-Host "  cloudflared service install" -ForegroundColor Cyan
    Write-Host "  Start-Service cloudflared" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "Pour démarrer le tunnel manuellement:"
    Write-Host "  cloudflared tunnel run $TunnelName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuration terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Success "Résumé de la configuration:"
Write-Host "  - Tunnel: $TunnelName" -ForegroundColor White
Write-Host "  - Tunnel ID: $tunnelId" -ForegroundColor White
Write-Host "  - Domaine: $Domain" -ForegroundColor White
Write-Host "  - Port local: $LocalPort" -ForegroundColor White
Write-Host "  - Config: $configPath" -ForegroundColor White
Write-Host ""
Write-Info "Commandes utiles:"
Write-Host "  - Démarrer: cloudflared tunnel run $TunnelName" -ForegroundColor Cyan
Write-Host "  - Lister: cloudflared tunnel list" -ForegroundColor Cyan
Write-Host "  - Info: cloudflared tunnel info $TunnelName" -ForegroundColor Cyan
Write-Host "  - Supprimer: cloudflared tunnel delete $TunnelName" -ForegroundColor Cyan
Write-Host ""














