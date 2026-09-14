$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
"=== album 140087138 tracks ==="
try {
  $r = Invoke-RestMethod -Uri 'https://music.163.com/api/album/140087138' -Headers $hdr -TimeoutSec 40
  "album name: $($r.album.name)  |  tracks: $($r.songs.Count)"
  foreach ($s in $r.songs) {
    $d = [math]::Round($s.duration / 1000)
    $mm = '{0:00}:{1:00}' -f [math]::Floor($d / 60), ($d % 60)
    $ar = ($s.artists | ForEach-Object { $_.name }) -join ' / '
    "  $($s.id)  $($s.name)  |  $ar  |  $mm"
  }
} catch { "album failed: $_" }
Start-Sleep -Milliseconds 1200
"=== song 2124115505 album ==="
try {
  $r = Invoke-RestMethod -Uri 'https://music.163.com/api/song/detail/?ids=[2124115505]' -Headers $hdr -TimeoutSec 40
  foreach ($s in $r.songs) { "  album id=$($s.album.id)  name=$($s.album.name)" }
} catch { "detail failed" }