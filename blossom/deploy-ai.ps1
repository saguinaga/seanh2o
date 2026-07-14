# Deploy Blossom Grok 4.5 edge function to Supabase (one-time + on updates)
# Requires: npx supabase CLI, Supabase access token, xAI API key

$ErrorActionPreference = 'Stop'
$ProjectRef = 'mtqezgchhggmlrfzfyjb'

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "Log in first: npx supabase login" -ForegroundColor Yellow
  Write-Host "Or set SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens"
  exit 1
}

if (-not $env:XAI_API_KEY) {
  $envFile = Join-Path $PSScriptRoot '.env'
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^\s*XAI_API_KEY\s*=\s*(.+)\s*$') { $env:XAI_API_KEY = $Matches[1].Trim() }
    }
  }
}

if (-not $env:XAI_API_KEY -or $env:XAI_API_KEY -eq 'your_key_here') {
  Write-Host "Set XAI_API_KEY env var or add it to blossom/.env" -ForegroundColor Yellow
  exit 1
}

Push-Location (Join-Path $PSScriptRoot '..')
try {
  npx supabase secrets set "XAI_API_KEY=$($env:XAI_API_KEY)" --project-ref $ProjectRef
  npx supabase functions deploy blossom-ai --no-verify-jwt --project-ref $ProjectRef
  Start-Sleep -Seconds 3
  $health = Invoke-RestMethod "https://$ProjectRef.supabase.co/functions/v1/blossom-ai/health"
  if ($health.model -like 'grok-4.5*') {
    Write-Host "OK — $($health.model) live at /functions/v1/blossom-ai" -ForegroundColor Green
  } else {
    Write-Host "Deployed but health check unexpected:" ($health | ConvertTo-Json -Compress)
    exit 1
  }
} finally {
  Pop-Location
}