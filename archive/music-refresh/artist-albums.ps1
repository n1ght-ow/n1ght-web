$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
foreach ($aid in @(94779, 53283)) {
  foreach ($u in @(('https://music.163.com/api/artist/albums/' + $aid + '?offset=0&limit=100'), ('https://music.163.com/api/artist/' + $aid + '/albums?offset=0&limit=100'))) {
    try {
      $d = Invoke-RestMethod -Uri $u -Headers $hdr -TimeoutSec 40
      if ($d.hotAlbums) { foreach ($a in $d.hotAlbums) { [void]$out.Add([PSCustomObject]@{ artist=$aid; id="$($a.id)"; name=$a.name; size=$a.size }) }; break }
    } catch { }
    Start-Sleep -Milliseconds 900
  }
  Start-Sleep -Milliseconds 1200
}
$out | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\artist-albums.json' -Encoding UTF8
'albums ' + $out.Count