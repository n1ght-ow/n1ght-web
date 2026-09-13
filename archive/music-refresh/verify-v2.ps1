Add-Type -AssemblyName System.Drawing
$ids = @(44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,319)
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
  $p1 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' "c$($ids[$i]).jpg"
  $p2 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\review-assets' "n$($ids[$i]).jpg"
  if (Test-Path $p1) { $im = [System.Drawing.Image]::FromFile($p1); $g.DrawImage($im, $cx, $cy, $cw, $ch); $im.Dispose() }
  if (Test-Path $p2) { $im = [System.Drawing.Image]::FromFile($p2); $g.DrawImage($im, ($cx + $cw + 4), $cy, $cw, $ch); $im.Dispose() }
  $g.DrawRectangle($pen, $cx, $cy, $cw, $ch)
  $g.DrawRectangle($pen, ($cx + $cw + 4), $cy, $cw, $ch)
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\verify-v2.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'