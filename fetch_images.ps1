# Bulk-fetch theory images from Pixabay API and write to theories.image_url.
# Pixabay images are free for commercial use without attribution.
#
# Usage:
#   $env:SUPABASE_SERVICE_KEY = "sb_secret_..."
#   $env:PIXABAY_API_KEY      = "12345678-abc..."  # from pixabay.com/api/docs/
#   .\fetch_images.ps1
#
# About one second per theory (Pixabay rate limits at 100 req/min).

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "Set `$env:SUPABASE_SERVICE_KEY first." -ForegroundColor Red
    exit 1
}
if (-not $env:PIXABAY_API_KEY) {
    Write-Host "Set `$env:PIXABAY_API_KEY first." -ForegroundColor Red
    exit 1
}

$projectRef = "kaqyumwuwcgusibelcju"
$supabaseUrl = "https://$projectRef.supabase.co"
$serviceKey = $env:SUPABASE_SERVICE_KEY
$pixabayKey = $env:PIXABAY_API_KEY
$ua = "Conspira-Image-Fetch/1.0"

# Manual keyword mapping — same as unsplash_keywords.md but trimmed for API.
# This is a subset; the full mapping is generated dynamically below.
$keywords = @{
    'Mondlandung gefälscht' = 'astronaut moon'
    'Stanley-Kubrick-Geständnis' = 'film studio camera'
    'Mars-Anomalien' = 'mars surface'
    'ISS existiert nicht' = 'space station'
    'Satelliten existieren nicht' = 'satellite earth'
    'Flache Erde' = 'earth horizon'
    'Hohle Erde' = 'cave underground'
    'JFK-Attentat' = 'kennedy president'
    '9/11 als Inside Job' = 'manhattan skyline'
    'Area 51' = 'desert highway'
    'Roswell-Vorfall (1947)' = 'desert mountains'
    'Bigfoot / Sasquatch' = 'forest mist'
    'Loch Ness Monster' = 'scotland lake'
    'Bermuda-Dreieck' = 'ocean storm'
    'Chemtrails' = 'contrails sky'
    'HAARP' = 'antenna array'
    'CERN öffnet Dimensionen' = 'particle accelerator'
    'Tesla unterdrückt' = 'tesla coil'
    'Vatikan als Machtzentrale' = 'vatican rome'
    'Bilderberg-Konferenz' = 'luxury hotel'
    'WEF / Great Reset' = 'davos alps'
    'Illuminaten' = 'all seeing eye'
    'Skull and Bones' = 'yale gothic'
    'Bohemian Grove' = 'redwood forest'
    'Watergate als Spitze des Eisbergs' = 'white house'
    'MK Ultra' = 'psychology vintage'
    'Operation Northwoods' = 'classified document'
    'Operation Paperclip' = 'rocket vintage'
    'Lady Diana ermordet' = 'paris bridge'
    'Princess Diana wusste zu viel' = 'royal palace'
    'Elvis lebt' = 'las vegas'
    'Tupac lebt' = 'rapper bandana'
    'Michael Jackson lebt' = 'concert spotlight'
    'Bruce Lee ermordet' = 'martial arts'
    'Marilyn Monroe ermordet' = 'hollywood vintage'
    'Pyramiden als Energiegeneratoren' = 'egypt pyramid'
    'Atlantis' = 'underwater ruins'
    'Stonehenge-Energienetz' = 'stonehenge england'
    'Easter Island Statuen' = 'easter island moai'
    'Sphinx-Geheimkammer' = 'sphinx desert'
}

# Build a fallback keyword from the title (strip suffixes, take first noun)
function Get-FallbackKeyword($title) {
    $kw = $title.ToLower()
    $kw = $kw -replace '[\(\)\.\d]', ''
    $kw = $kw -replace '\s+', ' '
    $kw = $kw.Trim()
    # Take first 3 words
    $words = $kw -split ' ' | Where-Object { $_.Length -gt 2 } | Select-Object -First 3
    return ($words -join ' ').Trim()
}

# Fetch theories that don't yet have an image
Write-Host "Fetching theories without image_url..." -ForegroundColor Cyan
$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title&image_url=is.null" `
    -UserAgent $ua `
    -Headers @{
        "apikey" = $serviceKey
        "Authorization" = "Bearer $serviceKey"
    }

$total = $resp.Count
Write-Host "$total theories need images." -ForegroundColor Yellow
Write-Host ""

$ok = 0
$miss = 0
$i = 0
foreach ($theory in $resp) {
    $i++
    $shortTitle = if ($theory.title.Length -gt 50) { $theory.title.Substring(0, 50) + "..." } else { $theory.title }

    # Pick keyword
    $kw = $keywords[$theory.title]
    if (-not $kw) { $kw = Get-FallbackKeyword $theory.title }

    Write-Host "[$i/$total] $shortTitle" -ForegroundColor Gray
    Write-Host "    Search: '$kw'" -ForegroundColor DarkGray

    try {
        $encodedKw = [System.Web.HttpUtility]::UrlEncode($kw)
        $pixResp = Invoke-RestMethod `
            -Uri "https://pixabay.com/api/?key=$pixabayKey&q=$encodedKw&image_type=photo&orientation=horizontal&safesearch=true&per_page=3" `
            -UserAgent $ua

        if ($pixResp.hits -and $pixResp.hits.Count -gt 0) {
            $imageUrl = $pixResp.hits[0].largeImageURL

            # Patch the theory
            $patchBody = @{ image_url = $imageUrl } | ConvertTo-Json
            $patchBytes = [System.Text.Encoding]::UTF8.GetBytes($patchBody)
            Invoke-RestMethod `
                -Uri "$supabaseUrl/rest/v1/theories?id=eq.$($theory.id)" `
                -Method Patch `
                -UserAgent $ua `
                -Headers @{
                    "apikey" = $serviceKey
                    "Authorization" = "Bearer $serviceKey"
                    "Content-Type" = "application/json; charset=utf-8"
                    "Prefer" = "return=minimal"
                } `
                -Body $patchBytes | Out-Null

            Write-Host "    OK -> $imageUrl" -ForegroundColor Green
            $ok++
        } else {
            Write-Host "    MISS (no Pixabay results)" -ForegroundColor Yellow
            $miss++
        }
    } catch {
        Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 700
}

Write-Host ""
Write-Host "Done. $ok with image, $miss without. Run again to retry the rest." -ForegroundColor Cyan
