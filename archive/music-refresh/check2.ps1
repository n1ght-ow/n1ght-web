Add-Type -AssemblyName System.Drawing
$pairs = @(@('327'),@('115'),@('126'),@('131'),@('426'),@('241'))
$cw = 130; $ch = 130; $pad = 8; $gap = 12
$sheetW = [int](3 * $cw + 2 * $gap + 2 * $pad)
$sheetH = [int]($pairs.Count * ($ch + $pad) + $pad)
$sheet = New-Object System.Drawing.Bitmap -ArgumentList $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
for ($i = 0; $i -lt $pairs.Count; $i++) {
  $idx = $pairs[$i][0]
  $cy = [int]($pad + $i * ($ch + $pad))
  $c = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\covers' ($idx + '.png')
  $n = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' ('n' + $idx + '.jpg')
  if (Test-Path $c) { $im = [System.Drawing.Image]::FromFile($c); $g.DrawImage($im, $pad, $cy, $cw, $ch); $im.Dispose() }
  if (Test-Path $n) { $im = [System.Drawing.Image]::FromFile($n); $g.DrawImage($im, ($pad + 2 * ($cw + $gap)), $cy, $cw, $ch); $im.Dispose() }
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\check2.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'