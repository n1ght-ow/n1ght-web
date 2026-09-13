$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
# deep title searches (limit 50)
$queries = @(
  [PSCustomObject]@{ idx = 161; q = "God's Plan Drake" },
  [PSCustomObject]@{ idx = 213; q = 'When You Say Nothing At All Ronan Keating' },
  [PSCustomObject]@{ idx = 426; q = 'Shake It Off Taylor Swift' },
  [PSCustomObject]@{ idx = 126; q = 'In the End Linkin Park' },
  [PSCustomObject]@{ idx = 184; q = 'The Spectre Alan Walker' },
  [PSCustomObject]@{ idx = 241; q = 'Lose Control Teddy Swims' },
  [PSCustomObject]@{ idx = 449; q = 'Believer Imagine Dragons' }
)
foreach ($t in $queries) {
  $songs = @()
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $t.q; type = '1'; offset = '0'; limit = '50' } -Headers $hdr -TimeoutSec 40
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($try + 1)); continue }
      if ($r.result -and $r.result.songs) { foreach ($s in $r.result.songs) { $songs += [PSCustomObject]@{ id="$($s.id)"; name=$s.name; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$s.album.name; cover=$s.album.picUrl; duration=$s.duration } } }
      break
    } catch { Start-Sleep -Milliseconds (1500 * ($try + 1)) }
  }
  [void]$out.Add([PSCustomObject]@{ kind='search'; idx=$t.idx; q=$t.q; songs=$songs })
  Start-Sleep -Milliseconds 1200
}
# album detail via v1 for the Notting Hill OST
foreach ($aid in @(501404)) {
  $songs = @()
  foreach ($u in @(('https://music.163.com/api/v1/album/' + $aid), ('https://music.163.com/api/album/' + $aid))) {
    try {
      $d = Invoke-RestMethod -Uri $u -Headers $hdr -TimeoutSec 40
      $list = $null
      if ($d.songs) { $list = $d.songs } elseif ($d.album -and $d.album.songs) { $list = $d.album.songs }
      if ($list) { foreach ($s in $list) { $songs += [PSCustomObject]@{ id="$($s.id)"; name=$s.name; artist=(($s.artists | ForEach-Object { $_.name }) -join ' / '); album=$d.album.name; cover=$d.album.picUrl; duration=$s.duration } }; break }
    } catch { }
    Start-Sleep -Milliseconds 800
  }
  [void]$out.Add([PSCustomObject]@{ kind='album'; idx=213; q=("album " + $aid); songs=$songs })
}
$out | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\deep-results.json' -Encoding UTF8
'deep done ' + $out.Count