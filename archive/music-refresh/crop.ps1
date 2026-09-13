Add-Type -AssemblyName System.Drawing
$geom = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\geometry.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$map = Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\playlist.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$files = @(Get-ChildItem -LiteralPath 'D:\fw' -Filter *.png) + @(Get-ChildItem -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\shots' -Filter *.png)
$byName = @{}
foreach ($f in $files) { $k = ([regex]::Match($f.Name, '(\d{6})\.png$')).Groups[1].Value; $byName[$k] = $f.FullName }
$outDir = 'C:\Users\qsr\night-web\archive\music-refresh\covers'; New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$count = 0
foreach ($row in $map) {
  $k = $row.shot
  $g = $geom.$k
  $pos = $row.idx - $g.first
  $y = [int]($g.off + $pos * 84)
  if ($y -lt 0) { continue }
  $src = [System.Drawing.Bitmap]::FromFile($byName[$k])
  $h = [Math]::Min(54, $src.Height - $y)
  if ($h -le 0) { $src.Dispose(); continue }
  $rect = New-Object System.Drawing.Rectangle(86, $y, 54, $h)
  $c = $src.Clone($rect, $src.PixelFormat)
  $c.Save((Join-Path $outDir ('{0}.png' -f $row.idx)), [System.Drawing.Imaging.ImageFormat]::Png)
  $c.Dispose(); $src.Dispose(); $count++
}
'cropped ' + $count