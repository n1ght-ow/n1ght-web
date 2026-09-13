Add-Type -AssemblyName System.Drawing
$dir = 'C:\Users\qsr\night-web\album-covers'
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$p1 = New-Object System.Drawing.Imaging.EncoderParameters 1
$p1.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L
$before = 0; $after = 0; $n = 0
foreach ($f in (Get-ChildItem -LiteralPath $dir -File -Filter *.jpg)) {
  if ($f.Length -le 100KB) { continue }
  $before += $f.Length
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList 500, 500
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, 500, 500)
  $g.Dispose(); $img.Dispose()
  $tmp = $f.FullName + '.tmp'
  $bmp.Save($tmp, $enc, $p1)
  $bmp.Dispose()
  Remove-Item $f.FullName -Force
  Move-Item $tmp $f.FullName -Force
  $after += (Get-Item $f.FullName).Length
  $n++
}
"recompressed $n files: {0:N1} MB -> {1:N1} MB" -f ($before/1MB), ($after/1MB)
$s = (Get-ChildItem -LiteralPath $dir -File | Measure-Object -Property Length -Sum)
"album-covers now: {0} files, {1:N1} MB, avg {2:N0} KB" -f $s.Count, ($s.Sum/1MB), ($s.Sum/$s.Count/1KB)