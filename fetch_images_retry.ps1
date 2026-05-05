# Retry pass for theories that didn't get an image on the first run.
# Uses the English title (title_en) as the search keyword, which gives
# Pixabay much better matches than the German original.
#
# Usage:
#   $env:SUPABASE_SERVICE_KEY = "sb_secret_..."
#   $env:PIXABAY_API_KEY      = "55732302-..."
#   .\fetch_images_retry.ps1

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
$ua = "Conspira-Image-Fetch/1.1"

# Strip generic noise so the keyword is just the topic.
function Get-SearchKeyword($titleEn, $titleDe) {
    $src = if ($titleEn) { $titleEn } else { $titleDe }
    $kw = $src.ToLower()
    $kw = $kw -replace '[\(\)\.\,\:\;\d]', ''
    $kw = $kw -replace '\s+', ' '
    # Drop weak filler words that confuse image search
    $stopwords = @('the','a','an','is','are','was','were','as','of','for','in','on','at','to','from','by','with','and','or','but','that','this','these','those','it','its','their','them','they','he','she','his','her','our','your','my','exists','existed','not','no','do','does','did','behind','about','against','during','through','operation','project','program','known','said','called','allegedly','supposedly','really','actually')
    $words = ($kw -split ' ' | Where-Object { $_.Length -gt 2 -and $stopwords -notcontains $_ })
    # Take the first 3 meaningful words
    $picked = $words | Select-Object -First 3
    return ($picked -join ' ').Trim()
}

Write-Host "Fetching theories still missing an image..." -ForegroundColor Cyan
$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title,title_en&image_url=is.null" `
    -UserAgent $ua `
    -Headers @{
        "apikey" = $serviceKey
        "Authorization" = "Bearer $serviceKey"
    }

$total = $resp.Count
Write-Host "$total theories still without image." -ForegroundColor Yellow
Write-Host ""

$ok = 0
$miss = 0
$i = 0
foreach ($theory in $resp) {
    $i++
    $shortTitle = if ($theory.title.Length -gt 50) { $theory.title.Substring(0, 50) + "..." } else { $theory.title }

    $kw = Get-SearchKeyword $theory.title_en $theory.title

    Write-Host "[$i/$total] $shortTitle" -ForegroundColor Gray
    Write-Host "    Search: '$kw'" -ForegroundColor DarkGray

    try {
        $encodedKw = [System.Web.HttpUtility]::UrlEncode($kw)
        $pixResp = Invoke-RestMethod `
            -Uri "https://pixabay.com/api/?key=$pixabayKey&q=$encodedKw&image_type=photo&orientation=horizontal&safesearch=true&per_page=3" `
            -UserAgent $ua

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
            # Second pass: try just the first 2 words
            $shortKw = ($kw -split ' ' | Select-Object -First 2) -join ' '
            if ($shortKw -ne $kw -and $shortKw.Length -gt 2) {
                Write-Host "    Retry: '$shortKw'" -ForegroundColor DarkYellow
                $encodedKw2 = [System.Web.HttpUtility]::UrlEncode($shortKw)
                $pixResp2 = Invoke-RestMethod `
                    -Uri "https://pixabay.com/api/?key=$pixabayKey&q=$encodedKw2&image_type=photo&orientation=horizontal&safesearch=true&per_page=3" `
                    -UserAgent $ua
                if ($pixResp2.hits -and $pixResp2.hits.Count -gt 0) {
                    $imageUrl = $pixResp2.hits[0].largeImageURL
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
            } else {
                Write-Host "    MISS (no Pixabay results)" -ForegroundColor Yellow
                $miss++
            }
        }
    } catch {
        Write-Host "    FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 700
}

Write-Host ""
Write-Host "Done. $ok newly filled, $miss still without." -ForegroundColor Cyan
