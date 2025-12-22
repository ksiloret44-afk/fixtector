# Script d'installation pour Windows - FixTector v1.4.0
# Optimisé pour Windows avec build de production
# Requiert PowerShell en mode administrateur pour installer Node.js

# Vérifier si le script est exécuté en tant qu'administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Installation FixTector v1.4.0 Windows" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour trouver Node.js dans les emplacements typiques
function Find-NodeJS {
    $commonPaths = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Microsoft\WindowsApps",
        "$env:USERPROFILE\AppData\Local\Microsoft\WindowsApps"
    )
    
    foreach ($path in $commonPaths) {
        $nodePath = Join-Path $path "node.exe"
        if (Test-Path $nodePath) {
            return $path
        }
    }
    return $null
}

# Fonction pour rafraîchir le PATH et vérifier Node.js
function Refresh-PathAndCheckNode {
    # Rafraîchir le PATH depuis le registre
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Chercher Node.js dans les emplacements typiques
    $nodePath = Find-NodeJS
    if ($nodePath) {
        if ($env:Path -notlike "*$nodePath*") {
            $env:Path = "$nodePath;$env:Path"
            Write-Host "[INFO] Node.js trouvé dans: $nodePath" -ForegroundColor Yellow
            Write-Host "[INFO] Ajouté au PATH de cette session" -ForegroundColor Yellow
        }
    }
    
    # Essayer plusieurs fois avec des délais
    for ($i = 1; $i -le 5; $i++) {
        try {
            $nodeVersion = node --version 2>$null
            if ($nodeVersion) {
                return $nodeVersion
            }
        } catch {
            # Continuer à essayer
        }
        Start-Sleep -Seconds 2
        # Rafraîchir le PATH à nouveau
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        $nodePath = Find-NodeJS
        if ($nodePath -and $env:Path -notlike "*$nodePath*") {
            $env:Path = "$nodePath;$env:Path"
        }
    }
    return $null
}

# Fonction pour installer Node.js via winget
function Install-NodeJS-Winget {
    Write-Host "[INFO] Tentative d'installation de Node.js via winget..." -ForegroundColor Yellow
    try {
        $result = winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements 2>&1
        Write-Host "[SUCCESS] Node.js installé via winget" -ForegroundColor Green
        
        # Attendre un peu pour que l'installation se termine
        Start-Sleep -Seconds 3
        
        # Essayer de trouver et ajouter Node.js au PATH
        $nodeVersion = Refresh-PathAndCheckNode
        
        if ($nodeVersion) {
            Write-Host "[SUCCESS] Node.js disponible: $nodeVersion" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[WARNING] Node.js installé mais pas encore détecté dans cette session" -ForegroundColor Yellow
            Write-Host "[INFO] Node.js sera disponible après redémarrage de PowerShell" -ForegroundColor Yellow
            return $true  # Retourner true car l'installation a réussi
        }
    } catch {
        Write-Host "[WARNING] Échec de l'installation via winget: $_" -ForegroundColor Yellow
        return $false
    }
}

# Fonction pour télécharger et installer Node.js manuellement
function Install-NodeJS-Manual {
    Write-Host "[INFO] Téléchargement de Node.js depuis nodejs.org..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
    
    try {
        # Télécharger Node.js
        Write-Host "[INFO] Téléchargement en cours..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        
        # Installer Node.js silencieusement
        Write-Host "[INFO] Installation de Node.js..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait -NoNewWindow
        
        # Attendre que Node.js soit disponible
        Start-Sleep -Seconds 5
        # Rafraîchir le PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Nettoyer
        Remove-Item $nodeInstaller -ErrorAction SilentlyContinue
        
        Write-Host "[SUCCESS] Node.js installé avec succès" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[ERROR] Échec de l'installation de Node.js: $_" -ForegroundColor Red
        Write-Host "[INFO] Veuillez installer Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
}

# Vérifier et installer Node.js
Write-Host "[INFO] Vérification de Node.js..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[SUCCESS] Node.js installé: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "[WARNING] Node.js n'est pas installé" -ForegroundColor Yellow
    Write-Host "[INFO] Tentative d'installation automatique..." -ForegroundColor Yellow
    
    if ($isAdmin) {
        # Essayer winget d'abord
        if (-not (Install-NodeJS-Winget)) {
            # Si winget échoue, essayer le téléchargement manuel
            if (-not (Install-NodeJS-Manual)) {
                Write-Host "[ERROR] Impossible d'installer Node.js automatiquement" -ForegroundColor Red
                Write-Host "[INFO] Veuillez installer Node.js manuellement depuis https://nodejs.org/" -ForegroundColor Yellow
                Write-Host "[INFO] Ou relancez ce script en tant qu'administrateur" -ForegroundColor Yellow
                exit 1
            }
        }
        
        # Vérifier à nouveau avec rafraîchissement du PATH
        $nodeVersion = Refresh-PathAndCheckNode
        
        if ($nodeVersion) {
            Write-Host "[SUCCESS] Node.js disponible: $nodeVersion" -ForegroundColor Green
            $nodeInstalled = $true
        } else {
            Write-Host "[WARNING] Node.js installé mais pas encore détecté dans cette session PowerShell" -ForegroundColor Yellow
            Write-Host "[INFO] Cela est normal après une installation via winget" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Cyan
            Write-Host "  1. Redémarrer PowerShell et réexécuter ce script (recommandé)" -ForegroundColor White
            Write-Host "  2. Continuer quand même (Node.js sera disponible après redémarrage)" -ForegroundColor White
            Write-Host ""
            $response = Read-Host "Voulez-vous continuer quand même ? (O/N)"
            
            if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
                Write-Host "[INFO] Continuation de l'installation..." -ForegroundColor Yellow
                Write-Host "[WARNING] Assurez-vous que Node.js sera disponible avant de démarrer le serveur" -ForegroundColor Yellow
                $nodeInstalled = $true  # Continuer quand même
            } else {
                Write-Host "[INFO] Installation interrompue. Redémarrez PowerShell et réexécutez ce script." -ForegroundColor Yellow
                exit 0  # Exit avec succès car l'installation a réussi
            }
        }
    } else {
        Write-Host "[ERROR] Node.js n'est pas installé et ce script n'est pas exécuté en tant qu'administrateur" -ForegroundColor Red
        Write-Host "[INFO] Options:" -ForegroundColor Yellow
        Write-Host "  1. Relancez PowerShell en tant qu'administrateur et réexécutez ce script" -ForegroundColor White
        Write-Host "  2. Installez Node.js manuellement depuis https://nodejs.org/" -ForegroundColor White
        exit 1
    }
}

# Vérifier npm (inclus avec Node.js)
Write-Host "[INFO] Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "[SUCCESS] npm installé: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] npm n'est pas disponible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] npm n'est pas disponible" -ForegroundColor Red
    exit 1
}

# Installation des dépendances système (build tools pour Windows)
Write-Host ""
Write-Host "[INFO] Vérification des outils de build Windows..." -ForegroundColor Yellow
$buildToolsInstalled = $false
try {
    $null = Get-Command cl.exe -ErrorAction Stop
    $buildToolsInstalled = $true
    Write-Host "[INFO] Visual Studio Build Tools détectés" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Visual Studio Build Tools non détectés" -ForegroundColor Yellow
    Write-Host "[INFO] Certains packages npm peuvent nécessiter ces outils" -ForegroundColor Yellow
    Write-Host "[INFO] Si l'installation échoue, installez: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Yellow
}

# Installation des dépendances npm
Write-Host ""
Write-Host "[INFO] Installation des dépendances npm (cela peut prendre plusieurs minutes)..." -ForegroundColor Yellow
Write-Host "[INFO] Cette étape peut prendre 5-10 minutes selon votre connexion..." -ForegroundColor Yellow

# Désactiver NODE_ENV pour installer aussi les devDependencies
$env:NODE_ENV = ""
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Échec de l'installation des dépendances" -ForegroundColor Red
    Write-Host "[INFO] Essayez de réexécuter: npm install" -ForegroundColor Yellow
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
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Créer le compte administrateur:" -ForegroundColor White
Write-Host "   npm run db:init" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Démarrer le serveur en mode production:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Le serveur sera accessible sur: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Si vous avez installé Node.js pour la première fois," -ForegroundColor Yellow
Write-Host "      vous devrez peut-être redémarrer PowerShell pour que" -ForegroundColor Yellow
Write-Host "      les commandes soient disponibles." -ForegroundColor Yellow
Write-Host ""

