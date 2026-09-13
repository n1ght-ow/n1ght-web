Add-Type -AssemblyName System.Drawing
$ids = @(16,17,18,19,20,21,22,23,24,26,27,28,29,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15)
$cols = 8
$cw = 54; $ch = 54; $pad = 6
$rows = [Math]::Ceiling($ids.Count / $cols)
$sheet = New-Object System.Drawing.Bitmap(($cols * ($cw + $pad) + $pad), ($rows * ($ch + $pad) + $pad))
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(255, 240, 240, 240))
for ($i = 0; $i -lt $ids.Count; $i++) {
  $p = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\covers' ('{0}.png' -f $ids[$i])
  if (-not (Test-Path $p)) { continue }
  $im = [System.Drawing.Image]::FromFile($p)
  $cx = $pad + ($i % $cols) * ($cw + $pad)
  $cy = $pad + [Math]::Floor($i / $cols) * ($ch + $pad)
  $g.DrawImage($im, $cx, $cy, $cw, $ch)
  $g.DrawRectangle([System.Drawing.Pens]::Red, $cx, $cy, $cw - 1, $ch - 1)
  $im.Dispose()
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\contact-covers.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'sheet ok'