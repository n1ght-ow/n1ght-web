Add-Type -AssemblyName System.Drawing
$ids = @(7,34,40,82,136,145,149,154,170,184,193,200,203,207,212,236,243,246,250,312,329,367,382,415)
$cw = 62; $ch = 62; $pad = 4; $cols = 8
$rows = [int][Math]::Ceiling($ids.Count / $cols)
$sheetW = [int]($cols * (2 * $cw + 4 + $pad) + $pad)
$sheetH = [int]($rows * ($ch + $pad) + $pad)
$sheet = New-Object System.Drawing.Bitmap -ArgumentList $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$pen = [System.Drawing.Pens]::Silver
for ($i = 0; $i -lt $ids.Count; $i++) {
  $col = $i % $cols; $row = [int][Math]::Floor($i / $cols)
  $cx = [int]($pad + $col * (2 * $cw + 4 + $pad))
  $cy = [int]($pad + $row * ($ch + $pad))
  $nm1 = "c$($ids[$i]).jpg"; $nm2 = "n$($ids[$i]).jpg"
  $p1 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' $nm1
  $p2 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' $nm2
  if (Test-Path $p1) { $im = [System.Drawing.Image]::FromFile($p1); $g.DrawImage($im, $cx, $cy, $cw, $ch); $im.Dispose() }
  if (Test-Path $p2) { $im = [System.Drawing.Image]::FromFile($p2); $g.DrawImage($im, ($cx + $cw + 4), $cy, $cw, $ch); $im.Dispose() }
  $g.DrawRectangle($pen, $cx, $cy, $cw, $ch)
  $g.DrawRectangle($pen, ($cx + $cw + 4), $cy, $cw, $ch)
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\verify-sample.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'