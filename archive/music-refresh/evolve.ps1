$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
# Evolve album songs
foreach ($u in @('https://music.163.com/api/v1/album/35645352', 'https://music.163.com/api/album/35645352')) {
  try {
    $d = Invoke-RestMethod -Uri $u -Headers $hdr -TimeoutSec 40
    $list = $null; $an = ''
    if ($d.songs) { $list = $d.songs; $an = $d.album.name } elseif ($d.album -and $d.album.songs) { $list = $d.album.songs; $an = $d.album.name }
    if ($list) { foreach ($s in $list) { [void]$out.Add([PSCustomObject]@{ kind='evolve'; id="$($s.id)"; name=$s.name; album=$an; duration=$s.duration }) }; break }
  } catch { }
  Start-Sleep -Milliseconds 900
}
Start-Sleep -Milliseconds 1200
# Drake albums page 2
try {
  $d2 = Invoke-RestMethod -Uri 'https://music.163.com/api/artist/albums/53283?offset=100&limit=100' -Headers $hdr -TimeoutSec 40
  if ($d2.hotAlbums) { foreach ($a in $d2.hotAlbums) { [void]$out.Add([PSCustomObject]@{ kind='drake-album'; id="$($a.id)"; name=$a.name; album=''; duration=0 }) } }
} catch { }
$out | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\evolve.json' -Encoding UTF8
'done ' + $out.Count