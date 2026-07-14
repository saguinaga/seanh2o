# Deploy Blossom AI proxy to Cloudflare Workers (grok-4.5-latest)
# Uses Grok OAuth token from ~/.grok/auth.json — or set XAI_API_KEY env var
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  $token = $env:XAI_API_KEY
  if (-not $token) {
    $token = node (Join-Path $PSScriptRoot 'refresh-xai-token.mjs') 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host $token; exit 1 }
  }
  if (-not $token) {
    Write-Host 'Set XAI_API_KEY or log into Grok CLI (auth.json)' -ForegroundColor Yellow
    exit 1
  }
  $token | npx wrangler secret put XAI_API_KEY --temporary --name blossom-ai-proxy
  npx wrangler deploy --temporary --name blossom-ai-proxy
  Start-Sleep -Seconds 2
  $health = Invoke-RestMethod 'https://blossom-ai-proxy.smart-horse.workers.dev/health'
  if ($health.ai -and $health.model -like 'grok-4.5*') {
    Write-Host 'OK —' $health.model 'live at https://blossom-ai-proxy.smart-horse.workers.dev' -ForegroundColor Green
  } else {
    Write-Host 'Deployed but health check failed:' ($health | ConvertTo-Json -Compress) -ForegroundColor Red
    exit 1
  }
} finally {
  Pop-Location
}