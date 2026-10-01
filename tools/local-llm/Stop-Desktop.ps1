$ErrorActionPreference = 'Stop'
$taskUrl = 'http://127.0.0.1:8875'
try {
  $taskHealth = Invoke-RestMethod -Uri "$taskUrl/api/health" -TimeoutSec 2
  if ($taskHealth.app -ne 'zhiban-offline') { throw 'Unexpected local service' }
  Invoke-RestMethod -Uri "$taskUrl/api/shutdown" -Method Post -Headers @{ Origin = $taskUrl } -TimeoutSec 3 | Out-Null
  Write-Output 'Companion stopped.'
} catch { Write-Output 'Companion is not running, or could not be stopped.' }
