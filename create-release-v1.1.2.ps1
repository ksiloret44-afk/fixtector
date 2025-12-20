# Script pour créer la release GitHub v1.1.2
# Nécessite un token GitHub avec les permissions 'repo'

$repo = "ksiloret44-afk/fixtector"
$tag = "v1.1.2"
$title = "Version 1.1.2 - Système de vérification des mises à jour"

# Lire les notes de version
$notes = Get-Content "RELEASE_NOTES_v1.1.2.md" -Raw -Encoding UTF8

# Créer le JSON pour l'API
$releaseData = @{
    tag_name = $tag
    name = $title
    body = $notes
    draft = $false
    prerelease = $false
}

$jsonBody = $releaseData | ConvertTo-Json -Depth 10

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création de la release GitHub v1.1.2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si un token GitHub est disponible
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "⚠️  Aucun token GitHub trouvé dans les variables d'environnement" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour créer la release via l'API, vous avez deux options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Via l'interface GitHub (Recommandé)" -ForegroundColor Green
    Write-Host "  1. Allez sur: https://github.com/$repo/releases/new" -ForegroundColor White
    Write-Host "  2. Sélectionnez le tag: $tag" -ForegroundColor White
    Write-Host "  3. Titre: $title" -ForegroundColor White
    Write-Host "  4. Copiez le contenu de RELEASE_NOTES_v1.1.2.md dans les notes" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Via l'API avec curl" -ForegroundColor Green
    Write-Host "  curl -X POST https://api.github.com/repos/$repo/releases \" -ForegroundColor Cyan
    Write-Host "    -H \"Authorization: token YOUR_GITHUB_TOKEN\" \" -ForegroundColor Cyan
    Write-Host "    -H \"Content-Type: application/json\" \" -ForegroundColor Cyan
    Write-Host "    -d '$jsonBody'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Le fichier release-v1.1.2.json a été créé avec les données de la release." -ForegroundColor Gray
} else {
    Write-Host "Token GitHub trouvé, création de la release..." -ForegroundColor Green
    
    try {
        $headers = @{
            "Authorization" = "token $token"
            "Content-Type" = "application/json"
            "Accept" = "application/vnd.github.v3+json"
        }
        
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" `
            -Method Post `
            -Headers $headers `
            -Body $jsonBody `
            -ContentType "application/json"
        
        Write-Host "✅ Release créée avec succès !" -ForegroundColor Green
        Write-Host "URL: $($response.html_url)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Erreur lors de la création de la release:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "Utilisez l'interface GitHub ou vérifiez votre token." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Fichiers créés:" -ForegroundColor Cyan
Write-Host "  - RELEASE_NOTES_v1.1.2.md (notes de version)" -ForegroundColor Gray
Write-Host "  - release-v1.1.2.json (données JSON pour l'API)" -ForegroundColor Gray

