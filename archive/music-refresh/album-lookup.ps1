$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$rows = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\album-queries.tsv' -Encoding UTF8
$res = New-Object System.Collections.ArrayList
foreach ($line in $rows) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $idx = [int]$f[0]; $q = $f[1]
  $albums = @()
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $q; type = '10'; offset = '0'; limit = '6' } -Headers $hdr -TimeoutSec 30
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($try + 1)); continue }
      if ($r.result -and $r.result.albums) { $albums = $r.result.albums }
      break
    } catch { Start-Sleep -Milliseconds (1500 * ($try + 1)) }
  }
  $found = @()
  foreach ($a in $albums) {
    Start-Sleep -Milliseconds 1000
    $songs = @()
    for ($try2 = 0; $try2 -lt 4; $try2++) {
      try {
        $d = Invoke-RestMethod -Uri ('https://music.163.com/api/album/' + $a.id) -Headers $hdr -TimeoutSec 30
        if ($d.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($try2 + 1)); continue }
        if ($d.album -and $d.album.songs) { foreach ($s in $d.album.songs) { $songs += [PSCustomObject]@{ id = "$($s.id)"; name = $s.name; artist = (($s.artists | ForEach-Object { $_.name }) -join ' / '); duration = $s.duration } } }
        break
      } catch { Start-Sleep -Milliseconds (1500 * ($try2 + 1)) }
    }
    $found += [PSCustomObject]@{ albumId = "$($a.id)"; album = $a.name; artist = $a.artist.name; songs = $songs }
  }
  [void]$res.Add([PSCustomObject]@{ idx = $idx; q = $q; albums = $found })
  Start-Sleep -Milliseconds 1200
}
$res | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\album-lookup.json' -Encoding UTF8
'album lookup done ' + $res.Count