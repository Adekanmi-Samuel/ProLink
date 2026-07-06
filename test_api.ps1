$BASE = "https://prolink-backend-jbpj.onrender.com/api"

Write-Host "=== Testing ProLink API ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1] Health check..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod -Uri "https://prolink-backend-jbpj.onrender.com/health" -Method Get
    Write-Host "  [OK] Health: $($r | ConvertTo-Json)" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    Write-Host "  [FAIL] Health failed: $msg" -ForegroundColor Red
}

# Test 2: Get public jobs
Write-Host "`n[2] GET /jobs..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod -Uri "$BASE/jobs" -Method Get
    Write-Host "  [OK] Jobs returned: $($r.Count) jobs" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    Write-Host "  [FAIL] Jobs failed: $msg" -ForegroundColor Red
}

# Test 3: Get categories
Write-Host "`n[3] GET /taxonomy/categories..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod -Uri "$BASE/taxonomy/categories" -Method Get
    Write-Host "  [OK] Categories: $($r.Count) categories" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    Write-Host "  [FAIL] Categories failed: $msg" -ForegroundColor Red
}

# Test 4: Register a test CLIENT
Write-Host "`n[4] POST /auth/register (client)..." -ForegroundColor Yellow
$rnd = Get-Random -Minimum 1000 -Maximum 9999
$clientEmail = "testclient.$rnd@mailinator.com"
$clientBody = @{email=$clientEmail;password="TestPass123!";user_type="client"} | ConvertTo-Json

try {
    $r = Invoke-RestMethod -Uri "$BASE/auth/register" -Method Post -ContentType "application/json" -Body $clientBody
    Write-Host "  [OK] Client registered: $clientEmail" -ForegroundColor Green
    Write-Host "  Token received: $($r.token.Substring(0, 20))..." -ForegroundColor Gray
    $global:clientToken = $r.token
} catch {
    $errMsg = "unknown"
    try { $errObj = $_.ErrorDetails.Message | ConvertFrom-Json; $errMsg = $errObj.error } catch { $errMsg = $_.Exception.Message }
    Write-Host "  [FAIL] Register failed: $errMsg" -ForegroundColor Red
}

# Test 5: Register a test PROVIDER
Write-Host "`n[5] POST /auth/register (provider)..." -ForegroundColor Yellow
$rnd2 = Get-Random -Minimum 1000 -Maximum 9999
$providerEmail = "testprovider.$rnd2@mailinator.com"
$providerBody = @{email=$providerEmail;password="TestPass123!";user_type="provider"} | ConvertTo-Json

try {
    $r = Invoke-RestMethod -Uri "$BASE/auth/register" -Method Post -ContentType "application/json" -Body $providerBody
    Write-Host "  [OK] Provider registered: $providerEmail" -ForegroundColor Green
    Write-Host "  Token received: $($r.token.Substring(0, 20))..." -ForegroundColor Gray
    $global:providerToken = $r.token
} catch {
    $errMsg = "unknown"
    try { $errObj = $_.ErrorDetails.Message | ConvertFrom-Json; $errMsg = $errObj.error } catch { $errMsg = $_.Exception.Message }
    Write-Host "  [FAIL] Register failed: $errMsg" -ForegroundColor Red
}

# Test 6: Login with invalid creds
Write-Host "`n[6] POST /auth/login (bad creds)..." -ForegroundColor Yellow
$loginBody = @{email="nonexistent@test.com";password="wrong"} | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$BASE/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    Write-Host "  [UNEXPECTED] Login succeeded: $($r | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  [OK] Login correctly rejected with HTTP $statusCode" -ForegroundColor Green
}

# Test 7: Get own profile with client token
Write-Host "`n[7] GET /profiles/me (with client token)..." -ForegroundColor Yellow
if ($global:clientToken) {
    $headers = @{Authorization = "Bearer $($global:clientToken)"}
    try {
        $r = Invoke-RestMethod -Uri "$BASE/profiles/me" -Method Get -Headers $headers
        Write-Host "  [OK] Profile/me: user_id=$($r.user_id), email=$($r.email)" -ForegroundColor Green
    } catch {
        $errMsg = $_.Exception.Message
        Write-Host "  [FAIL] Profile failed: $errMsg" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] No client token available" -ForegroundColor Gray
}

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "=== API TESTING COMPLETE ===" -ForegroundColor Cyan
