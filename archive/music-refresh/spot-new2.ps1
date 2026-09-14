$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
function Search($q) {
  for ($t = 0; $t -lt 5; $t++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $q; type = '1'; offset = '0'; limit = '30' } -Headers $hdr -TimeoutSec 40
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($t + 1)); continue }
      return $r.result.songs
    } catch { Start-Sleep -Milliseconds (1500 * ($t + 1)) }
  }
  return @()
}
foreach ($q in @('罗生门 梨冻紧','罗生门 Wiz_H张子豪','罗生门 Follow')) {
  "=== $q ==="
  foreach ($s in (Search $q)) {
    $d = [math]::Round($s.duration / 1000)
    $mm = '{0:00}:{1:00}' -f [math]::Floor($d / 60), ($d % 60)
    $ar = ($s.artists | ForEach-Object { $_.name }) -join ' / '
    "  $($s.id)  $($s.name)  |  $ar  |  $($s.album.name)  |  $mm"
  }
  Start-Sleep -Milliseconds 1200
}
"=== song/detail for the uncertain picks ==="
foreach ($id in @('1918576268','444323757','1969908030','2124115505','2071177415')) {
  try {
    $r = Invoke-RestMethod -Uri ('https://music.163.com/api/song/detail/?ids=[' + $id + ']') -Headers $hdr -TimeoutSec 40
    foreach ($s in $r.songs) {
      $d = [math]::Round($s.duration / 1000)
      $mm = '{0:00}:{1:00}' -f [math]::Floor($d / 60), ($d % 60)
      $ar = ($s.artists | ForEach-Object { $_.name }) -join ' / '
      "  $($s.id)  $($s.name)  |  $ar  |  $($s.album.name)  |  $mm"
    }
  } catch { "  detail failed for $id" }
  Start-Sleep -Milliseconds 900
}