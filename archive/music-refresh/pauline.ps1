$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$queries = @('Pauline Herr', 'Slow Down Madnap Pauline Herr', 'Madnap Pauline Herr')
$out = New-Object System.Collections.ArrayList
foreach ($q in $queries) {
  $songs = @()
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $q; type = '1'; offset = '0'; limit = '30' } -Headers $hdr -TimeoutSec 40
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($try + 1)); continue }
      if ($r.result -and $r.result.songs) { foreach ($s in $r.result.songs) { $songs += [PSCustomObject]@{ id="$($s.id)"; name=$s.name; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$s.album.name; duration=$s.duration } } }
      break
    } catch { Start-Sleep -Milliseconds (1500 * ($try + 1)) }
  }
  [void]$out.Add([PSCustomObject]@{ q=$q; songs=$songs })
  Start-Sleep -Milliseconds 1200
}
$out | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\pauline.json' -Encoding UTF8
'ok'