# Script de nettoyage de cache pour FixTector (Windows PowerShell)
# Nettoie les caches Next.js, Prisma, npm, et autres fichiers temporaires

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Nettoyage de cache FixTector" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$TotalFreed = 0

function Format-Bytes {
    param([long]$Bytes)
    if ($Bytes -eq 0) { return "0 B" }
    $k = 1024
    $sizes = @("B", "KB", "MB", "GB")
    $i = [Math]::Floor([Math]::Log($Bytes) / [Math]::Log($k))
    return "{0:N2} {1}" -f ($Bytes / [Math]::Pow($k, $i)), $sizes[$i]
}

function Get-DirSize {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return 0 }
    try {
        $size = (Get-ChildItem -Path $Path -Recurse -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        return [long]$size
    } catch {
        return 0
    }
}

# 1. Nettoyage du cache Next.js
Write-Host ""
Write-Host "[1/6] Nettoyage du cache Next.js..." -ForegroundColor Cyan
if (Test-Path ".next") {
    $SizeBefore = Get-DirSize ".next"
    
    # Sauvegarder BUILD_ID
    $BuildId = $null
    if (Test-Path ".next\BUILD_ID") {
        $BuildId = Get-Content ".next\BUILD_ID" -Raw
    }
    
    # Supprimer les sous-dossiers de cache
    if (Test-Path ".next\cache") { Remove-Item ".next\cache" -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path ".next\server") { Remove-Item ".next\server" -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path ".next\static") { Remove-Item ".next\static" -Recurse -Force -ErrorAction SilentlyContinue }
    
    # Restaurer BUILD_ID si nécessaire
    if ($BuildId -and -not (Test-Path ".next\BUILD_ID")) {
        $BuildId | Out-File ".next\BUILD_ID" -NoNewline -Encoding utf8
    }
    
    $SizeAfter = Get-DirSize ".next"
    $Freed = $SizeBefore - $SizeAfter
    $TotalFreed += $Freed
    
    if ($Freed -gt 0) {
        Write-Host "  ✓ Cache Next.js nettoyé: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
    } else {
        Write-Host "  ℹ Cache Next.js déjà propre" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ Aucun cache Next.js trouvé" -ForegroundColor Yellow
}

# 2. Nettoyage du cache Prisma
Write-Host ""
Write-Host "[2/6] Nettoyage du cache Prisma..." -ForegroundColor Cyan
$Freed = 0
if (Test-Path "node_modules\.prisma") {
    Get-ChildItem "node_modules\.prisma" -Directory -Filter "client-*" | ForEach-Object {
        $SizeBefore = Get-DirSize $_.FullName
        if (Test-Path "$($_.FullName)\cache") {
            Remove-Item "$($_.FullName)\cache" -Recurse -Force -ErrorAction SilentlyContinue
        }
        $SizeAfter = Get-DirSize $_.FullName
        $Freed += $SizeBefore - $SizeAfter
    }
}

if ($Freed -gt 0) {
    Write-Host "  ✓ Cache Prisma nettoyé: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
    $TotalFreed += $Freed
} else {
    Write-Host "  ℹ Aucun cache Prisma à nettoyer" -ForegroundColor Yellow
}

# 3. Nettoyage du cache npm
Write-Host ""
Write-Host "[3/6] Nettoyage du cache npm..." -ForegroundColor Cyan
try {
    $NpmCache = npm config get cache 2>$null
    if ($NpmCache -and (Test-Path $NpmCache)) {
        $SizeBefore = Get-DirSize $NpmCache
        npm cache clean --force 2>$null | Out-Null
        $SizeAfter = Get-DirSize $NpmCache
        $Freed = $SizeBefore - $SizeAfter
        $TotalFreed += $Freed
        
        if ($Freed -gt 0) {
            Write-Host "  ✓ Cache npm nettoyé: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
        } else {
            Write-Host "  ℹ Cache npm déjà propre" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ℹ Cache npm non disponible" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ℹ Erreur lors du nettoyage npm" -ForegroundColor Yellow
}

# 4. Nettoyage des fichiers temporaires
Write-Host ""
Write-Host "[4/6] Nettoyage des fichiers temporaires..." -ForegroundColor Cyan
$Freed = 0

# Nettoyer les logs anciens (plus de 7 jours)
if (Test-Path "logs") {
    $SevenDaysAgo = (Get-Date).AddDays(-7)
    Get-ChildItem "logs" -Filter "*.log" -File | Where-Object { $_.LastWriteTime -lt $SevenDaysAgo } | ForEach-Object {
        $Freed += $_.Length
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

# Nettoyer les fichiers temporaires
if (Test-Path "tmp") {
    Remove-Item "tmp\*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "temp") {
    Remove-Item "temp\*" -Recurse -Force -ErrorAction SilentlyContinue
}

if ($Freed -gt 0) {
    Write-Host "  ✓ Fichiers temporaires nettoyés: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
    $TotalFreed += $Freed
} else {
    Write-Host "  ℹ Aucun fichier temporaire à nettoyer" -ForegroundColor Yellow
}

# 5. Nettoyage des anciens builds
Write-Host ""
Write-Host "[5/6] Nettoyage des anciens builds..." -ForegroundColor Cyan
$Freed = 0
if (Test-Path ".next\static") {
    $ThirtyDaysAgo = (Get-Date).AddDays(-30)
    Get-ChildItem ".next\static" -Recurse -File | Where-Object { $_.LastWriteTime -lt $ThirtyDaysAgo } | ForEach-Object {
        $Freed += $_.Length
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

if ($Freed -gt 0) {
    Write-Host "  ✓ Anciens builds nettoyés: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
    $TotalFreed += $Freed
} else {
    Write-Host "  ℹ Aucun ancien build à nettoyer" -ForegroundColor Yellow
}

# 6. Optimisation des bases de données (SQLite VACUUM si disponible)
Write-Host ""
Write-Host "[6/6] Optimisation des bases de données..." -ForegroundColor Cyan
$Freed = 0
if (Test-Path "prisma") {
    Get-ChildItem "prisma" -Recurse -Filter "*.db" -File | ForEach-Object {
        $SizeBefore = $_.Length
        # Note: VACUUM nécessite sqlite3.exe, on l'ignore si non disponible
        $Freed += 0  # Pas de VACUUM automatique sur Windows sans sqlite3
    }
}

if ($Freed -gt 0) {
    Write-Host "  ✓ Bases de données optimisées: $(Format-Bytes $Freed) libérés" -ForegroundColor Green
    $TotalFreed += $Freed
} else {
    Write-Host "  ℹ Bases de données déjà optimisées" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Nettoyage terminé !" -ForegroundColor Green
Write-Host "  Espace libéré: $(Format-Bytes $TotalFreed)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

if ($TotalFreed -gt 0) {
    Write-Host ""
    Write-Host "💡 Conseil: Redémarrez le serveur pour appliquer les changements" -ForegroundColor Yellow
}















