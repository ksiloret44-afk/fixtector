# Script pour verifier le mode du serveur (dev ou production)

param(
    [int]$Port = 3001
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Verification du mode du serveur" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier si le serveur tourne
Write-Host "[1] Verification du serveur sur le port $Port..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $serverRunning = $true
    Write-Host "[OK] Serveur detecte (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Le serveur ne repond pas sur le port $Port" -ForegroundColor Red
    Write-Host "[INFO] Le serveur n'est peut-etre pas demarre" -ForegroundColor Yellow
    exit 1
}

# 2. Verifier les processus Node.js
Write-Host ""
Write-Host "[2] Verification des processus Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "[OK] Processus Node.js detectes: $($nodeProcesses.Count)" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        Write-Host "  PID: $($proc.Id) | CPU: $([Math]::Round($proc.CPU, 2))s | Memoire: $([Math]::Round($proc.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Gray
        
        # Analyser la ligne de commande
        if ($commandLine -like "*next start*") {
            Write-Host "    -> MODE PRODUCTION (next start)" -ForegroundColor Green
        } elseif ($commandLine -like "*next dev*") {
            Write-Host "    -> MODE DEVELOPPEMENT (next dev)" -ForegroundColor Red
        } else {
            Write-Host "    -> Commande: $($commandLine.Substring(0, [Math]::Min(80, $commandLine.Length)))..." -ForegroundColor Gray
        }
    }
} else {
    Write-Host "[WARNING] Aucun processus Node.js detecte" -ForegroundColor Yellow
}

# 3. Verifier les headers HTTP
Write-Host ""
Write-Host "[3] Analyse des headers HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    
    # Verifier le header X-Powered-By (Next.js le retire en production)
    $poweredBy = $response.Headers["X-Powered-By"]
    if ($poweredBy) {
        Write-Host "[INFO] Header X-Powered-By: $poweredBy" -ForegroundColor Gray
    } else {
        Write-Host "[OK] Pas de header X-Powered-By (signe de mode production)" -ForegroundColor Green
    }
    
    # Verifier le header Server
    $server = $response.Headers["Server"]
    if ($server) {
        Write-Host "[INFO] Header Server: $server" -ForegroundColor Gray
    }
    
    # Verifier la taille de la reponse (les builds de production sont optimises)
    $contentLength = $response.RawContentLength
    Write-Host "[INFO] Taille de la reponse: $contentLength bytes" -ForegroundColor Gray
    
} catch {
    Write-Host "[ERROR] Impossible d'analyser les headers: $_" -ForegroundColor Red
}

# 4. Verifier si le dossier .next existe et contient un build de production
Write-Host ""
Write-Host "[4] Verification du build de production..." -ForegroundColor Yellow
$currentDir = Get-Location

if (Test-Path ".next") {
    Write-Host "[OK] Dossier .next trouve" -ForegroundColor Green
    
    # Verifier BUILD_ID (present uniquement en production)
    if (Test-Path ".next\BUILD_ID") {
        $buildId = Get-Content ".next\BUILD_ID" -ErrorAction SilentlyContinue
        Write-Host "[OK] BUILD_ID trouve: $buildId (signe de build de production)" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] BUILD_ID non trouve (pas de build de production)" -ForegroundColor Yellow
    }
    
    # Verifier les fichiers de build
    if (Test-Path ".next\standalone") {
        Write-Host "[OK] Dossier standalone trouve (build de production)" -ForegroundColor Green
    }
    
    if (Test-Path ".next\server") {
        Write-Host "[OK] Dossier server trouve" -ForegroundColor Green
    }
    
    # Verifier la date de modification
    $nextModified = (Get-Item ".next").LastWriteTime
    Write-Host "[INFO] Derniere modification: $nextModified" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Dossier .next non trouve" -ForegroundColor Red
    Write-Host "[INFO] Executez: npm run build" -ForegroundColor Yellow
}

# 5. Verifier le temps de reponse (les builds de production sont plus rapides)
Write-Host ""
Write-Host "[5] Test de performance rapide..." -ForegroundColor Yellow
$times = @()
for ($i = 0; $i -lt 5; $i++) {
    $startTime = Get-Date
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        $times += $duration
    } catch {
        # Ignorer les erreurs pour ce test
    }
}

if ($times.Count -gt 0) {
    $avgTime = ($times | Measure-Object -Average).Average
    Write-Host "[INFO] Temps de reponse moyen: $([Math]::Round($avgTime, 2)) ms" -ForegroundColor Gray
    
    if ($avgTime -lt 200) {
        Write-Host "[OK] Temps de reponse rapide (signe de mode production)" -ForegroundColor Green
    } elseif ($avgTime -lt 500) {
        Write-Host "[WARNING] Temps de reponse moyen (peut etre mode dev)" -ForegroundColor Yellow
    } else {
        Write-Host "[WARNING] Temps de reponse lent (probablement mode dev)" -ForegroundColor Red
    }
}

# 6. Verifier les variables d'environnement (si possible)
Write-Host ""
Write-Host "[6] Verification des variables d'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "[OK] Fichier .env.local trouve" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue
    $nodeEnv = $envContent | Where-Object { $_ -like "NODE_ENV=*" }
    if ($nodeEnv) {
        Write-Host "[INFO] $nodeEnv" -ForegroundColor Gray
    } else {
        Write-Host "[INFO] NODE_ENV non defini dans .env.local" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARNING] Fichier .env.local non trouve" -ForegroundColor Yellow
}

# Resume
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Resume" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$isProduction = $false
$indicators = @()

# Verifier les indicateurs
if ($nodeProcesses) {
    $hasNextStart = $nodeProcesses | ForEach-Object {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        $cmd -like "*next start*"
    } | Where-Object { $_ -eq $true }
    
    if ($hasNextStart) {
        $isProduction = $true
        $indicators += "[OK] Processus 'next start' detecte"
    } else {
        $hasNextDev = $nodeProcesses | ForEach-Object {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
            $cmd -like "*next dev*"
        } | Where-Object { $_ -eq $true }
        
        if ($hasNextDev) {
            $indicators += "[ERROR] Processus 'next dev' detecte (MODE DEV)"
        }
    }
}

if (Test-Path ".next\BUILD_ID") {
    $isProduction = $true
    $indicators += "[OK] BUILD_ID trouve (build de production)"
}

if ($times.Count -gt 0 -and ($times | Measure-Object -Average).Average -lt 200) {
    $indicators += "[OK] Temps de reponse rapide"
}

foreach ($indicator in $indicators) {
    $color = if ($indicator -like "[OK]*") { "Green" } elseif ($indicator -like "[ERROR]*") { "Red" } else { "Yellow" }
    Write-Host $indicator -ForegroundColor $color
}

Write-Host ""
if ($isProduction) {
    Write-Host ">>> MODE PRODUCTION ACTIF <<<" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le serveur tourne en mode production (optimise et rapide)" -ForegroundColor Green
} else {
    Write-Host ">>> MODE DEVELOPPEMENT DETECTE OU INCERTAIN <<<" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour passer en mode production:" -ForegroundColor Yellow
    Write-Host "  1. Arretez le serveur (Ctrl+C)" -ForegroundColor White
    Write-Host "  2. Executez: npm run build" -ForegroundColor White
    Write-Host "  3. Executez: npm start" -ForegroundColor White
}

Write-Host ""















