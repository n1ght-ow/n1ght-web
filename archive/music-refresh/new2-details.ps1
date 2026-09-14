$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$ids = @('1918576268','1396141677','2054300084','2045943936','1965928052','1336856498','444323757','1969908030','2071177415','1456890009','2054298885','1383954630','1492049185','454966913','1325896303','31260611','534542490','1488796175','490595927','528326686','1355896807','1459232593','518725853','316100','2124115505','25714102','82360')
$out = @()
for ($i = 0; $i -lt $ids.Count; $i += 50) {
  $chunk = $ids[$i..([Math]::Min($i + 49, $ids.Count - 1))] -join ','
  for ($t = 0; $t -lt 5; $t++) {
    try {
      $r = Invoke-RestMethod -Uri ('https://music.163.com/api/song/detail/?ids=[' + $chunk + ']') -Headers $hdr -TimeoutSec 40
      foreach ($s in $r.songs) {
        $out += [PSCustomObject]@{ id="$($s.id)"; name=$s.name; alias=(($s.alias) -join ' | '); artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$s.album.name; albumId="$($s.album.id)"; pic=$s.album.picUrl; dur=[math]::Round($s.duration / 1000) }
      }
      break
    } catch { Start-Sleep -Milliseconds (1500 * ($t + 1)) }
  }
  Start-Sleep -Milliseconds 900
}
$out | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-details.json' -Encoding UTF8
'details ' + $out.Count
foreach ($s in $out) {
  $mm = '{0:00}:{1:00}' -f [math]::Floor($s.dur / 60), ($s.dur % 60)
  "$($s.id)  $($s.name)  [alias: $($s.alias)]  |  $($s.artist)  |  $($s.album)  |  $mm"
}