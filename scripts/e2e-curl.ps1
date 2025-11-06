# E2E test using curl.exe and PowerShell for parsing
# Suppress PSScriptAnalyzer warning about unused declared vars that may be stale in editor diagnostics
# (Some editors cache diagnostics; if you still see PSUseDeclaredVarsMoreThanAssignments, reload the window.)
$base='http://localhost:3000'
$adminJar = "$PSScriptRoot\admin_cookies.txt"
$demoJar = "$PSScriptRoot\demo_cookies.txt"
Remove-Item $adminJar -ErrorAction SilentlyContinue
Remove-Item $demoJar -ErrorAction SilentlyContinue

function Get-CsrfWithCurl($jar, $outJson){
    $url = "$base/auth/csrf"
    & curl.exe -s -c $jar -o $outJson $url
    $json = Get-Content $outJson -Raw | ConvertFrom-Json
    return $json.csrfToken
}

Write-Host "Getting admin CSRF and logging in..."
$adminCsrf = Get-CsrfWithCurl $adminJar "$PSScriptRoot\admin_csrf.json"
Write-Host "admin csrf: $adminCsrf"
$loginBodyObj = @{ email = 'admin@empresa.com'; password = 'Admin123' }
$loginBodyObj | ConvertTo-Json -Depth 3 | Out-File -FilePath "$PSScriptRoot\admin_login_payload.json" -Encoding UTF8
$loginOut = "$PSScriptRoot\admin_login.json"
& curl.exe -s -b $adminJar -c $adminJar -H "Content-Type: application/json" -H "x-csrf-token: $adminCsrf" --data-binary "@$(Join-Path $PSScriptRoot 'admin_login_payload.json')" "$base/auth/login" -o $loginOut
Write-Host "Admin login response (raw):"; Get-Content $loginOut -Raw | Write-Host

# Create inspection assigned to demo
$inspectionOut = "$PSScriptRoot\create_inspection.json"
$today = (Get-Date).ToString('yyyy-MM-dd')
$inspectionObj = @{
  title = 'E2E Test Inspeccion'
  inspection = @{
    sections = @{
      ubicacion = @{ oficina = 'Oficina E2E'; edificio = 'Edificio 1'; piso = '1' }
      observaciones = @{ observaciones_generales = 'Prueba E2E' }
    }
    images_base64 = @()
  }
  assignedTo = 'demo@empresa.com'
  date = $today
}
$inspectionObj | ConvertTo-Json -Depth 10 | Out-File -FilePath "$PSScriptRoot\inspection_payload.json" -Encoding UTF8
& curl.exe -s -b $adminJar -c $adminJar -H "Content-Type: application/json" --data-binary "@$(Join-Path $PSScriptRoot 'inspection_payload.json')" "$base/api/inspections" -o $inspectionOut
Write-Host "Create inspection response:"; Get-Content $inspectionOut | ConvertFrom-Json | Format-List

$taskId = (Get-Content $inspectionOut | ConvertFrom-Json).id_tarea
Write-Host "Created task id: $taskId"

# Demo login
Write-Host "Demo login..."
$demoCsrf = Get-CsrfWithCurl $demoJar "$PSScriptRoot\demo_csrf.json"
$demoLoginObj = @{ email = 'demo@empresa.com'; password = 'Demo123' }
$demoLoginObj | ConvertTo-Json -Depth 3 | Out-File -FilePath "$PSScriptRoot\demo_login_payload.json" -Encoding UTF8
$demoLoginOut = "$PSScriptRoot\demo_login.json"
& curl.exe -s -b $demoJar -c $demoJar -H "Content-Type: application/json" -H "x-csrf-token: $demoCsrf" --data-binary "@$(Join-Path $PSScriptRoot 'demo_login_payload.json')" "$base/auth/login" -o $demoLoginOut
Write-Host "Demo login response (raw):"; Get-Content $demoLoginOut -Raw | Write-Host

# Fetch tasks for demo
$tasksOut = "$PSScriptRoot\tasks_demo.json"
& curl.exe -s -b $demoJar -c $demoJar "$base/api/tasks" -o $tasksOut
Write-Host "Tasks for demo:"; Get-Content $tasksOut | ConvertFrom-Json | Format-Table -AutoSize

# Try mark done without photo
Write-Host "Attempting to mark done without photo (expect failure)"
$putBodyObj = @{ status = 'done' }
$putBodyObj | ConvertTo-Json -Depth 3 | Out-File -FilePath "$PSScriptRoot\put_payload.json" -Encoding UTF8
$putOut = "$PSScriptRoot\put_no_photo.json"
& curl.exe -s -w "%{http_code}" -b $demoJar -c $demoJar -X PUT -H "Content-Type: application/json" -H "x-csrf-token: $demoCsrf" --data-binary "@$(Join-Path $PSScriptRoot 'put_payload.json')" "$base/api/tasks/$taskId" -o $putOut > "$PSScriptRoot\put_status.txt"
$status = Get-Content "$PSScriptRoot\put_status.txt" -Raw
Write-Host "HTTP status:" $status
if($status -ne '200') { Write-Host "Expected non-200 response (blocked):"; Get-Content $putOut | Write-Host }

# Upload image
Write-Host "Uploading small PNG as base64 to task $taskId"
$base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAf0lPgQAAAABJRU5ErkJggg=='
 $imgObj = @{ images = @( @{ name = 'e2e-test.png'; type = 'image/png'; data = $base64 } ) }
 $imgObj | ConvertTo-Json -Depth 5 | Out-File -FilePath "$PSScriptRoot\img_payload.json" -Encoding UTF8
 $imgOut = "$PSScriptRoot\img_upload.json"
 & curl.exe -s -b $demoJar -c $demoJar -H "Content-Type: application/json" -H "x-csrf-token: $demoCsrf" --data-binary "@$(Join-Path $PSScriptRoot 'img_payload.json')" "$base/api/tasks/$taskId/images" -o $imgOut
 Write-Host "Upload response (raw):"; Get-Content $imgOut -Raw | Write-Host

# Mark done after upload
$putOut2 = "$PSScriptRoot\put_after_photo.json"
& curl.exe -s -w "%{http_code}" -b $demoJar -c $demoJar -X PUT -H "Content-Type: application/json" -H "x-csrf-token: $demoCsrf" --data-binary "@$(Join-Path $PSScriptRoot 'put_payload.json')" "$base/api/tasks/$taskId" -o $putOut2 > "$PSScriptRoot\put_status2.txt"
$status2 = Get-Content "$PSScriptRoot\put_status2.txt" -Raw
Write-Host "HTTP status after upload:" $status2
Get-Content $putOut2 | ConvertFrom-Json | Format-List

# List uploads folder
$projectRoot = Split-Path $PSScriptRoot -Parent
$uploadPath = [System.IO.Path]::Combine($projectRoot, 'uploads', 'tasks', [string]$taskId)
Write-Host "Checking uploads folder:" $uploadPath
if(Test-Path $uploadPath){ Get-ChildItem $uploadPath -File | ForEach-Object { Write-Host " - " $_.Name $_.Length } } else { Write-Host "Uploads folder not found for task $taskId" }

Write-Host "E2E curl test done." 
