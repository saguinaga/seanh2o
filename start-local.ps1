# Easy launcher for the local version of the site.
# IMPORTANT: In PowerShell, you must run it with .\  (dot-slash)
#   .\start-local.ps1
#
# Or right-click the file > "Run with PowerShell"
#
# It starts browser-sync with live reload and tries to open directly to the calculator.
#
# If you see the "BrowserSync" control panel instead of the site:
#   1. Look in this terminal for the line that says "Local: http://localhost:XXXX/#buy-hold-calculator"
#   2. Copy and paste that URL into your browser.
#   3. Hard refresh the page (Ctrl + Shift + R)
#
# Never double-click index.html directly (that uses file:// and breaks things).

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Starting local dev server for seanh2o..." -ForegroundColor Cyan
Write-Host "Look for the 'Local:' URL in the output below." -ForegroundColor Cyan
Write-Host "If browser opens the wrong window, manually copy the Local URL." -ForegroundColor Yellow
Write-Host "Edit any file and it should reload automatically." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C here to stop." -ForegroundColor Yellow
Write-Host ""

npm run dev
