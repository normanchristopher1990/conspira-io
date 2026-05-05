# Just list the theories still without image_url, with their English title.

$ErrorActionPreference = "Stop"
if (-not $env:SUPABASE_SERVICE_KEY) { Write-Host "Set SUPABASE_SERVICE_KEY"; exit 1 }

$projectRef = "kaqyumwuwcgusibelcju"
$supabaseUrl = "https://$projectRef.supabase.co"
$ua = "Conspira-List/1.0"

$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title,title_en&image_url=is.null&order=title" `
    -UserAgent $ua `
    -Headers @{
        "apikey" = $env:SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $($env:SUPABASE_SERVICE_KEY)"
    }

Write-Host "$($resp.Count) theories without image:" -ForegroundColor Cyan
Write-Host ""
foreach ($t in $resp) {
    $de = if ($t.title.Length -gt 45) { $t.title.Substring(0,45) + "..." } else { $t.title }
    $en = if ($t.title_en) { $t.title_en } else { "(no EN)" }
    if ($en.Length -gt 45) { $en = $en.Substring(0,45) + "..." }
    Write-Host ("  {0,-50} | {1}" -f $de, $en)
}
