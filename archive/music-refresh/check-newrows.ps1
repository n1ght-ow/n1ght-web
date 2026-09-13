Add-Type -AssemblyName System.Drawing
$ids = @(44,45,46,47,48,49,50,51,52,53,54,55,56,57,58)
$cw = 80; $ch = 80; $pad = 6
$sheetW = [int]($ids.Count * ($cw + $pad) + $pad)
$sheetH = [int]($ch + 2 * $pad)
$sheet = New-Object System.Drawing.Bitmap -ArgumentList $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
for ($i = 0; $i -lt $ids.Count; $i++) {
  $nm = "$($ids[$i]).png"
  $c = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\covers' $nm
  $cx = [int]($pad + $i * ($cw + $pad))
  if (Test-Path $c) { $im = [System.Drawing.Image]::FromFile($c); $g.DrawImage($im, $cx, $pad, $cw, $ch); $im.Dispose() }
  $g.DrawRectangle([System.Drawing.Pens]::Silver, $cx, $pad, $cw, $ch)
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\check-newrows.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'