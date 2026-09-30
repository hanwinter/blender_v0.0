param([ValidateSet('frontend', 'backend')][string]$Service = 'frontend')

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$venvPython = Join-Path $projectRoot 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $venvPython)) { throw 'Python environment missing. Run scripts/setup.ps1 first.' }
$configuration = & $venvPython (Join-Path $PSScriptRoot 'read-config.py')
if ($LASTEXITCODE -ne 0) { throw 'Configuration could not be loaded. Run scripts/setup.ps1 and check .env.' }
$settings = $configuration | ConvertFrom-Json
$port = if ($Service -eq 'frontend') { $settings.frontendPort } else { $settings.backendPort }
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
try { $listener.Start() }
catch { throw "Port $port is occupied. Stop its service or change the corresponding port in .env." }
finally { $listener.Stop() }

$serviceDir = Join-Path $projectRoot $Service
Push-Location $serviceDir
try {
    if ($Service -eq 'frontend') {
        $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
        if (-not (Test-Path -LiteralPath 'node_modules')) { throw 'Frontend dependencies missing. Run scripts/setup.ps1 first.' }
        Write-Host "Frontend: http://127.0.0.1:$port"
        & $npm run dev
    } else {
        Write-Host "Backend API: http://127.0.0.1:$port/docs"
        & $venvPython -m app.run
    }
    if ($LASTEXITCODE -ne 0) { throw "$Service exited with code $LASTEXITCODE." }
} finally { Pop-Location }
