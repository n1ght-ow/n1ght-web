$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
# Scorpion tracks
foreach ($u in @('https://music.163.com/api/v1/album/39791361', 'https://music.163.com/api/album/39791361')) {
  try {
    $d = Invoke-RestMethod -Uri $u -Headers $hdr -TimeoutSec 40
    $list = $null; $an = ''
    if ($d.songs) { $list = $d.songs; $an = $d.album.name } elseif ($d.album -and $d.album.songs) { $list = $d.album.songs; $an = $d.album.name }
    if ($list) { foreach ($s in $list) { [void]$out.Add([PSCustomObject]@{ kind='scorpion'; id="$($s.id)"; name=$s.name; artist=((($s.ar) | ForEach-Object { $_.name }) -join ' / '); album=$an; cover=$d.album.picUrl; duration=$s.duration }) }; break }
  } catch { }
  Start-Sleep -Milliseconds 900
}
Start-Sleep -Milliseconds 1000
# detail for manual picks
$ids = '[1313303916,24197361,545350938,545350935,506092035,5054926,2057234990,29561033,455311479]'
$dd = Invoke-RestMethod -Uri ('https://music.163.com/api/song/detail/?ids=' + $ids) -Headers $hdr -TimeoutSec 40
foreach ($s in $dd.songs) { [void]$out.Add([PSCustomObject]@{ kind='manual'; id="$($s.id)"; name=$s.name; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$s.album.name; cover=$s.album.picUrl; duration=$s.duration }) }
$out | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\extra-candidates.json' -Encoding UTF8
'extra ' + $out.Count