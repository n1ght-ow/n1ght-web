Add-Type -AssemblyName System.Drawing
$pairs = @(@('122','16431880'),@('205','19558690'),@('282','28306668'),@('16','30431366'),@('92','299936'),@('26','27646198'),@('22','202373'),@('36','355992'))
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
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\pair-check.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'