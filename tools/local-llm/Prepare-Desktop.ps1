$ErrorActionPreference = 'Stop'
if (-not [Environment]::Is64BitOperatingSystem) { throw 'Windows x64 is required.' }
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskManifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime-manifest.json') -Raw | ConvertFrom-Json
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Get-VerifiedFile($taskUrl, $taskPath, $taskHash) {
  if (Test-Path -LiteralPath $taskPath) {
    if ((Get-FileHash -LiteralPath $taskPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $taskHash) { return }
    throw "Checksum mismatch: $taskPath. Move the damaged file aside and retry."
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $taskPath) | Out-Null
  $taskPart = "$taskPath.part"
  Write-Output "Downloading $taskUrl"
  Invoke-WebRequest -UseBasicParsing -Uri $taskUrl -OutFile $taskPart
  if ((Get-FileHash -LiteralPath $taskPart -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash) { throw "Downloaded file checksum mismatch: $taskPart" }
  Move-Item -LiteralPath $taskPart -Destination $taskPath
}
$taskZip = Join-Path $PSScriptRoot 'windows-cpu.zip'
Get-VerifiedFile $taskManifest.engine.url $taskZip $taskManifest.engine.sha256
$taskRuntime = Join-Path $taskRoot $taskManifest.engine.directory
Expand-Archive -LiteralPath $taskZip -DestinationPath $taskRuntime -Force
if (-not (Test-Path -LiteralPath (Join-Path $taskRuntime 'llama-server.exe'))) { throw 'Unexpected engine archive layout.' }
$taskHashes = [ordered]@{}
Get-ChildItem -LiteralPath $taskRuntime -File | Where-Object { $_.Extension -in '.exe','.dll' } | ForEach-Object {
  $taskHashes[$_.Name] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
}
$taskHashes | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRuntime 'verified-files.json') -Encoding UTF8
Get-VerifiedFile $taskManifest.model.url (Join-Path $taskRoot $taskManifest.model.path) $taskManifest.model.sha256
Write-Output 'GGUF model and Windows CPU engine verified. Install Node.js 22+ if needed, then open the companion launcher.'
