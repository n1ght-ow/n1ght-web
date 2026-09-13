Add-Type -AssemblyName System.Drawing
function Get-AHash([System.Drawing.Image]$img) {
  $bmp = New-Object System.Drawing.Bitmap(8, 8)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, 8, 8)
  $g.Dispose()
  $vals = New-Object double[] 64
  $sum = 0.0
  for ($y = 0; $y -lt 8; $y++) {
    for ($x = 0; $x -lt 8; $x++) {
      $c = $bmp.GetPixel($x, $y)
      $v = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
      $vals[$y * 8 + $x] = $v
      $sum += $v
    }
  }
  $bmp.Dispose()
  $avg = $sum / 64.0
  $bits = ''
  foreach ($v in $vals) { if ($v -ge $avg) { $bits += '1' } else { $bits += '0' } }
  return $bits
}
$res = New-Object System.Collections.ArrayList
$files = Get-ChildItem -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\covers' -Filter *.png
foreach ($f in $files) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $h = Get-AHash $img
  $img.Dispose()
  $k = [int]($f.BaseName)
  [void]$res.Add([PSCustomObject]@{ idx = $k; hash = $h })
}
$res | Sort-Object idx | ConvertTo-Json -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\crop-hashes.json' -Encoding UTF8
'hashed ' + $res.Count