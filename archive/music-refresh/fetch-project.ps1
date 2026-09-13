
$ids = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\all-ids.txt'
$out = @()
for ($i=0; $i -lt $ids.Count; $i += 100) {
  $chunk = $ids[$i..([Math]::Min($i+99, $ids.Count-1))] -join ','
  $url = "https://music.163.com/api/song/detail/?ids=[$chunk]"
  try {
    $r = Invoke-RestMethod -Uri $url -Headers @{'User-Agent'='Mozilla/5.0'; 'Referer'='https://music.163.com/'} -TimeoutSec 30
    foreach ($s in $r.songs) {
      $out += [PSCustomObject]@{
        id = "$($s.id)"; name = $s.name
        artist = (($s.artists | ForEach-Object { $_.name }) -join ' / ')
        album = $s.album.name; albumId = "$($s.album.id)"
        cover = $s.album.picUrl; duration = $s.duration
      }
    }
  } catch { Write-Error "chunk $i failed: $_" }
  Start-Sleep -Milliseconds 200
}
$out | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\project-details.json' -Encoding UTF8
"fetched: $($out.Count)"
