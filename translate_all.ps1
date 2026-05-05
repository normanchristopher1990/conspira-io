# Bulk-translate all theories that don't yet have title_en / title_de
# populated. Calls the translate-theory edge function for each one,
# spaced out to avoid rate-limit issues.
#
# Usage:
#   1. Get your Supabase service role key from
#      https://supabase.com/dashboard/project/kaqyumwuwcgusibelcju/settings/api
#      (Settings -> API -> service_role key, NOT the anon key)
#   2. Run this in PowerShell:
#        $env:SUPABASE_SERVICE_KEY = "eyJhbGc..."
#        .\translate_all.ps1
#
# Cost: ~388 theories x ~1000 tokens = ~$3-5 in Claude API costs.

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "Set `$env:SUPABASE_SERVICE_KEY first." -ForegroundColor Red
    Write-Host "Get it from: https://supabase.com/dashboard/project/kaqyumwuwcgusibelcju/settings/api"
    exit 1
}

$projectRef = "kaqyumwuwcgusibelcju"
$supabaseUrl = "https://$projectRef.supabase.co"
$serviceKey = $env:SUPABASE_SERVICE_KEY

# Fetch all theory ids that still need translation.
# UserAgent must NOT look like a browser — Supabase blocks secret keys
# from any client that looks like one (Mozilla/Chrome/etc).
$ua = "Conspira-Translate-Script/1.0"

Write-Host "Fetching untranslated theories..." -ForegroundColor Cyan
$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title&title_en=is.null" `
    -UserAgent $ua `
    -Headers @{
        "apikey" = $serviceKey
        "Authorization" = "Bearer $serviceKey"
    }

$total = $resp.Count
Write-Host "$total theories to translate." -ForegroundColor Yellow
Write-Host ""

$i = 0
foreach ($theory in $resp) {
    $i++
    $shortTitle = if ($theory.title.Length -gt 50) { $theory.title.Substring(0, 50) + "..." } else { $theory.title }
    Write-Host "[$i/$total] $shortTitle" -ForegroundColor Gray

    try {
        $body = @{ theory_id = $theory.id } | ConvertTo-Json
        Invoke-RestMethod `
            -Uri "$supabaseUrl/functions/v1/translate-theory" `
            -Method Post `
            -UserAgent $ua `
            -Headers @{
                "apikey" = $serviceKey
                "Authorization" = "Bearer $serviceKey"
                "Content-Type" = "application/json"
            } `
            -Body $body | Out-Null
        Write-Host "    OK" -ForegroundColor Green
    } catch {
        Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Pace requests so we don't hit rate limits (Claude API + Supabase Edge)
    Start-Sleep -Milliseconds 800
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
