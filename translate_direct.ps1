# Direct translation script — calls Anthropic API directly and writes
# back to Supabase via REST. Bypasses the Edge Function entirely.
#
# Usage:
#   $env:SUPABASE_SERVICE_KEY = "sb_secret_..."     # from Supabase Settings -> API
#   $env:ANTHROPIC_API_KEY    = "sk-ant-api03-..."  # from console.anthropic.com/settings/keys
#   .\translate_direct.ps1

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "Set `$env:SUPABASE_SERVICE_KEY first." -ForegroundColor Red
    exit 1
}
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "Set `$env:ANTHROPIC_API_KEY first." -ForegroundColor Red
    exit 1
}

$projectRef = "kaqyumwuwcgusibelcju"
$supabaseUrl = "https://$projectRef.supabase.co"
$serviceKey = $env:SUPABASE_SERVICE_KEY
$anthropicKey = $env:ANTHROPIC_API_KEY
$ua = "Conspira-Translate-Direct/1.0"

# Translation system prompt — produces JSON with all 4 fields.
# Strict instructions to return raw JSON only (no markdown wrappers).
$systemPrompt = @"
You translate conspiracy-theory titles and summaries for Conspira, a
scientific catalogue. Given a title and summary in either English or
German, return clean versions in BOTH languages.

Auto-detect the source language. The side matching the source can be
near-identical to the original (only minor polish if needed for tone).

Rules:
- Preserve proper nouns: CIA, NSA, FBI, MI5, MKUltra, COINTELPRO, PRISM, NASA, JFK, etc.
- Preserve all numbers, dates, statistics exactly.
- Match a neutral, scientific tone. No editorialising or hedging.
- Use straight quotes only inside string values. NEVER use backticks or smart quotes.
- Escape any double-quote inside a value as \".

CRITICAL: respond with a single valid JSON object and nothing else.
No markdown fences, no prose, no leading/trailing whitespace.
Format exactly:
{"title_en":"...","title_de":"...","summary_en":"...","summary_de":"..."}
"@

Write-Host "Fetching untranslated theories..." -ForegroundColor Cyan
$resp = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/theories?select=id,title,summary&title_en=is.null" `
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
        $userMsg = "Title: $($theory.title)`nSummary: $($theory.summary)"

        $anthropicBody = @{
            model = "claude-sonnet-4-6"
            max_tokens = 1024
            system = $systemPrompt
            messages = @(
                @{ role = "user"; content = $userMsg }
            )
        } | ConvertTo-Json -Depth 10

        # Force UTF-8 bytes — PowerShell otherwise mangles German umlauts as UTF-16 surrogates
        $anthropicBytes = [System.Text.Encoding]::UTF8.GetBytes($anthropicBody)

        $aiResp = Invoke-RestMethod `
            -Uri "https://api.anthropic.com/v1/messages" `
            -Method Post `
            -Headers @{
                "x-api-key" = $anthropicKey
                "anthropic-version" = "2023-06-01"
                "content-type" = "application/json; charset=utf-8"
            } `
            -Body $anthropicBytes

        $jsonText = $aiResp.content[0].text
        # Some models wrap in code fences — strip them
        $jsonText = $jsonText -replace '^```json', '' -replace '^```', '' -replace '```$', ''
        $jsonText = $jsonText.Trim()

        $translation = $jsonText | ConvertFrom-Json

        $patchBody = @{
            title_en = $translation.title_en
            title_de = $translation.title_de
            summary_en = $translation.summary_en
            summary_de = $translation.summary_de
        } | ConvertTo-Json

        # Same UTF-8 fix for the PATCH body
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

        Write-Host "    OK" -ForegroundColor Green
    } catch {
        $msg = $_.Exception.Message
        # Try to extract response body for clearer diagnostics
        $body = ""
        try {
            $resp = $_.Exception.Response
            if ($resp) {
                $stream = $resp.GetResponseStream()
                $stream.Position = 0
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
            }
        } catch {}
        Write-Host "    FAIL: $msg" -ForegroundColor Red
        if ($body) {
            $snip = if ($body.Length -gt 200) { $body.Substring(0, 200) + "..." } else { $body }
            Write-Host "    Body: $snip" -ForegroundColor DarkRed
        }
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
