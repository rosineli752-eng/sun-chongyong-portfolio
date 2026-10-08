$ErrorActionPreference = 'Stop'
$portfolioRoot = $PSScriptRoot
$previewUrl = 'http://127.0.0.1:4173/'
$isRunning = $false
try {
  $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 2
  $isRunning = $response.StatusCode -eq 200 -and $response.Content.Contains('sculpture-stage')
} catch {}
if (-not $isRunning) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $nodePath = if ($nodeCommand) { $nodeCommand.Source } else { 'C:\Users\12839\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
  if (-not (Test-Path -LiteralPath $nodePath)) {
    Start-Process (Join-Path $portfolioRoot 'dist\index.html')
    exit
  }
  Start-Process -FilePath $nodePath -ArgumentList 'server.mjs' -WorkingDirectory $portfolioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $portfolioRoot 'preview.log') -RedirectStandardError (Join-Path $portfolioRoot 'preview-error.log')
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -eq 200 -and $response.Content.Contains('sculpture-stage')) { $isRunning = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 200
  }
}
if ($isRunning) { Start-Process $previewUrl }
else { Start-Process (Join-Path $portfolioRoot 'dist\index.html') }
