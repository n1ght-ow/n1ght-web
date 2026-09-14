$rows = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-rows.tsv' -Encoding UTF8
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
foreach ($line in $rows) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $idx = [int]$f[0]; $qt = $f[1]; $qa = $f[2]; $qalb = $f[3]; $qdur = $f[4]
  $songs = @()
  $delay = 1500
  for ($try = 0; $try -lt 5; $try++) {
    try {
      $resp = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = ($qt + ' ' + $qa); type = '1'; offset = '0'; limit = '25' } -Headers $hdr -TimeoutSec 40
      if ($resp.code -eq 405) { Start-Sleep -Milliseconds $delay; $delay = $delay * 2; continue }
      if ($resp.result -and $resp.result.songs) { foreach ($s in $resp.result.songs) { $songs += [PSCustomObject]@{ id="$($s.id)"; name=$s.name; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$s.album.name; albumId="$($s.album.id)"; cover=$s.album.picUrl; duration=$s.duration } } }
      break
    } catch { Start-Sleep -Milliseconds $delay; $delay = $delay * 2 }
  }
  [void]$out.Add([PSCustomObject]@{ idx = $idx; title = $qt; artist = $qa; album = $qalb; dur = $qdur; songs = $songs })
  Start-Sleep -Milliseconds 1200
}
$out | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\search-new2.json' -Encoding UTF8
'searched ' + $out.Count