Add-Type -AssemblyName System.Drawing
$ids = @(28,34,35,40,76,82,126,136,140,145,149,184,202,204,206,213,215,241,327,340,367,415,426,449)
$cw = 74; $ch = 74; $pad = 5; $cols = 6
$rows = [int][Math]::Ceiling($ids.Count / $cols)
$sheetW = [int]($cols * (3 * $cw + 2 * 2 + $pad) + $pad)
$sheetH = [int]($rows * ($ch + $pad) + $pad)
$sheet = New-Object System.Drawing.Bitmap -ArgumentList $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$neutral = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,235,235,235))
for ($i = 0; $i -lt $ids.Count; $i++) {
  $idx = $ids[$i]
  $col = $i % $cols; $row = [int][Math]::Floor($i / $cols)
  $cx = [int]($pad + $col * (3 * $cw + 4 + $pad))
  $cy = [int]($pad + $row * ($ch + $pad))
  foreach ($k in 0..2) { $g.FillRectangle($neutral, ($cx + $k * ($cw + 2)), $cy, $cw, $ch) }
  $c = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' ('c' + $idx + '.jpg')
  $n = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' ('n' + $idx + '.jpg')
  if (Test-Path $c) { $im = [System.Drawing.Image]::FromFile($c); $g.DrawImage($im, $cx, $cy, $cw, $ch); $im.Dispose() }
  if (Test-Path $n) { $im = [System.Drawing.Image]::FromFile($n); $g.DrawImage($im, ($cx + 2 * ($cw + 2)), $cy, $cw, $ch); $im.Dispose() }
  $g.DrawRectangle([System.Drawing.Pens]::Silver, $cx, $cy, $cw, $ch)
  $g.DrawRectangle([System.Drawing.Pens]::Silver, ($cx + 2 * ($cw + 2)), $cy, $cw, $ch)
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\verify-replace.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok ' + $sheetW + 'x' + $sheetH