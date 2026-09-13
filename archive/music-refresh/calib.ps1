Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -LiteralPath 'D:\fw' -Filter *.png | Sort-Object Name
$src = [System.Drawing.Image]::FromFile($files[0].FullName)
$bmp = New-Object System.Drawing.Bitmap($src)
'size: ' + $bmp.Width + 'x' + $bmp.Height + ' file=' + $files[0].Name
$rect = New-Object System.Drawing.Rectangle(80, 0, 80, $bmp.Height)
$crop = $bmp.Clone($rect, $bmp.PixelFormat)
$crop.Save('C:\Users\qsr\night-web\archive\music-refresh\calib-strip.png', [System.Drawing.Imaging.ImageFormat]::Png)
foreach ($y in @(18, 91, 165, 238)) {
  $r2 = New-Object System.Drawing.Rectangle(86, $y, 60, 60)
  $c2 = $bmp.Clone($r2, $bmp.PixelFormat)
  $c2.Save('C:\Users\qsr\night-web\archive\music-refresh\calib-row-' + $y + '.png', [System.Drawing.Imaging.ImageFormat]::Png)
  $c2.Dispose()
}
$crop.Dispose(); $bmp.Dispose(); $src.Dispose()
'done'