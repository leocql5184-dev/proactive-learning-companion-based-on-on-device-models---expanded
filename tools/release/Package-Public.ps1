param([switch]$IncludeRuntime, [string]$OutputDirectory = 'outputs/public-release')
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskNode = Join-Path $taskRoot 'tools/local-llm/node/node.exe'
if (-not (Test-Path -LiteralPath $taskNode)) { $taskNode = (Get-Command node -ErrorAction Stop).Source }
$taskArgs = @((Join-Path $PSScriptRoot 'stage-public.cjs'))
$taskArgs += @('--output-dir', $OutputDirectory)
if ($IncludeRuntime) { $taskArgs += '--runtime' }
& $taskNode @taskArgs
if ($LASTEXITCODE -ne 0) { throw 'Public export failed.' }
$taskName = if ($IncludeRuntime) { 'windows-gguf' } else { 'source' }
$taskOutput = [IO.Path]::GetFullPath((Join-Path $taskRoot $OutputDirectory))
$taskStage = Join-Path $taskOutput $taskName
$taskZip = Join-Path $taskOutput "zhiban-$taskName.zip"
if (Test-Path -LiteralPath $taskZip) { throw 'ZIP already exists; move it aside before packaging.' }
Compress-Archive -Path (Join-Path $taskStage '*') -DestinationPath $taskZip -CompressionLevel Optimal
# PowerShell Compress-Archive skips hidden files; add them explicitly through .NET.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskArchive = [IO.Compression.ZipFile]::Open($taskZip, [IO.Compression.ZipArchiveMode]::Update)
try {
  Get-ChildItem -LiteralPath $taskStage -Recurse -File -Force | ForEach-Object {
    $taskRelative = $_.FullName.Substring($taskStage.Length + 1).Replace('\','/')
    if (-not $taskArchive.GetEntry($taskRelative)) { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskArchive, $_.FullName, $taskRelative) | Out-Null }
  }
} finally { $taskArchive.Dispose() }
$taskHash = (Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash.ToLowerInvariant()
"$taskHash  $([IO.Path]::GetFileName($taskZip))" | Set-Content -LiteralPath "$taskZip.sha256" -Encoding UTF8
Write-Output "Ready: $taskZip"
