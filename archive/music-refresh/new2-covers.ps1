$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$outDir = 'C:\Users\qsr\night-web\album-covers'
$raw = (Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-details.json' -Raw) -replace '^\uFEFF', ''
$rows = $raw | ConvertFrom-Json
$new = 0; $have = 0; $fail = 0; $map = @()
foreach ($r in $rows) {
  $file = $r.pic.Split('/')[-1]
  $dest = Join-Path $outDir $file
  if (Test-Path $dest) { $have++ } else {
    $ok = $false
    for ($t = 0; $t -lt 4; $t++) {
      try {
        $u = $r.pic + '?param=500y500'
        Invoke-WebRequest -Uri $u -Headers $hdr -OutFile $dest -TimeoutSec 30
        $ok = $true; break
      } catch { Start-Sleep -Milliseconds (800 * ($t + 1)) }
    }
    if ($ok) { $new++ } else { $fail++; "FAIL $file" }
    Start-Sleep -Milliseconds 150
  }
  $map += [PSCustomObject]@{ songId="$($r.id)"; title=$r.name; artist=$r.artist; album=$r.album; albumId=$r.albumId; cover=$file }
}
$map | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-covers.json' -Encoding UTF8
"covers: existing=$have new=$new fail=$fail"