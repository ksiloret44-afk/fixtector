# Script pour créer le fichier .env.local
$envContent = @"
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="changez-moi-en-production-changez-moi-en-production"
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline

Write-Host "✅ Fichier .env.local créé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Contenu du fichier:" -ForegroundColor Cyan
Get-Content .env.local

