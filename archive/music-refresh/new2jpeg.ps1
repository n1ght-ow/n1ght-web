Add-Type -AssemblyName System.Drawing
$raw = (Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-covers.json' -Raw) -replace '^\uFEFF',''
$rows = $raw | ConvertFrom-Json
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
if (-not $codec) { throw 'no jpeg encoder' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]82)
$conv = 0
foreach ($x in $rows) {
  $f = Join-Path 'C:\Users\qsr\night-web\album-covers' $x.cover
  $b = [System.IO.File]::ReadAllBytes($f)
  if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { continue }
  $before = [math]::Round($b.Length / 1KB)
  $src = [System.Drawing.Image]::FromFile($f)
  $w = $src.Width; $h = $src.Height
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose()
  $src.Dispose()
  $tmp = $f + '.conv.jpg'
  if (Test-Path $tmp) { Remove-Item $tmp -Force }
  $bmp.Save($tmp, $codec, $ep)
  $bmp.Dispose()
  Move-Item -LiteralPath $tmp -Destination $f -Force
  $after = [math]::Round((Get-Item $f).Length / 1KB)
  "  $($x.cover)  ${w}x${h}  ${before}KB -> ${after}KB"
  $conv++
}
$ep.Dispose()
"converted=$conv"
$j = 0; $bad = 0
foreach ($x in $rows) {
  $f = Join-Path 'C:\Users\qsr\night-web\album-covers' $x.cover
  $bb = [System.IO.File]::ReadAllBytes($f)
  if ($bb[0] -eq 0xFF -and $bb[1] -eq 0xD8) { $j++ } else { $bad++ }
}
"jpeg=$j notjpeg=$bad"
"dir total: " + [math]::Round((Get-ChildItem -LiteralPath 'C:\Users\qsr\night-web\album-covers' -File | Measure-Object Length -Sum).Sum/1MB, 2) + ' MB'