Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('C:\Users\qsr\.dsh\attachments\v1\objects\2b\2b89dc2b9078e688c84961b0463bee75ef8024fd89fb7297c8c66b3676ad1bff')
$w = $img.Width; $h = $img.Height
"user screenshot: ${w}x${h}"
# cover bounding box: scan the middle band for bright pixels
$minX = $w; $maxX = -1
for ($y = [int]($h * 0.45); $y -lt [int]($h * 0.6); $y += 4) {
  for ($x = 0; $x -lt $w; $x += 2) {
    $c = $img.GetPixel($x, $y)
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    if ($lum -gt 90) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x } }
  }
}
"cover  x[$minX..$maxX] width=$($maxX-$minX+1) centre=$([math]::Round(($minX+$maxX)/2,1))"
# top bar text bands: find bright pixels in the top 12% and cluster by x
$cols = @{}
for ($y = 40; $y -lt [int]($h * 0.12); $y += 1) {
  for ($x = 0; $x -lt $w; $x += 1) {
    $c = $img.GetPixel($x, $y)
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    if ($lum -gt 120) { $cols[$x] = $true }
  }
}
$xs = $cols.Keys | Sort-Object
$runs = @(); $s = -1; $prev = -99
foreach ($x in $xs) { if ($s -lt 0) { $s = $x } elseif ($x - $prev -gt 60) { $runs += ,@($s, $prev); $s = $x }; $prev = $x }
if ($s -ge 0) { $runs += ,@($s, $prev) }
foreach ($r in $runs) { "topbar cluster x[$($r[0])..$($r[1])] width=$($r[1]-$r[0]+1) centre=$([math]::Round(($r[0]+$r[1])/2,1))" }
"viewport centre would be $([math]::Round($w/2,1))"
$img.Dispose()