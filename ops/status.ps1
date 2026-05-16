Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "Liahona.AI status" -ForegroundColor Cyan
Write-Host ""

Write-Host "Repository:" -ForegroundColor DarkCyan
Write-Host $RepoRoot
Write-Host ""

Write-Host "Git branch:" -ForegroundColor DarkCyan
git branch --show-current
Write-Host ""

Write-Host "Working tree:" -ForegroundColor DarkCyan
git status --short
Write-Host ""

Write-Host "Public surface files:" -ForegroundColor DarkCyan
Get-Item index.html, style.css, src\artifact.js, assets\liahona-artifact.jpeg |
  Select-Object Name, Length, LastWriteTime |
  Format-Table -AutoSize
