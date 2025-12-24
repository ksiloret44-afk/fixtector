# Script pour ajouter la configuration SMTP au fichier .env.local

$envFile = ".env.local"
$backupFile = ".env.local.backup"

Write-Host "=== CONFIGURATION SMTP ===" -ForegroundColor Cyan
Write-Host ""

# Faire une sauvegarde
if (Test-Path $envFile) {
    Copy-Item $envFile $backupFile -Force
    Write-Host "[OK] Sauvegarde créée: $backupFile" -ForegroundColor Green
}

# Vérifier si les variables SMTP existent déjà
$content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }
$hasSMTP = $content -match "SMTP_HOST"

if ($hasSMTP) {
    Write-Host "[INFO] Variables SMTP déjà présentes dans .env.local" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Variables SMTP actuelles:" -ForegroundColor Cyan
    Get-Content $envFile | Select-String -Pattern "SMTP" | ForEach-Object {
        $line = $_.Line
        if ($line -match "SMTP_PASSWORD") {
            $line = $line -replace "=.*", "=***"
        }
        Write-Host "  $line"
    }
    Write-Host ""
    $update = Read-Host "Voulez-vous mettre à jour la configuration SMTP? (O/N)"
    if ($update -ne "O" -and $update -ne "o") {
        Write-Host "Annulé." -ForegroundColor Yellow
        exit 0
    }
    
    # Supprimer les anciennes variables SMTP
    $newContent = Get-Content $envFile | Where-Object { $_ -notmatch "^SMTP_" }
    $newContent | Set-Content $envFile
    Write-Host "[OK] Anciennes variables SMTP supprimées" -ForegroundColor Green
}

Write-Host ""
Write-Host "Entrez vos paramètres SMTP:" -ForegroundColor Cyan
Write-Host ""

# Demander les paramètres
$smtpHost = Read-Host "SMTP_HOST (ex: smtp.gmail.com)"
$smtpPort = Read-Host "SMTP_PORT (défaut: 587)"
if ([string]::IsNullOrWhiteSpace($smtpPort)) {
    $smtpPort = "587"
}
$smtpUser = Read-Host "SMTP_USER (votre adresse email)"
$smtpPassword = Read-Host "SMTP_PASSWORD (mot de passe ou mot de passe d'application)" -AsSecureString
$smtpPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword)
)
$smtpFrom = Read-Host "SMTP_FROM (optionnel, défaut: SMTP_USER)"
if ([string]::IsNullOrWhiteSpace($smtpFrom)) {
    $smtpFrom = $smtpUser
}

# Ajouter les variables au fichier
Write-Host ""
Write-Host "Ajout des variables SMTP au fichier .env.local..." -ForegroundColor Yellow

$smtpConfig = @"

# Configuration SMTP pour l'envoi d'emails (réinitialisation de mot de passe, etc.)
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_USER=$smtpUser
SMTP_PASSWORD=$smtpPasswordPlain
SMTP_FROM=$smtpFrom
"@

Add-Content -Path $envFile -Value $smtpConfig

Write-Host "[OK] Configuration SMTP ajoutée!" -ForegroundColor Green
Write-Host ""
Write-Host "Variables ajoutées:" -ForegroundColor Cyan
Write-Host "  SMTP_HOST=$smtpHost"
Write-Host "  SMTP_PORT=$smtpPort"
Write-Host "  SMTP_USER=$smtpUser"
Write-Host "  SMTP_PASSWORD=***"
Write-Host "  SMTP_FROM=$smtpFrom"
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  1. Redémarrez le serveur pour que les changements prennent effet"
Write-Host "  2. Pour Gmail, utilisez un 'Mot de passe d'application' (pas votre mot de passe normal)"
Write-Host "  3. Testez la configuration avec: npx tsx scripts/test-smtp.ts"
Write-Host ""










