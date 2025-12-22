# Script d'installation des prérequis pour Windows
# Installe automatiquement Node.js et Git si nécessaire
# Doit être exécuté en tant qu'administrateur

# Vérifier si le script est exécuté en tant qu'administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] Ce script doit être exécuté en tant qu'administrateur" -ForegroundColor Red
    Write-Host "[INFO] Clic droit sur PowerShell > Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Installation des prérequis Windows" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier si winget est disponible
function Test-Winget {
    try {
        $null = winget --version
        return $true
    } catch {
        return $false
    }
}

# Fonction pour installer via winget
function Install-WithWinget {
    param(
        [string]$PackageId,
        [string]$PackageName
    )
    
    Write-Host "[INFO] Installation de $PackageName via winget..." -ForegroundColor Yellow
    try {
        winget install $PackageId --silent --accept-package-agreements --accept-source-agreements
        Write-Host "[SUCCESS] $PackageName installé avec succès" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[WARNING] Échec de l'installation via winget: $_" -ForegroundColor Yellow
        return $false
    }
}

# Fonction pour installer Node.js manuellement
function Install-NodeJS-Manual {
    Write-Host "[INFO] Téléchargement de Node.js LTS depuis nodejs.org..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
    
    try {
        Write-Host "[INFO] Téléchargement en cours (environ 30 Mo)..." -ForegroundColor Yellow
        $ProgressPreference = 'Continue'
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        
        Write-Host "[INFO] Installation de Node.js..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait -NoNewWindow
        
        Start-Sleep -Seconds 5
        
        # Rafraîchir le PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Remove-Item $nodeInstaller -ErrorAction SilentlyContinue
        
        Write-Host "[SUCCESS] Node.js installé avec succès" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[ERROR] Échec de l'installation: $_" -ForegroundColor Red
        return $false
    }
}

# Fonction pour installer Git manuellement
function Install-Git-Manual {
    Write-Host "[INFO] Téléchargement de Git depuis git-scm.com..." -ForegroundColor Yellow
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstaller = "$env:TEMP\git-installer.exe"
    
    try {
        Write-Host "[INFO] Téléchargement en cours (environ 50 Mo)..." -ForegroundColor Yellow
        $ProgressPreference = 'Continue'
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
        
        Write-Host "[INFO] Installation de Git..." -ForegroundColor Yellow
        Write-Host "[INFO] L'installation va s'ouvrir dans une fenêtre..." -ForegroundColor Yellow
        Start-Process $gitInstaller -ArgumentList "/VERYSILENT /NORESTART" -Wait
        
        Start-Sleep -Seconds 5
        
        # Rafraîchir le PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Remove-Item $gitInstaller -ErrorAction SilentlyContinue
        
        Write-Host "[SUCCESS] Git installé avec succès" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[ERROR] Échec de l'installation: $_" -ForegroundColor Red
        return $false
    }
}

# Vérifier et installer Node.js
Write-Host "[INFO] Vérification de Node.js..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[SUCCESS] Node.js déjà installé: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "[INFO] Node.js n'est pas installé. Installation en cours..." -ForegroundColor Yellow
    
    $installed = $false
    if (Test-Winget) {
        $installed = Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js"
    }
    
    if (-not $installed) {
        $installed = Install-NodeJS-Manual
    }
    
    if (-not $installed) {
        Write-Host "[ERROR] Impossible d'installer Node.js automatiquement" -ForegroundColor Red
        Write-Host "[INFO] Veuillez installer Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Vérifier à nouveau après installation
    Start-Sleep -Seconds 3
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "[SUCCESS] Node.js installé: $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Node.js installé mais pas encore disponible dans le PATH" -ForegroundColor Yellow
            Write-Host "[INFO] Redémarrez PowerShell pour que Node.js soit disponible" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARNING] Node.js installé mais pas encore disponible dans le PATH" -ForegroundColor Yellow
        Write-Host "[INFO] Redémarrez PowerShell pour que Node.js soit disponible" -ForegroundColor Yellow
    }
}

# Vérifier npm (inclus avec Node.js)
Write-Host ""
Write-Host "[INFO] Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "[SUCCESS] npm disponible: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] npm n'est pas encore disponible. Redémarrez PowerShell." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] npm n'est pas encore disponible. Redémarrez PowerShell." -ForegroundColor Yellow
}

# Vérifier et installer Git (optionnel mais recommandé)
Write-Host ""
Write-Host "[INFO] Vérification de Git..." -ForegroundColor Yellow
$gitInstalled = $false
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "[SUCCESS] Git déjà installé: $gitVersion" -ForegroundColor Green
        $gitInstalled = $true
    }
} catch {
    $gitInstalled = $false
}

if (-not $gitInstalled) {
    Write-Host "[INFO] Git n'est pas installé (optionnel mais recommandé)" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous installer Git maintenant ? (O/N)"
    if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
        $installed = $false
        if (Test-Winget) {
            $installed = Install-WithWinget "Git.Git" "Git"
        }
        
        if (-not $installed) {
            $installed = Install-Git-Manual
        }
        
        if (-not $installed) {
            Write-Host "[WARNING] Impossible d'installer Git automatiquement" -ForegroundColor Yellow
            Write-Host "[INFO] Vous pouvez l'installer manuellement depuis https://git-scm.com/download/win" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[INFO] Git ignoré. Vous pouvez l'installer plus tard si nécessaire." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Installation des prérequis terminée !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important:" -ForegroundColor Yellow
Write-Host "  Si Node.js ou Git viennent d'être installés," -ForegroundColor White
Write-Host "  vous devez REDÉMARRER PowerShell pour que" -ForegroundColor White
Write-Host "  les commandes soient disponibles." -ForegroundColor White
Write-Host ""
Write-Host "Ensuite, exécutez:" -ForegroundColor Yellow
Write-Host "  .\install-windows.ps1" -ForegroundColor Cyan
Write-Host ""

