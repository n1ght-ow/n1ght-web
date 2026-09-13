$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'; 'Accept'='application/json'}
function Q([string]$s, [string]$type, [int]$limit) {
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $r = Invoke-RestMethod -Uri 'https://music.163.com/api/search/get' -Method POST -Body @{ s = $s; type = $type; offset = '0'; limit = "$limit" } -Headers $hdr -TimeoutSec 40
      if ($r.code -eq 405) { Start-Sleep -Milliseconds (1500 * ($try + 1)); continue }
      return $r.result
    } catch { Start-Sleep -Milliseconds (1500 * ($try + 1)) }
  }
  return $null
}
$out = New-Object System.Collections.ArrayList
# Scorpion album search
$r1 = Q 'Scorpion' '10' 10
if ($r1 -and $r1.albums) { foreach ($a in $r1.albums) { [void]$out.Add([PSCustomObject]@{ probe='scorpion-album'; id="$($a.id)"; name=$a.name; artist=$a.artist.name }) } }
Start-Sleep -Milliseconds 1200
# Evolve album search
$r2 = Q 'Evolve Imagine Dragons' '10' 10
if ($r2 -and $r2.albums) { foreach ($a in $r2.albums) { [void]$out.Add([PSCustomObject]@{ probe='evolve-album'; id="$($a.id)"; name=$a.name; artist=$a.artist.name }) } }
Start-Sleep -Milliseconds 1200
# Imagine Dragons artist search
$r3 = Q 'Imagine Dragons' '100' 5
if ($r3 -and $r3.artists) { foreach ($a in $r3.artists) { [void]$out.Add([PSCustomObject]@{ probe='artist'; id="$($a.id)"; name=$a.name; artist='' }) } }
Start-Sleep -Milliseconds 1200
# Drake artist search
$r4 = Q 'Drake' '100' 5
if ($r4 -and $r4.artists) { foreach ($a in $r4.artists) { [void]$out.Add([PSCustomObject]@{ probe='artist'; id="$($a.id)"; name=$a.name; artist='' }) } }
$out | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\probe2.json' -Encoding UTF8
'probe done ' + $out.Count