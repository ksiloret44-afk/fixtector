# Script d'installation Apache pour Windows
# Ce script installe et configure Apache comme reverse proxy pour FixTector

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Apache pour FixTector  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERREUR] Ce script nécessite des privilèges administrateur!" -ForegroundColor Red
    Write-Host "Relancez PowerShell en tant qu'administrateur." -ForegroundColor Yellow
    exit 1
}

# Vérifier si Apache est déjà installé
$apachePath = "C:\Apache24"
$xamppPath = "C:\xampp"
$apacheInstalled = $false

if (Test-Path "$apachePath\bin\httpd.exe") {
    Write-Host "[INFO] Apache trouvé dans: $apachePath" -ForegroundColor Green
    $apacheInstalled = $true
    $apacheBin = "$apachePath\bin\httpd.exe"
    $apacheConf = "$apachePath\conf\httpd.conf"
    $apacheExtra = "$apachePath\conf\extra"
} elseif (Test-Path "$xamppPath\apache\bin\httpd.exe") {
    Write-Host "[INFO] Apache trouvé dans XAMPP: $xamppPath" -ForegroundColor Green
    $apacheInstalled = $true
    $apacheBin = "$xamppPath\apache\bin\httpd.exe"
    $apacheConf = "$xamppPath\apache\conf\httpd.conf"
    $apacheExtra = "$xamppPath\apache\conf\extra"
} else {
    Write-Host "[INFO] Apache non trouvé. Installation recommandée:" -ForegroundColor Yellow
    Write-Host "  1. XAMPP (facile): https://www.apachefriends.org/" -ForegroundColor White
    Write-Host "  2. Apache Lounge (avancé): https://www.apachelounge.com/download/" -ForegroundColor White
    Write-Host ""
    $install = Read-Host "Voulez-vous continuer avec la configuration uniquement? (O/N)"
    if ($install -ne "O" -and $install -ne "o") {
        exit 0
    }
}

if ($apacheInstalled) {
    Write-Host ""
    Write-Host "[INFO] Configuration d'Apache..." -ForegroundColor Cyan
    
    # Vérifier les modules nécessaires
    $httpdConf = Get-Content $apacheConf -Raw
    
    $modules = @(
        "proxy_module",
        "proxy_http_module",
        "proxy_wstunnel_module",
        "rewrite_module",
        "headers_module",
        "deflate_module",
        "ssl_module"
    )
    
    Write-Host "[INFO] Vérification des modules..." -ForegroundColor Cyan
    foreach ($module in $modules) {
        if ($httpdConf -match "LoadModule $module") {
            Write-Host "  ✓ $module activé" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $module non activé" -ForegroundColor Red
            Write-Host "    Ajoutez cette ligne dans $apacheConf :" -ForegroundColor Yellow
            Write-Host "    LoadModule ${module}_module modules/mod_$($module.Replace('_module','')).so" -ForegroundColor White
        }
    }
    
    # Copier le fichier de configuration
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $configFile = Join-Path $scriptDir "fixtector.conf"
    
    if (Test-Path $configFile) {
        $targetConfig = Join-Path $apacheExtra "fixtector.conf"
        Copy-Item $configFile $targetConfig -Force
        Write-Host "[OK] Configuration copiée vers: $targetConfig" -ForegroundColor Green
        
        # Ajouter Include dans httpd.conf si pas déjà présent
        if ($httpdConf -notmatch "Include.*fixtector.conf") {
            Write-Host "[INFO] Ajout de l'include dans httpd.conf..." -ForegroundColor Cyan
            Add-Content $apacheConf "`n# Configuration FixTector`nInclude conf/extra/fixtector.conf"
            Write-Host "[OK] Include ajouté" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Include déjà présent dans httpd.conf" -ForegroundColor Green
        }
    } else {
        Write-Host "[ERREUR] Fichier de configuration non trouvé: $configFile" -ForegroundColor Red
    }
    
    # Créer le répertoire SSL
    $sslDir = Join-Path (Split-Path $apacheConf -Parent) "ssl"
    if (-not (Test-Path $sslDir)) {
        New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
        Write-Host "[OK] Répertoire SSL créé: $sslDir" -ForegroundColor Green
    }
    
    # Tester la configuration
    Write-Host ""
    Write-Host "[INFO] Test de la configuration Apache..." -ForegroundColor Cyan
    $testResult = & $apacheBin -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Configuration Apache valide!" -ForegroundColor Green
        Write-Host $testResult -ForegroundColor White
    } else {
        Write-Host "[ERREUR] Configuration Apache invalide!" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Configuration terminée!              " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Activez les modules nécessaires dans $apacheConf" -ForegroundColor White
    Write-Host "2. Redémarrez Apache:" -ForegroundColor White
    Write-Host "   $apacheBin -k restart" -ForegroundColor Cyan
    Write-Host "3. Vérifiez que Node.js tourne sur le port 3001" -ForegroundColor White
    Write-Host "4. Accédez à http://localhost" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[INFO] Installez Apache puis relancez ce script." -ForegroundColor Yellow
}















