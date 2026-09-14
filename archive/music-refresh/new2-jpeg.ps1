Add-Type -AssemblyName System.Drawing
$raw = (Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\new2-covers.json' -Raw) -replace '^\uFEFF',''
$rows = $raw | ConvertFrom-Json
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85L)
$conv = 0; $resized = 0
foreach ($x in $rows) {
  $f = Join-Path 'C:\Users\qsr\night-web\album-covers' $x.cover
  $b = [System.IO.File]::ReadAllBytes($f)
  if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { continue }
  $img = [System.Drawing.Image]::FromFile($f)
  $w = $img.Width; $h = $img.Height
  $target = $img
  if ($w -gt 500 -or $h -gt 500) {
    $scale = [Math]::Min(500 / $w, 500 / $h)
    $nw = [int][Math]::Round($w * $scale); $nh = [int][Math]::Round($h * $scale)
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $nw, $nh)
    $g.Dispose(); $target = $bmp; $resized++
  }
  $img.Dispose()
  $tmp = $f + '.tmp.jpg'
  $target.Save($tmp, $codec, $ep)
  $target.Dispose()
  Move-Item -LiteralPath $tmp -Destination $f -Force
  $conv++
  "  converted $($x.cover)  ${w}x${h} -> $([math]::Round((Get-Item $f).Length/1KB))KB"
}
$ep.Dispose()
"converted=$conv resized=$resized"