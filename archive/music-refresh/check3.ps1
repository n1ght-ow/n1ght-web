Add-Type -AssemblyName System.Drawing
$ids = @(318,319,327,331,168,169,175,181,326,330)
$cw = 90; $ch = 90; $pad = 8
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
}
$g.Dispose()
$sheet.Save('C:\Users\qsr\night-web\archive\music-refresh\check3.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
'ok'