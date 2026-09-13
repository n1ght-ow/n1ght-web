$ErrorActionPreference = 'Continue'
$rows = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\queries.tsv' -Encoding UTF8
$out = New-Object System.Collections.ArrayList
$n = 0
foreach ($line in $rows) {
  if (-not $line.Trim()) { continue }
  $f = $line -split $([char]9)
  $idx = $f[0]; $qt = $f[1]; $qa = $f[2]
  $q = [Uri]::EscapeDataString("$qt $qa")
  $url = "https://music.163.com/api/search/get/web?s=$q&type=1&offset=0&limit=20"
  $songs = @()
  try {
    $r = Invoke-RestMethod -Uri $url -Headers @{'User-Agent'='Mozilla/5.0'; 'Referer'='https://music.163.com/'} -TimeoutSec 25
    if ($r.result -and $r.result.songs) {
      foreach ($s in $r.result.songs) {
        $songs += [PSCustomObject]@{
          id = "$($s.id)"; name = $s.name
          artist = (($s.artists | ForEach-Object { $_.name }) -join ' / ')
          album = $s.album.name; albumId = "$($s.album.id)"
          cover = $s.album.picUrl; duration = $s.duration
        }
      }
    }
  } catch { }
  [void]$out.Add([PSCustomObject]@{ idx = [int]$idx; query = "$qt $qa"; songs = $songs })
  $n++
  Start-Sleep -Milliseconds 320
}
$out | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\search-results.json' -Encoding UTF8
"searched: $n"