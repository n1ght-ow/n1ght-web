Add-Type -AssemblyName System.Drawing
$pairs = @(@('28','28053527'),@('34','1939557593'),@('40','108251'),@('82','1807799505'),@('35','5265370'),@('202','5201829'),@('204','1811303184'),@('131','1338149101'),@('149','1416661690'),@('367','21803604'))
$cw = 120; $ch = 120; $pad = 6; $gap = 10
$sheetW = [int](2 * $cw + $gap + 2 * $pad)
$sheetH = [int]($pairs.Count * ($ch + $pad) + $pad)
$sheet = New-Object System.Drawing.Bitmap -ArgumentList $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
for ($i = 0; $i -lt $pairs.Count; $i++) {
  $idx = $pairs[$i][0]; $songkey = $pairs[$i][1]
  $cy = [int]($pad + $i * ($ch + $pad))
  $p1 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\covers' ($idx + '.png')
  $p2 = Join-Path 'C:\Users\qsr\night-web\archive\music-refresh\imgcache' ('proj-' + $songkey + '.img')
  if (Test-Path $p1) { $im = [System.Drawing.Image]::FromFile($p1); $g.DrawImage($im, $pad, $cy, $cw, $ch); $im.Dispose() }
  if (Test-Path $p2) { $im = [System.Drawing.Image]::FromFile($p2); $g.DrawImage($im, ($pad + $cw + $gap), $cy, $cw, $ch); $im.Dispose() }
  $g.DrawRectangle([System.Drawing.Pens]::LightGray, $pad, $cy, $cw, $ch)
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\pair-mismatch.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'