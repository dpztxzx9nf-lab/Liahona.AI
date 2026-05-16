Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Require-File {
  param([string] $Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Required file is missing: $Path"
  }
}

Write-Host "Checking Liahona.AI public surface..." -ForegroundColor Cyan

Require-File "index.html"
Require-File "style.css"
Require-File "src\artifact.js"
Require-File "assets\liahona-artifact.jpeg"

node --check src\artifact.js
git diff --check

$Index = Get-Content -Raw -LiteralPath "index.html"

if ($Index -notmatch 'src="src/artifact\.js"') {
  throw "index.html does not load src/artifact.js"
}

if ($Index -notmatch 'href="style\.css"') {
  throw "index.html does not load style.css"
}

if ($Index -notmatch 'assets/liahona-artifact\.jpeg') {
  throw "index.html does not reference the canonical artifact image"
}

if ($Index -notmatch 'data-continuity-device') {
  throw "Continuity Device markup is missing"
}

Write-Host "Checks passed." -ForegroundColor Green
