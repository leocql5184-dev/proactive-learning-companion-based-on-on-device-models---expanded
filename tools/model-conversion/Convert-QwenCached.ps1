param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskOldPath = $env:PATH
$taskOldEncoding = $env:PYTHONIOENCODING
$taskOldPythonPath = $env:PYTHONPATH
Push-Location $taskRoot
try {
  $env:PYTHONIOENCODING = 'utf-8'
  $taskLite = Join-Path $PSScriptRoot 'mindspore-lite-2.7.0-win-x64'
  $env:PATH = "$taskLite/tools/converter/lib;$PSScriptRoot/mingw-compatible;$taskOldPath"
  foreach ($taskMode in @('prefill','decode')) {
    & $Python -u tools/model-conversion/export_qwen.py --context 2048 --mode $taskMode --output "outputs/qwen-ms/kv2048/$taskMode-onnx"
    if ($LASTEXITCODE -ne 0) { throw "$taskMode ONNX export failed" }
    & "$taskLite/tools/converter/converter/converter_lite.exe" --fmk=ONNX "--modelFile=outputs/qwen-ms/kv2048/$taskMode-onnx/qwen.onnx" "--outputFile=outputs/qwen-ms/kv2048/qwen-$taskMode" --fp16=on *> "outputs/qwen-ms/kv2048/convert-$taskMode.log"
    if ($LASTEXITCODE -ne 0) { throw "$taskMode conversion failed" }
  }
  & $Python -u tools/model-conversion/export_qwen.py --context 2048 --output outputs/qwen-ms/context2048/onnx
  if ($LASTEXITCODE -ne 0) { throw 'Reference ONNX export failed' }
  $env:PYTHONPATH = "$PSScriptRoot/qwen-python;$PSScriptRoot/python"
  & $Python tools/model-conversion/qwen_tokenizer.py outputs/qwen-ms/context2048/tokenizer.json
  if ($LASTEXITCODE -ne 0) { throw 'Tokenizer export failed' }
  & $Python -u tools/model-conversion/verify_cached_qwen.py *> outputs/qwen-ms/kv2048/verification.log
  if ($LASTEXITCODE -ne 0) { throw 'Verification failed; do not deliver these models' }
  Write-Output 'Verified cached models: outputs/qwen-ms/kv2048'
} finally {
  $env:PATH = $taskOldPath
  $env:PYTHONIOENCODING = $taskOldEncoding
  $env:PYTHONPATH = $taskOldPythonPath
  Pop-Location
}
