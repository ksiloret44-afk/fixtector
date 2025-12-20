# Script pour créer la release GitHub v1.1.2
# Utilise l'API GitHub pour créer automatiquement la release

$repo = "ksiloret44-afk/fixtector"
$tag = "v1.1.2"
$title = "Version 1.1.2 - Système de vérification des mises à jour"

# Lire les notes de version
$notesPath = "RELEASE_v1.1.2_COMPLETE.md"
if (Test-Path $notesPath) {
    $notes = Get-Content $notesPath -Raw -Encoding UTF8
} else {
    Write-Host "❌ Fichier $notesPath non trouvé" -ForegroundColor Red
    exit 1
}

# Créer le JSON pour l'API GitHub
$releaseData = @{
    tag_name = $tag
    name = $title
    body = $notes
    draft = $false
    prerelease = $false
}

$jsonBody = $releaseData | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création de la release GitHub v1.1.2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si un token GitHub est disponible
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️  Aucun token GitHub trouvé dans les variables d'environnement" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour créer la release automatiquement, vous devez:" -ForegroundColor Yellow
    Write-Host "  1. Créer un token GitHub avec les permissions 'repo'" -ForegroundColor White
    Write-Host "     https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "  2. Définir la variable d'environnement:" -ForegroundColor White
    Write-Host "     `$env:GITHUB_TOKEN = 'votre-token-ici'" -ForegroundColor Cyan
    Write-Host "  3. Relancer ce script" -ForegroundColor White
    Write-Host ""
    Write-Host "OU créer la release manuellement:" -ForegroundColor Green
    Write-Host "  1. Allez sur: https://github.com/$repo/releases/new" -ForegroundColor White
    Write-Host "  2. Sélectionnez le tag: $tag" -ForegroundColor White
    Write-Host "  3. Titre: $title" -ForegroundColor White
    Write-Host "  4. Copiez le contenu de $notesPath dans les notes" -ForegroundColor White
    Write-Host ""
    Write-Host "Le fichier JSON a été sauvegardé dans release-v1.1.2.json" -ForegroundColor Gray
    $jsonBody | Out-File -FilePath "release-v1.1.2.json" -Encoding UTF8
    exit 0
}

Write-Host "✅ Token GitHub trouvé, création de la release..." -ForegroundColor Green
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $uri = "https://api.github.com/repos/$repo/releases"
    
    Write-Host "Envoi de la requête à l'API GitHub..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $uri `
        -Method Post `
        -Headers $headers `
        -Body $jsonBody `
        -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Release créée avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL de la release: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "Tag: $($response.tag_name)" -ForegroundColor Gray
    Write-Host "ID: $($response.id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Vous pouvez maintenant voir la release sur GitHub !" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création de la release:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails) {
            Write-Host "Détails: $($errorDetails.message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  - Que le token a les permissions 'repo'" -ForegroundColor White
    Write-Host "  - Que le tag $tag existe déjà sur GitHub" -ForegroundColor White
    Write-Host "  - Que vous avez les droits sur le repository" -ForegroundColor White
    Write-Host ""
    Write-Host "Vous pouvez créer la release manuellement via l'interface GitHub." -ForegroundColor Yellow
}

