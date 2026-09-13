Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -LiteralPath 'D:\fw' -Filter *.png | Where-Object { $_.Name -match '171751' }
$src = [System.Drawing.Bitmap]::FromFile($files[0].FullName)
# rows 319..331 -> off=7 pitch 84 ; 327 is pos 8
$y = 7 + 8 * 84
$rect = New-Object System.Drawing.Rectangle(60, ($y - 10), 900, 74)
$c = $src.Clone($rect, $src.PixelFormat)
$big = New-Object System.Drawing.Bitmap -ArgumentList ($c.Width * 2), ($c.Height * 2)
$g = [System.Drawing.Graphics]::FromImage($big)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($c, 0, 0, ($c.Width * 2), ($c.Height * 2))
$g.Dispose()
$big.Save('C:\Users\qsr\night-web\archive\music-refresh\row327.png', [System.Drawing.Imaging.ImageFormat]::Png)
$big.Dispose(); $c.Dispose(); $src.Dispose()
'ok'