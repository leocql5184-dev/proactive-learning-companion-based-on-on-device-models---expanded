@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-llm\Start-Desktop.ps1" -Backend mindspore
if errorlevel 1 pause
