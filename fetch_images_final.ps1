# Final pass: hand-picked English keywords. ASCII-only source.
#
# Usage:
#   $env:SUPABASE_SERVICE_KEY = "sb_secret_..."
#   $env:PIXABAY_API_KEY      = "55732302-..."
#   .\fetch_images_final.ps1

$ErrorActionPreference = "Stop"
if (-not $env:SUPABASE_SERVICE_KEY) { Write-Host "Set SUPABASE_SERVICE_KEY"; exit 1 }
if (-not $env:PIXABAY_API_KEY) { Write-Host "Set PIXABAY_API_KEY"; exit 1 }

$projectRef = "kaqyumwuwcgusibelcju"
$supabaseUrl = "https://$projectRef.supabase.co"
$serviceKey = $env:SUPABASE_SERVICE_KEY
$pixabayKey = $env:PIXABAY_API_KEY
$ua = "Conspira-Image-Final/1.0"

$map = @{}
$map['Monkeypox Exercise 2021'] = 'biohazard laboratory'
$map['Akashic Records'] = 'ancient library'
$map['Anunnaki / Sitchin Hypothesis'] = 'sumerian artifact'
$map['Antarctica Expeditions'] = 'antarctica ice'
$map['Antarctica Secret'] = 'antarctica iceberg'
$map['Apocrypha Conspiracy'] = 'ancient scroll'
$map['Archons (Gnosis)'] = 'gnostic symbol'
$map['Avicii'] = 'dj concert'
$map['Abolition of Cash'] = 'cash money'
$map['BCCI Scandal'] = 'bank vault'
$map['Population Reduction'] = 'crowd people'
$map['BlackRock/Vanguard Control Everything'] = 'wall street'
$map['Chupacabra'] = 'desert night creature'
$map['COINTELPRO'] = 'surveillance file'
$map['Dinosaur Forgery'] = 'dinosaur fossil'
$map['Staged Third World War'] = 'war soldiers'
$map['Eminem Is a Clone'] = 'rap microphone'
$map['EMP Attack'] = 'lightning city'
$map['Freemason Conspiracy'] = 'masonic symbol'
$map['GcMAF Miracle Cure'] = 'medicine vial'
$map['Log Killer'] = 'forest road night'
$map['Hyperborea'] = 'frozen mountain'
$map['IMF/World Bank as Tools'] = 'world bank'
$map['Jesuit Conspiracy'] = 'vatican priest'
$map['Climate Dictatorship'] = 'climate protest'
$map['Cancer is Curable (B17/Vitamin C)'] = 'vitamin medicine'
$map['Litvinenko'] = 'spy poison'
$map['Lockerbie Alternatives'] = 'airplane debris'
$map['Mokele Mbembe'] = 'jungle congo'
$map['Moon Cult'] = 'moon ritual'
$map['Monsanto/Bayer - Glyphosate'] = 'agriculture spraying'
$map['Morgellons'] = 'fiber microscope'
$map['Mothman'] = 'bridge fog'
$map['Mudflood'] = 'flooded building'
$map['Plandemic'] = 'pandemic mask'
$map['Pleiadians'] = 'stars galaxy'
$map['Pole Shift'] = 'magnetic earth'
$map['Skull Deformation'] = 'skull ancient'
$map['Shadow Government'] = 'shadow figure suit'
$map['Skripal Poisoning'] = 'poison vial'
$map['Solar Maximum Extinction'] = 'solar flare'
$map['Tartaria'] = 'old empire architecture'
$map['Excess Mortality Conspiracy'] = 'cemetery graves'
$map['VAIDS'] = 'vaccine syringe'
$map['US Election Fraud 2020'] = 'voting ballot'
$map['Election Fraud US 2024'] = 'polling station'
# JonBenet variants (encoding-mangled in DB)
$map['JonBenet Ramsey'] = 'police tape'

Write-Host "Fetching theories still without image..." -ForegroundColor Cyan
$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title,title_en&image_url=is.null" `
    -UserAgent $ua `
    -Headers @{
        "apikey" = $serviceKey
        "Authorization" = "Bearer $serviceKey"
    }

$total = $resp.Count
Write-Host "$total theories. Hand-picking keywords..." -ForegroundColor Yellow
Write-Host ""

$ok = 0
$miss = 0
$i = 0
foreach ($theory in $resp) {
    $i++
    $shortTitle = $theory.title
    if ($shortTitle.Length -gt 50) { $shortTitle = $shortTitle.Substring(0, 50) + "..." }

    $kw = $null
    if ($theory.title_en) {
        $kw = $map[$theory.title_en]
        # Also try ASCII-only version (strips any non-ASCII chars)
        if (-not $kw) {
            $cleanBytes = [System.Text.Encoding]::ASCII.GetBytes($theory.title_en)
            $cleanEn = [System.Text.Encoding]::ASCII.GetString($cleanBytes) -replace '\?',''
            $cleanEn = $cleanEn -replace '\s+',' '
            $kw = $map[$cleanEn.Trim()]
        }
    }

    if (-not $kw) {
        Write-Host "[$i/$total] $shortTitle" -ForegroundColor Gray
        Write-Host "    NO MAPPING for title_en=$($theory.title_en)" -ForegroundColor DarkYellow
        $miss++
        continue
    }

    Write-Host "[$i/$total] $shortTitle" -ForegroundColor Gray
    Write-Host "    Search: $kw" -ForegroundColor DarkGray

    try {
        $encodedKw = [System.Web.HttpUtility]::UrlEncode($kw)
        $amp = [char]38
        $pixUrl = 'https://pixabay.com/api/?key=' + $pixabayKey + $amp + 'q=' + $encodedKw + $amp + 'image_type=photo' + $amp + 'orientation=horizontal' + $amp + 'safesearch=true' + $amp + 'per_page=3'
        $pixResp = Invoke-RestMethod -Uri $pixUrl -UserAgent $ua

        if ($pixResp.hits -and $pixResp.hits.Count -gt 0) {
            $imageUrl = $pixResp.hits[0].largeImageURL
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
            Write-Host "    MISS" -ForegroundColor Yellow
            $miss++
        }
    } catch {
        Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 700
}

Write-Host ""
Write-Host "Done. $ok newly filled, $miss still without." -ForegroundColor Cyan
