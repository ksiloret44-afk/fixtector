# Script de test de performance pour FixTector
param(
    [int]$Port = 3001,
    [int]$Requests = 30,
    [int]$Concurrent = 3
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Test de Performance FixTector" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si le serveur tourne
Write-Host "[INFO] Verification du serveur sur le port $Port..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "[SUCCESS] Serveur detecte (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Le serveur ne repond pas sur le port $Port" -ForegroundColor Red
    Write-Host "[INFO] Demarrez le serveur avec: npm start" -ForegroundColor Yellow
    exit 1
}

# Routes a tester
$routes = @(
    @{ Name = "Page d'accueil"; Url = "http://localhost:$Port/" },
    @{ Name = "Page de login"; Url = "http://localhost:$Port/login" },
    @{ Name = "API Auth Status"; Url = "http://localhost:$Port/api/auth/check-status" },
    @{ Name = "API Updates Check"; Url = "http://localhost:$Port/api/updates/check" }
)

Write-Host ""
Write-Host "[INFO] Test de performance - $Requests requetes, $Concurrent concurrentes" -ForegroundColor Yellow
Write-Host ""

$results = @{}

foreach ($route in $routes) {
    Write-Host "[TEST] Test de: $($route.Name)" -ForegroundColor Cyan
    
    $durations = @()
    $successCount = 0
    $failCount = 0
    $statusCodes = @{}
    
    # Faire les requetes
    for ($i = 0; $i -lt $Requests; $i++) {
        $startTime = Get-Date
        try {
            $response = Invoke-WebRequest -Uri $route.Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalMilliseconds
            
            $durations += $duration
            $successCount++
            
            $statusCode = $response.StatusCode
            if ($statusCodes.ContainsKey($statusCode)) {
                $statusCodes[$statusCode]++
            } else {
                $statusCodes[$statusCode] = 1
            }
        } catch {
            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalMilliseconds
            $durations += $duration
            $failCount++
            
            $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
            if ($statusCodes.ContainsKey($statusCode)) {
                $statusCodes[$statusCode]++
            } else {
                $statusCodes[$statusCode] = 1
            }
        }
        
        # Afficher la progression
        if (($i + 1) % 5 -eq 0) {
            $progress = [Math]::Round((($i + 1) / $Requests) * 100)
            Write-Host "  Progression: $($i + 1) / $Requests ($progress%)" -ForegroundColor Gray
        }
    }
    
    # Calculer les statistiques
    if ($durations.Count -gt 0) {
        $avgDuration = ($durations | Measure-Object -Average).Average
        $minDuration = ($durations | Measure-Object -Minimum).Minimum
        $maxDuration = ($durations | Measure-Object -Maximum).Maximum
        $sortedDurations = $durations | Sort-Object
        $medianDuration = $sortedDurations[[Math]::Floor($sortedDurations.Count / 2)]
        $p95Index = [Math]::Floor($sortedDurations.Count * 0.95)
        $p95Duration = $sortedDurations[$p95Index]
        
        $results[$route.Name] = @{
            Avg = $avgDuration
            Min = $minDuration
            Max = $maxDuration
            Median = $medianDuration
            P95 = $p95Duration
            Success = $successCount
            Fail = $failCount
            StatusCodes = $statusCodes
        }
        
        Write-Host "  [OK] Requetes reussies: $successCount / $Requests" -ForegroundColor Green
        if ($failCount -gt 0) {
            Write-Host "  [FAIL] Requetes echouees: $failCount" -ForegroundColor Red
        }
        Write-Host "  Temps moyen: $([Math]::Round($avgDuration, 2)) ms" -ForegroundColor Cyan
        Write-Host "  Temps min: $([Math]::Round($minDuration, 2)) ms" -ForegroundColor Gray
        Write-Host "  Temps max: $([Math]::Round($maxDuration, 2)) ms" -ForegroundColor Gray
        Write-Host "  Mediane: $([Math]::Round($medianDuration, 2)) ms" -ForegroundColor Gray
        Write-Host "  P95: $([Math]::Round($p95Duration, 2)) ms" -ForegroundColor Yellow
        
        if ($statusCodes.Count -gt 0) {
            Write-Host "  Codes de statut:" -ForegroundColor Gray
            foreach ($code in $statusCodes.Keys | Sort-Object) {
                Write-Host "    $code : $($statusCodes[$code])" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  [ERROR] Aucune requete reussie" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Resume global
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Resume des performances" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ($results.Count -gt 0) {
    $overallAvg = ($results.Values | ForEach-Object { $_.Avg } | Measure-Object -Average).Average
    $overallSuccess = ($results.Values | ForEach-Object { $_.Success } | Measure-Object -Sum).Sum
    $overallFail = ($results.Values | ForEach-Object { $_.Fail } | Measure-Object -Sum).Sum
    $totalRequests = $overallSuccess + $overallFail
    
    Write-Host "Temps de reponse moyen global: $([Math]::Round($overallAvg, 2)) ms" -ForegroundColor Cyan
    Write-Host "Taux de succes: $([Math]::Round(($overallSuccess / $totalRequests) * 100, 2))% ($overallSuccess / $totalRequests)" -ForegroundColor $(if (($overallSuccess / $totalRequests) -gt 0.95) { "Green" } else { "Yellow" })
    Write-Host ""
    
    # Recommandations
    Write-Host "Recommandations:" -ForegroundColor Yellow
    if ($overallAvg -lt 100) {
        Write-Host "  [OK] Excellent temps de reponse (< 100ms)" -ForegroundColor Green
    } elseif ($overallAvg -lt 500) {
        Write-Host "  [WARN] Temps de reponse acceptable (< 500ms)" -ForegroundColor Yellow
    } else {
        Write-Host "  [ERROR] Temps de reponse eleve (> 500ms)" -ForegroundColor Red
        Write-Host "    - Verifiez que le serveur est en mode production (npm start)" -ForegroundColor White
        Write-Host "    - Verifiez les performances de la base de donnees" -ForegroundColor White
        Write-Host "    - Verifiez la charge du serveur" -ForegroundColor White
    }
    
    if ($overallFail -gt 0) {
        Write-Host "  [WARN] Certaines requetes ont echoue" -ForegroundColor Yellow
        Write-Host "    - Verifiez les logs du serveur" -ForegroundColor White
        Write-Host "    - Verifiez la configuration" -ForegroundColor White
    }
} else {
    Write-Host "[ERROR] Aucun resultat disponible" -ForegroundColor Red
}

Write-Host ""
