Add-Type -AssemblyName System.Drawing
$f = 'C:\Users\qsr\night-web\archive\music-refresh\shots\extra-4458.png'
$bmp = [System.Drawing.Bitmap]::FromFile($f)
$rect = New-Object System.Drawing.Rectangle(90, 0, 44, $bmp.Height)
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $bmp.Height)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$bmp.UnlockBits($data)
$runs = New-Object System.Collections.ArrayList
$inRun = $false; $start = 0
for ($y = 0; $y -lt $bmp.Height; $y++) {
  $off = $y * $stride
  $minR = 255; $maxR = 0; $minG = 255; $maxG = 0; $minB = 255; $maxB = 0
  for ($x = 0; $x -lt 44; $x++) {
    $b = $bytes[$off + $x * 3]; $g = $bytes[$off + $x * 3 + 1]; $r = $bytes[$off + $x * 3 + 2]
    if ($r -lt $minR) { $minR = $r }; if ($r -gt $maxR) { $maxR = $r }
    if ($g -lt $minG) { $minG = $g }; if ($g -gt $maxG) { $maxG = $g }
    if ($b -lt $minB) { $minB = $b }; if ($b -gt $maxB) { $maxB = $b }
  }
  $spread = ($maxR - $minR) + ($maxG - $minG) + ($maxB - $minB)
  $active = $spread -gt 24
  if ($active -and (-not $inRun)) { $inRun = $true; $start = $y }
  elseif ((-not $active) -and $inRun) { $inRun = $false; [void]$runs.Add([PSCustomObject]@{ y0 = $start; y1 = ($y - 1); h = ($y - $start) }) }
}
if ($inRun) { [void]$runs.Add([PSCustomObject]@{ y0 = $start; y1 = ($bmp.Height - 1); h = ($bmp.Height - $start) }) }
$good = $runs | Where-Object { $_.h -ge 25 }
'runs: ' + $good.Count
$good | ForEach-Object { "  y0=$($_.y0) h=$($_.h)" }
$bmp.Dispose()