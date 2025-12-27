# Script de déploiement de l'application mobile sur le serveur
# Ce script génère l'APK et le rend disponible pour téléchargement

param(
    [string]$ServerUrl = "https://weqeep.com",
    [string]$OutputDir = ".\mobile-build",
    [switch]$SkipBuild = $false
)

Write-Host "=== Déploiement de l'application mobile FixTector ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json introuvable. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Créer le répertoire de sortie
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "✅ Répertoire de sortie créé: $OutputDir" -ForegroundColor Green
}

# Étape 1: Installer les dépendances Capacitor si nécessaire
Write-Host "`n📦 Étape 1: Vérification des dépendances Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@capacitor/cli")) {
    Write-Host "   Installation de Capacitor..." -ForegroundColor Gray
    npm install @capacitor/cli @capacitor/core @capacitor/android --save-dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de Capacitor" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Capacitor installé" -ForegroundColor Green
} else {
    Write-Host "✅ Capacitor déjà installé" -ForegroundColor Green
}

# Étape 2: Mettre à jour la configuration Capacitor avec l'URL du serveur
Write-Host "`n🔧 Étape 2: Configuration de l'URL du serveur..." -ForegroundColor Yellow
$capacitorConfig = Get-Content "capacitor.config.ts" -Raw
$capacitorConfig = $capacitorConfig -replace "url: process\.env\.CAPACITOR_SERVER_URL \|\| '[^']*'", "url: '$ServerUrl'"
Set-Content -Path "capacitor.config.ts" -Value $capacitorConfig -NoNewline
Write-Host "✅ URL du serveur configurée: $ServerUrl" -ForegroundColor Green

# Étape 3: Build de l'application Next.js pour mobile
if (-not $SkipBuild) {
    Write-Host "`n🔨 Étape 3: Build de l'application Next.js pour mobile..." -ForegroundColor Yellow
    $env:MOBILE_BUILD = "true"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du build Next.js" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build Next.js terminé" -ForegroundColor Green
} else {
    Write-Host "`n⏭️  Étape 3: Build ignoré (--SkipBuild activé)" -ForegroundColor Yellow
}

# Étape 4: Initialiser Capacitor Android si nécessaire
Write-Host "`n📱 Étape 4: Initialisation de Capacitor Android..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    Write-Host "   Initialisation de Capacitor Android..." -ForegroundColor Gray
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'initialisation de Capacitor" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Capacitor Android initialisé" -ForegroundColor Green
} else {
    Write-Host "✅ Capacitor Android déjà initialisé" -ForegroundColor Green
}

# Étape 5: Synchroniser avec Capacitor
Write-Host "`n🔄 Étape 5: Synchronisation avec Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la synchronisation" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Synchronisation terminée" -ForegroundColor Green

# Étape 6: Générer l'APK avec Gradle
Write-Host "`n📦 Étape 6: Génération de l'APK avec Gradle..." -ForegroundColor Yellow
if (-not (Test-Path "android\gradlew.bat")) {
    Write-Host "❌ Gradle wrapper introuvable. Android Studio n'est peut-être pas configuré." -ForegroundColor Red
    Write-Host "💡 Solution: Exécutez 'npm run mobile:open' pour ouvrir Android Studio et générer l'APK manuellement." -ForegroundColor Yellow
    exit 1
}

Set-Location android
Write-Host "   Exécution de Gradle..." -ForegroundColor Gray
.\gradlew.bat assembleDebug
$gradleExitCode = $LASTEXITCODE
Set-Location ..

if ($gradleExitCode -eq 0) {
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "✅ APK généré avec succès!" -ForegroundColor Green
        
        # Étape 7: Copier l'APK vers le répertoire de sortie
        Write-Host "`n📋 Étape 7: Copie de l'APK..." -ForegroundColor Yellow
        $apkName = "FixTector-$(Get-Date -Format 'yyyyMMdd-HHmmss').apk"
        $outputApk = Join-Path $OutputDir $apkName
        Copy-Item $apkPath $outputApk -Force
        Write-Host "✅ APK copié vers: $outputApk" -ForegroundColor Green
        
        # Afficher les informations
        $apkSize = (Get-Item $outputApk).Length / 1MB
        Write-Host "`n📊 Informations de l'APK:" -ForegroundColor Cyan
        Write-Host "   Nom: $apkName" -ForegroundColor Gray
        Write-Host "   Taille: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
        Write-Host "   Emplacement: $outputApk" -ForegroundColor Gray
        
        # Étape 8: Créer un fichier HTML pour téléchargement
        Write-Host "`n🌐 Étape 8: Création de la page de téléchargement..." -ForegroundColor Yellow
        $htmlContent = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Télécharger FixTector Mobile</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #4F46E5;
            margin-bottom: 10px;
            font-size: 2em;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .apk-info {
            background: #f5f5f5;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .apk-info p {
            margin: 5px 0;
            color: #333;
        }
        .download-btn {
            display: inline-block;
            background: #4F46E5;
            color: white;
            padding: 15px 40px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1em;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .download-btn:hover {
            background: #4338CA;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }
        .warning strong {
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 FixTector Mobile</h1>
        <p class="subtitle">Application Android</p>
        
        <div class="apk-info">
            <p><strong>Version:</strong> $($apkName -replace 'FixTector-|\.apk', '')</p>
            <p><strong>Taille:</strong> $([math]::Round($apkSize, 2)) MB</p>
            <p><strong>Date:</strong> $(Get-Date -Format 'dd/MM/yyyy HH:mm')</p>
        </div>
        
        <a href="/mobile/$apkName" class="download-btn" download>
            ⬇️ Télécharger l'APK
        </a>
        
        <div class="warning">
            <strong>⚠️ Installation</strong>
            <p>Sur Android, autorisez l'installation depuis des sources inconnues dans les paramètres de sécurité.</p>
        </div>
    </div>
</body>
</html>
"@
        $htmlPath = Join-Path $OutputDir "index.html"
        Set-Content -Path $htmlPath -Value $htmlContent
        Write-Host "✅ Page de téléchargement créée: $htmlPath" -ForegroundColor Green
        
        Write-Host "`n✅ Déploiement terminé avec succès!" -ForegroundColor Green
        Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "   1. Copiez le contenu de '$OutputDir' vers votre serveur web (dossier public/mobile/)" -ForegroundColor Yellow
        Write-Host "   2. Accédez à: $ServerUrl/mobile/ pour télécharger l'APK" -ForegroundColor Yellow
        Write-Host "   3. Partagez le lien avec vos utilisateurs" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ APK introuvable après la génération" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Erreur lors de la génération de l'APK avec Gradle" -ForegroundColor Red
    Write-Host "💡 Essayez d'ouvrir Android Studio avec 'npm run mobile:open' et générez l'APK manuellement" -ForegroundColor Yellow
    exit 1
}

