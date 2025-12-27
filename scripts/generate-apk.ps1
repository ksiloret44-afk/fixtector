# Script PowerShell pour générer l'APK Android
# Nécessite: Node.js, npm, Android Studio (SDK)

Write-Host "=== Génération de l'APK FixTector ===" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json introuvable. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Vérifier les dépendances
Write-Host "`n📦 Vérification des dépendances..." -ForegroundColor Yellow

# Vérifier Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé!" -ForegroundColor Red
    exit 1
}

# Vérifier npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm n'est pas installé!" -ForegroundColor Red
    exit 1
}

# Vérifier Capacitor CLI
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx n'est pas disponible!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dépendances vérifiées" -ForegroundColor Green

# Étape 1: Build Next.js pour mobile (export statique)
Write-Host "`n🔨 Étape 1: Build de l'application Next.js pour mobile..." -ForegroundColor Yellow
$env:MOBILE_BUILD = "true"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build Next.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build Next.js terminé" -ForegroundColor Green

# Étape 2: Export statique (si nécessaire)
Write-Host "`n📤 Étape 2: Export statique..." -ForegroundColor Yellow
# Next.js export sera fait automatiquement si configuré dans next.config.js

# Étape 3: Installer Capacitor (si pas déjà installé)
Write-Host "`n📱 Étape 3: Installation de Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@capacitor/cli")) {
    npm install @capacitor/cli @capacitor/core @capacitor/android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de Capacitor" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Capacitor installé" -ForegroundColor Green

# Étape 4: Initialiser Capacitor (si pas déjà fait)
if (-not (Test-Path "android")) {
    Write-Host "`n🔧 Étape 4: Initialisation de Capacitor Android..." -ForegroundColor Yellow
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'initialisation de Capacitor" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Capacitor Android initialisé" -ForegroundColor Green
} else {
    Write-Host "`n✅ Capacitor Android déjà initialisé" -ForegroundColor Green
}

# Étape 5: Synchroniser avec Capacitor
Write-Host "`n🔄 Étape 5: Synchronisation avec Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la synchronisation" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Synchronisation terminée" -ForegroundColor Green

# Étape 6: Ouvrir Android Studio ou générer l'APK
Write-Host "`n📦 Étape 6: Génération de l'APK..." -ForegroundColor Yellow
Write-Host "`n💡 Options disponibles:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir Android Studio pour générer l'APK manuellement"
Write-Host "   2. Utiliser Gradle en ligne de commande (nécessite Android SDK)"
Write-Host ""

$choice = Read-Host "Choisissez une option (1 ou 2)"

if ($choice -eq "1") {
    Write-Host "`n🚀 Ouverture d'Android Studio..." -ForegroundColor Yellow
    npx cap open android
    Write-Host "`n✅ Android Studio ouvert. Générez l'APK depuis: Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor Green
} elseif ($choice -eq "2") {
    Write-Host "`n🔨 Génération de l'APK avec Gradle..." -ForegroundColor Yellow
    if (-not (Test-Path "android\gradlew.bat")) {
        Write-Host "❌ Gradle wrapper introuvable. Utilisez l'option 1." -ForegroundColor Red
        exit 1
    }
    Set-Location android
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ APK généré avec succès!" -ForegroundColor Green
        Write-Host "📦 Emplacement: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erreur lors de la génération de l'APK" -ForegroundColor Red
    }
    Set-Location ..
} else {
    Write-Host "❌ Option invalide" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Processus terminé!" -ForegroundColor Green
Write-Host "`n📝 Note: Pour signer l'APK pour la production, configurez les variables d'environnement:" -ForegroundColor Yellow
Write-Host "   - ANDROID_KEYSTORE_PATH" -ForegroundColor Gray
Write-Host "   - ANDROID_KEYSTORE_PASSWORD" -ForegroundColor Gray
Write-Host "   - ANDROID_KEYSTORE_ALIAS" -ForegroundColor Gray
Write-Host "   - ANDROID_KEYSTORE_ALIAS_PASSWORD" -ForegroundColor Gray

