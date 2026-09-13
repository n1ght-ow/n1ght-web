$ErrorActionPreference = 'Continue'
$rows = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\queries.tsv' -Encoding UTF8
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
$out = New-Object System.Collections.ArrayList
$n = 0
foreach ($line in $rows) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $idx = [int]$f[0]; $qt = $f[1]; $qa = $f[2]
  $songs = @()
  $delay = 900
  for ($try = 0; $try -lt 5; $try++) {
    try {
      $body = @{ s = ("$qt $qa"); type = '1'; offset = '0'; limit = '20' }
      $resp = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body $body -Headers $hdr -TimeoutSec 30
      if ($resp.code -eq 405) { Start-Sleep -Milliseconds $delay; $delay = $delay * 2; continue }
      if ($resp.result -and $resp.result.songs) {
        foreach ($s in $resp.result.songs) {
          $songs += [PSCustomObject]@{
            id = "$($s.id)"; name = $s.name
            artist = (($s.artists | ForEach-Object { $_.name }) -join ' / ')
            album = $s.album.name; albumId = "$($s.album.id)"
            cover = $s.album.picUrl; duration = $s.duration
          }
        }
        break
      } else { break }
    } catch { Start-Sleep -Milliseconds $delay; $delay = $delay * 2 }
  }
  [void]$out.Add([PSCustomObject]@{ idx = $idx; query = "$qt $qa"; songs = $songs })
  $n++
  if (($n % 25) -eq 0) { "progress $n" }
  Start-Sleep -Milliseconds 1100
}
$out | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\search-results.json' -Encoding UTF8
"searched: $n ; withResults: " + ($out | Where-Object { $_.songs.Count -gt 0 }).Count