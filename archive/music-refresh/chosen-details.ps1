$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$ids = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\chosen-ids.txt' -Encoding UTF8
$out = @()
for ($i = 0; $i -lt $ids.Count; $i += 100) {
  $chunk = $ids[$i..([Math]::Min($i + 99, $ids.Count - 1))] -join ','
  $url = 'https://music.163.com/api/song/detail/?ids=[' + $chunk + ']'
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $r = Invoke-RestMethod -Uri $url -Headers $hdr -TimeoutSec 40
      foreach ($s in $r.songs) { $out += [PSCustomObject]@{ id="$($s.id)"; album=$s.album.name; cover=$s.album.picUrl; duration=$s.duration; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / ') } }
      break
    } catch { Start-Sleep -Milliseconds (1500 * ($try + 1)) }
  }
  Start-Sleep -Milliseconds 800
}
$out | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\chosen-details.json' -Encoding UTF8
'details ' + $out.Count