param([string]$Python = 'python',
      [ValidateSet(128,2048)][int]$Context = 2048)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $taskRoot
$taskOldPath = $env:PATH
$taskOldPythonPath = $env:PYTHONPATH
try {
    $taskOut = "outputs/qwen-ms/context$Context"
    $taskModel = "qwen3-0.6b-context$Context"
    & $Python -u tools/model-conversion/export_qwen.py --context $Context --output "$taskOut/onnx"
    if ($LASTEXITCODE -ne 0) { throw 'Qwen ONNX export failed' }
    $taskLite = Join-Path $PSScriptRoot 'mindspore-lite-2.7.0-win-x64'
    $env:PATH = "$taskLite/tools/converter/lib;$PSScriptRoot/mingw-compatible;$taskOldPath"
    & "$taskLite/tools/converter/converter/converter_lite.exe" --fmk=ONNX "--modelFile=$taskOut/onnx/qwen.onnx" "--outputFile=$taskOut/$taskModel" --fp16=on *> "$taskOut/converter.log"
    if ($LASTEXITCODE -ne 0) { throw 'Qwen MindSpore Lite conversion failed; inspect converter-final.log' }
    $env:PYTHONPATH = "$PSScriptRoot/qwen-python;$PSScriptRoot/python"
    & $Python tools/model-conversion/qwen_tokenizer.py "$taskOut/tokenizer.json"
    if ($LASTEXITCODE -ne 0) { throw 'Tokenizer export failed' }
    & $Python -u tools/model-conversion/verify_qwen.py --onnx --tokens 64 --context $Context --out $taskOut --onnx-dir onnx --model "$taskModel.ms" *> "$taskOut/verification.log"
    if ($LASTEXITCODE -ne 0) { throw 'Qwen verification failed; artifact is NOT accepted. Inspect verification-final.log' }
    Get-Content "$taskOut/verification.log" -Tail 8
    Write-Output "Accepted: $taskOut/$taskModel.ms; details: $taskOut/verification.json"
} finally {
    $env:PATH = $taskOldPath
    $env:PYTHONPATH = $taskOldPythonPath
    Pop-Location
}
