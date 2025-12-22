# Script PowerShell pour créer une release GitHub
# Nécessite un token GitHub avec les permissions 'repo'

$repo = "ksiloret44-afk/fixtector"
$tag = "v1.0.0"
$title = "Version 1.0.0 - FixTector"
$notesFile = "RELEASE_NOTES_v1.0.0.md"

# Lire les notes de version
$notes = Get-Content $notesFile -Raw

# Encoder en JSON
$body = $notes -replace '"', '\"' -replace "`n", '\n' -replace "`r", ''
$jsonBody = @{
    tag_name = $tag
    name = $title
    body = $notes
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

Write-Host "Création de la release GitHub..." -ForegroundColor Cyan
Write-Host "Repository: $repo" -ForegroundColor Gray
Write-Host "Tag: $tag" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour créer la release, vous pouvez:" -ForegroundColor Yellow
Write-Host "1. Aller sur https://github.com/$repo/releases/new" -ForegroundColor White
Write-Host "2. Sélectionner le tag: $tag" -ForegroundColor White
Write-Host "3. Titre: $title" -ForegroundColor White
Write-Host "4. Copier le contenu de $notesFile dans les notes" -ForegroundColor White
Write-Host ""
Write-Host "Ou utiliser l'API GitHub avec curl:" -ForegroundColor Yellow
Write-Host ""
Write-Host "curl -X POST https://api.github.com/repos/$repo/releases \`" -ForegroundColor Cyan
Write-Host "  -H `"Authorization: token YOUR_GITHUB_TOKEN`" \`" -ForegroundColor Cyan
Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor Cyan
Write-Host "  -d '$jsonBody'" -ForegroundColor Cyan

