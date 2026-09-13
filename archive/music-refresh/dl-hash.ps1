param([string]$InputTsv, [string]$CacheDir, [string]$OutputJson)
Add-Type -AssemblyName System.Drawing
function Get-AHash([System.Drawing.Image]$img) {
  $bmp = New-Object System.Drawing.Bitmap(8, 8)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, 8, 8)
  $g.Dispose()
  $vals = New-Object double[] 64
  $sum = 0.0
  for ($y = 0; $y -lt 8; $y++) { for ($x = 0; $x -lt 8; $x++) {
      $c = $bmp.GetPixel($x, $y)
      $v = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
      $vals[$y * 8 + $x] = $v; $sum += $v
  } }
  $bmp.Dispose()
  $avg = $sum / 64.0
  $bits = ''
  foreach ($v in $vals) { if ($v -ge $avg) { $bits += '1' } else { $bits += '0' } }
  return $bits
}
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null
$res = New-Object System.Collections.ArrayList
$lines = Get-Content -LiteralPath $InputTsv -Encoding UTF8
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$n = 0
foreach ($line in $lines) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $key = $f[0]; $url = $f[1]
  $safe = ($key -replace '[^0-9A-Za-z_\-]', '_')
  $path = Join-Path $CacheDir ($safe + '.img')
  if (-not (Test-Path $path)) {
    try {
      if ($url -match '\?') { $u = $url + '&param=100y100' } else { $u = $url + '?param=100y100' }
      Invoke-WebRequest -Uri $u -Headers $hdr -OutFile $path -TimeoutSec 25
    } catch { }
  }
  $hash = ''
  if (Test-Path $path) {
    try { $img = [System.Drawing.Image]::FromFile($path); $hash = Get-AHash $img; $img.Dispose() } catch { $hash = '' }
  }
  [void]$res.Add([PSCustomObject]@{ key = $key; hash = $hash })
  $n++
  if (($n % 200) -eq 0) { "dl $n" }
  Start-Sleep -Milliseconds 90
}
$res | ConvertTo-Json -Compress | Set-Content -LiteralPath $OutputJson -Encoding UTF8
"done $n"