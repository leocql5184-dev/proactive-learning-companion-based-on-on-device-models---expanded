@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-llm\Start-Desktop.ps1" -Backend gguf
if errorlevel 1 pause
