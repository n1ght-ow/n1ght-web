$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
function Search($q, $type) {
  for ($t = 0; $t -lt 4; $t++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $q; type = $type; offset = '0'; limit = '20' } -Headers $hdr -TimeoutSec 40
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($t + 1)); continue }
      if ($type -eq '10') { return $r.result.albums }
      return $r.result.songs
    } catch { Start-Sleep -Milliseconds (1500 * ($t + 1)) }
  }
  return @()
}
foreach ($q in @('红 4U 罗言','罗言 红')) {
  "=== song search: $q ==="
  foreach ($s in (Search $q '1')) {
    $d = [math]::Round($s.duration / 1000)
    $mm = '{0:00}:{1:00}' -f [math]::Floor($d / 60), ($d % 60)
    $ar = ($s.artists | ForEach-Object { $_.name }) -join ' / '
    "  $($s.id)  $($s.name)  |  $ar  |  $($s.album.name)  |  $mm"
  }
  Start-Sleep -Milliseconds 1200
}
"=== album search: 忘记时间 杜宣达 ==="
foreach ($a in (Search '忘记时间 杜宣达' '10')) { "  album $($a.id)  $($a.name)  |  $(($a.artists | ForEach-Object { $_.name }) -join ' / ')  |  $($a.size) tracks" }
Start-Sleep -Milliseconds 1200
"=== song search: 忘记时间 杜宣达 ==="
foreach ($s in (Search '忘记时间 杜宣达' '1')) {
  $d = [math]::Round($s.duration / 1000)
  $mm = '{0:00}:{1:00}' -f [math]::Floor($d / 60), ($d % 60)
  $ar = ($s.artists | ForEach-Object { $_.name }) -join ' / '
  "  $($s.id)  $($s.name)  |  $ar  |  $($s.album.name)  |  $mm"
}