param([switch]$NoBrowser, [ValidateSet('gguf','mindspore')][string]$Backend = 'gguf')
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskUrl = 'http://127.0.0.1:8875'
try {
  $taskHealth = Invoke-RestMethod -Uri "$taskUrl/api/health" -TimeoutSec 2
  if ($taskHealth.app -eq 'zhiban-offline') {
    if ($taskHealth.appVersion -eq 'hcl-desktop-v2' -and $taskHealth.backend -eq $Backend) {
      if (-not $NoBrowser) { Start-Process $taskUrl }; exit
    }
    try {
      Invoke-RestMethod -Uri "$taskUrl/api/shutdown" -Method Post -Headers @{ Origin = $taskUrl } -TimeoutSec 3 | Out-Null
      Start-Sleep -Milliseconds 2500
    } catch { throw 'Updating local service failed. Close it with the project stop launcher and retry.' }
  }
} catch { if ($_.Exception.Message -like '*Updating local service*') { throw } }
$taskCandidates = @(
  (Join-Path $PSScriptRoot 'node/node.exe'),
  'D:/DevEco Studio/tools/node/node.exe',
  (Join-Path $env:LOCALAPPDATA 'Programs/nodejs/node.exe'),
  (Join-Path $env:ProgramFiles 'nodejs/node.exe')
)
$taskCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if ($taskCommand) { $taskCandidates += $taskCommand.Source }
$taskNode = $taskCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $taskNode) { throw 'Please install Node.js 22 or newer, then open this launcher again.' }
$taskVersion = & $taskNode -p 'process.versions.node.split(".")[0]'
if ([int]$taskVersion -lt 22) { throw 'Node.js 22 or newer is required.' }
if ($Backend -eq 'gguf') {
  if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'windows-cpu/llama-server.exe')) -or
      -not (Test-Path -LiteralPath (Join-Path $taskRoot 'models/qwen3/Qwen3-0.6B-Q8_0.gguf'))) {
    throw 'Run prepare-model launcher or tools/local-llm/Prepare-Desktop.ps1 first.'
  }
}
$taskLogDir = Join-Path $taskRoot 'outputs/local-chat'
New-Item -ItemType Directory -Force -Path $taskLogDir | Out-Null
$taskScript = Join-Path $PSScriptRoot 'desktop/server.cjs'
$env:COMPANION_PORT = 8875
$env:COMPANION_ENGINE_PORT = 8876
$env:COMPANION_BACKEND = $Backend
$taskProcess = Start-Process -FilePath $taskNode -ArgumentList ('"' + $taskScript + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskLogDir 'desktop.log') -RedirectStandardError (Join-Path $taskLogDir 'desktop-error.log')
for ($taskTry = 0; $taskTry -lt 20; $taskTry++) {
  if ($taskProcess.HasExited) { throw 'Local service exited. See outputs/local-chat/desktop-error.log.' }
  try {
    $taskHealth = Invoke-RestMethod -Uri "$taskUrl/api/health" -TimeoutSec 1
    if ($taskHealth.app -eq 'zhiban-offline') { if (-not $NoBrowser) { Start-Process $taskUrl }; exit }
  } catch {}
  Start-Sleep -Milliseconds 500
}
throw 'Local service did not start. See outputs/local-chat/desktop-error.log.'
