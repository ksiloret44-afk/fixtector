# Script de configuration initiale pour le déploiement mobile sur le serveur
# À exécuter une seule fois pour configurer l'environnement

Write-Host "=== Configuration du serveur pour l'application mobile ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json introuvable. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Créer les répertoires nécessaires
Write-Host "📁 Création des répertoires..." -ForegroundColor Yellow

$directories = @(
    "public\mobile",
    "mobile-build"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Répertoire créé: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Répertoire existe déjà: $dir" -ForegroundColor Gray
    }
}

# Vérifier Android Studio / Gradle
Write-Host "`n🔍 Vérification de l'environnement Android..." -ForegroundColor Yellow

$androidStudioPath = $null
$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:ProgramFiles\Android\Android Studio",
    "$env:ProgramFiles(x86)\Android\Android Studio"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $androidStudioPath = $path
        Write-Host "✅ Android SDK trouvé: $path" -ForegroundColor Green
        break
    }
}

if (-not $androidStudioPath) {
    Write-Host "⚠️  Android Studio/SDK non détecté automatiquement" -ForegroundColor Yellow
    Write-Host "💡 Si Android Studio est installé, le script fonctionnera quand même si Gradle est configuré" -ForegroundColor Gray
}

# Vérifier Java (nécessaire pour Gradle)
Write-Host "`n☕ Vérification de Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✅ Java trouvé: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Java non trouvé. Gradle peut nécessiter Java." -ForegroundColor Yellow
    Write-Host "💡 Installez Java JDK 11 ou supérieur si vous rencontrez des problèmes" -ForegroundColor Gray
}

# Créer un fichier .gitignore pour mobile-build si nécessaire
Write-Host "`n📝 Configuration de .gitignore..." -ForegroundColor Yellow
$gitignorePath = ".gitignore"
$gitignoreContent = Get-Content $gitignorePath -ErrorAction SilentlyContinue

if ($gitignoreContent -notcontains "mobile-build/") {
    Add-Content -Path $gitignorePath -Value "`nmobile-build/"
    Write-Host "✅ mobile-build/ ajouté à .gitignore" -ForegroundColor Green
} else {
    Write-Host "✅ mobile-build/ déjà dans .gitignore" -ForegroundColor Gray
}

if ($gitignoreContent -notcontains "android/") {
    Add-Content -Path $gitignorePath -Value "android/"
    Write-Host "✅ android/ ajouté à .gitignore" -ForegroundColor Green
} else {
    Write-Host "✅ android/ déjà dans .gitignore" -ForegroundColor Gray
}

Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Exécutez: npm run mobile:deploy" -ForegroundColor Yellow
Write-Host "   2. L'APK sera généré dans mobile-build/" -ForegroundColor Yellow
Write-Host "   3. Copiez le contenu de mobile-build/ vers public/mobile/ sur votre serveur" -ForegroundColor Yellow
Write-Host "   4. Accédez à https://votre-domaine.com/mobile/ pour télécharger l'APK" -ForegroundColor Yellow

