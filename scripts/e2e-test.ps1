# E2E test script (PowerShell)
# Steps:
# 1. Login admin
# 2. Create inspection assigned to demo@empresa.com
# 3. Login demo
# 4. Verify task appears and try to mark 'done' without photo (expect failure)
# 5. Upload a small PNG as base64
# 6. Mark task 'done' (expect success)

$base = 'http://localhost:3000'

function Get-Csrf([Microsoft.PowerShell.Commands.WebRequestSession] $session) {
    $res = Invoke-RestMethod -Uri "$base/auth/csrf" -Method Get -WebSession $session -ErrorAction Stop
    return $res.csrfToken
}

Write-Host "Starting E2E test against $base"

# Admin session
$adminSess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminCsrf = Get-Csrf -session $adminSess
Write-Host "Admin CSRF:" $adminCsrf

$loginBody = @{ email = 'admin@empresa.com'; password = 'Admin123' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -WebSession $adminSess -Body $loginBody -ContentType 'application/json' -Headers @{ 'csrf-token' = $adminCsrf }
Write-Host "Admin login response:"; $loginRes | Format-List

# Create inspection assigned to demo user
$inspectionPayload = @{
    title = 'E2E Test Inspeccion'
    inspection = @{
        sections = @{
            ubicacion = @{ oficina = 'Oficina E2E'; edificio = 'Edificio 1'; piso = '1' }
            observaciones = @{ observaciones_generales = 'Prueba E2E' }
        }
        images_base64 = @()
    }
    assignedTo = 'demo@empresa.com'
    date = (Get-Date).ToString('yyyy-MM-dd')
}
$bodyJson = $inspectionPayload | ConvertTo-Json -Depth 10
Write-Host "Creating inspection assigned to demo..."
$createRes = Invoke-RestMethod -Uri "$base/api/inspections" -Method Post -WebSession $adminSess -Body $bodyJson -ContentType 'application/json'
Write-Host "Create inspection response:"; $createRes | Format-List

$taskId = $createRes.id_tarea
Write-Host "Created task id:" $taskId

# Demo session
$demoSess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$demoCsrf = Get-Csrf -session $demoSess
Write-Host "Demo CSRF:" $demoCsrf
$demoLoginBody = @{ email = 'demo@empresa.com'; password = 'Demo123' } | ConvertTo-Json
$demoLoginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -WebSession $demoSess -Body $demoLoginBody -ContentType 'application/json' -Headers @{ 'csrf-token' = $demoCsrf }
Write-Host "Demo login response:"; $demoLoginRes | Format-List

# Fetch tasks as demo
$tasks = Invoke-RestMethod -Uri "$base/api/tasks" -Method Get -WebSession $demoSess
$assigned = $tasks | Where-Object { $_.assignedTo -and $_.assignedTo -match 'demo@' }
Write-Host "Tasks assigned to demo: " ($assigned | Measure-Object).Count
$assigned | Format-Table id,title,status,assignedTo

# Try to mark done without photo
if($null -eq $taskId){
    if($assigned.Count -gt 0){ $taskId = $assigned[0].id }
}
Write-Host "Attempting to set task $taskId to done WITHOUT photo (should fail)"
$putBody = @{ status = 'done' } | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "$base/api/tasks/$taskId" -Method Put -WebSession $demoSess -Body $putBody -ContentType 'application/json'
    Write-Host "Unexpected success:"; $res | Format-List
} catch {
    Write-Host "Expected error when marking done without photo:" $_.Exception.Response.StatusCode.value__
    $errText = $_.Exception.Response.GetResponseStream() | New-Object System.IO.StreamReader | ForEach-Object { $_.ReadToEnd() }
    Write-Host $errText
}

# Upload a small PNG via /api/tasks/:id/images
$base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAf0lPgQAAAABJRU5ErkJggg=='
$imagesPayload = @{ images = @(@{ name = 'e2e-test.png'; type = 'image/png'; data = $base64 }) } | ConvertTo-Json
Write-Host "Uploading image to task $taskId..."
$imgRes = Invoke-RestMethod -Uri "$base/api/tasks/$taskId/images" -Method Post -WebSession $demoSess -Body $imagesPayload -ContentType 'application/json'
Write-Host "Upload response:"; $imgRes | Format-List

# Now attempt to set status to done
Write-Host "Attempting to set task $taskId to done AFTER photo upload"
$putBody = @{ status = 'done' } | ConvertTo-Json
$finalRes = Invoke-RestMethod -Uri "$base/api/tasks/$taskId" -Method Put -WebSession $demoSess -Body $putBody -ContentType 'application/json'
Write-Host "Final update response:"; $finalRes | Format-List

# Check uploads folder exists
$uploadPath = Join-Path -Path (Resolve-Path ..).ProviderPath -ChildPath "uploads/tasks/$taskId"
Write-Host "Checking uploads folder:" $uploadPath
if(Test-Path $uploadPath){
    Get-ChildItem $uploadPath | ForEach-Object { Write-Host " - " $_.Name $_.Length }
} else {
    Write-Host "Uploads folder not found for task $taskId"
}

Write-Host "E2E test complete." 
