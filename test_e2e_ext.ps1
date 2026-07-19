$BASE = "https://prolink-backend-jbpj.onrender.com/api"

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "   PROLINK EXTENDED E2E TEST REPORT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. REGISTRATION
$rnd1 = Get-Random -Min 1000 -Max 9999
$rnd2 = Get-Random -Min 1000 -Max 9999
$rnd3 = Get-Random -Min 1000 -Max 9999
$clientEmail = "client.$rnd1@mailinator.com"
$providerEmail = "provider.$rnd2@mailinator.com"
$adminEmail = "admin.$rnd3@mailinator.com"

Write-Host "`n[1] Registering Test Accounts" -ForegroundColor Magenta

# Client
$bodyClient = @{email=$clientEmail; password="TestPass123!"; user_type="client"; full_name="E2E Client"} | ConvertTo-Json
$rClient = Invoke-RestMethod -Uri "$BASE/auth/register" -Method Post -ContentType "application/json" -Body $bodyClient
$clientTok = $rClient.token
Write-Host "  [OK] Client created" -ForegroundColor Green

# Provider
$bodyProv = @{email=$providerEmail; password="TestPass123!"; user_type="provider"; full_name="E2E Provider"} | ConvertTo-Json
$rProv = Invoke-RestMethod -Uri "$BASE/auth/register" -Method Post -ContentType "application/json" -Body $bodyProv
$provTok = $rProv.token
Write-Host "  [OK] Provider created" -ForegroundColor Green

# Admin
$bodyAdmin = @{email=$adminEmail; password="TestPass123!"; user_type="admin"; full_name="E2E Admin"} | ConvertTo-Json
$rAdmin = Invoke-RestMethod -Uri "$BASE/auth/register" -Method Post -ContentType "application/json" -Body $bodyAdmin
$adminTok = $rAdmin.token
Write-Host "  [OK] Admin created" -ForegroundColor Green

# 2. ADMIN ENDPOINTS
Write-Host "`n[2] Testing Admin Access" -ForegroundColor Magenta
try {
    $rStats = Invoke-RestMethod -Uri "$BASE/admin/stats" -Method Get -Headers @{Authorization="Bearer $adminTok"}
    Write-Host "  [OK] Admin stats fetched" -ForegroundColor Green
} catch {
    Write-Host "  [?] Admin stats returned error: $_" -ForegroundColor Yellow
}

# 3. JOB CREATION
Write-Host "`n[3] Job Creation & Bidding" -ForegroundColor Magenta
$jobBody = @{
    title="Need a Fullstack Dev"
    description="Build an e-commerce platform"
    category_id=1
    budget=1500
    skills=@("React", "Node")
} | ConvertTo-Json

try {
    $rJob = Invoke-RestMethod -Uri "$BASE/jobs" -Method Post -ContentType "application/json" -Body $jobBody -Headers @{Authorization="Bearer $clientTok"}
    $jobId = $rJob.job.id
    if (-not $jobId) { $jobId = $rJob.id }
    Write-Host "  [OK] Job created (ID: $jobId)" -ForegroundColor Green

    # Provider bids
    $bidBody = @{
        amount=1400
        proposal="I can build it in 30 days."
        delivery_time="30 days"
    } | ConvertTo-Json

    $rBid = Invoke-RestMethod -Uri "$BASE/jobs/$jobId/bids" -Method Post -ContentType "application/json" -Body $bidBody -Headers @{Authorization="Bearer $provTok"}
    $bidId = $rBid.bid.id
    if (-not $bidId) { $bidId = $rBid.id }
    Write-Host "  [OK] Bid submitted (ID: $bidId)" -ForegroundColor Green

    # Accept Bid (Contract Creation)
    if ($bidId) {
        $rAccept = Invoke-RestMethod -Uri "$BASE/jobs/$jobId/bids/$bidId/accept" -Method Post -Headers @{Authorization="Bearer $clientTok"}
        Write-Host "  [OK] Bid accepted, contract created" -ForegroundColor Green
    }
} catch {
    Write-Host "  [FAIL] Job/Bid flow failed: $_" -ForegroundColor Red
}

# 4. AI INTEGRATION
Write-Host "`n[4] AI Integration" -ForegroundColor Magenta
$aiBody = @{
    title="React Dev"
    keywords=@("React", "CSS")
} | ConvertTo-Json

try {
    $rAi = Invoke-RestMethod -Uri "$BASE/ai/generate-description" -Method Post -ContentType "application/json" -Body $aiBody -Headers @{Authorization="Bearer $clientTok"}
    Write-Host "  [OK] AI response generated" -ForegroundColor Green
} catch {
    Write-Host "  [?] AI endpoint issue: $_" -ForegroundColor Yellow
}

Write-Host "`n=== E2E SUITE COMPLETE ===" -ForegroundColor Cyan
