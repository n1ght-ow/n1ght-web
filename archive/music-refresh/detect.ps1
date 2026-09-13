Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -LiteralPath 'D:\fw' -Filter *.png | Sort-Object Name
$all = New-Object System.Collections.ArrayList
foreach ($f in $files) {
  $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
  $rect = New-Object System.Drawing.Rectangle(90, 0, 44, $bmp.Height)
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $stride = $data.Stride
  $bytes = New-Object byte[] ($stride * $bmp.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  $bmp.UnlockBits($data)
  $runs = New-Object System.Collections.ArrayList
  $inRun = $false
  $start = 0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $off = $y * $stride
    $minR = 255; $maxR = 0; $minG = 255; $maxG = 0; $minB = 255; $maxB = 0
    for ($x = 0; $x -lt 44; $x++) {
      $b = $bytes[$off + $x * 3]
      $g = $bytes[$off + $x * 3 + 1]
      $r = $bytes[$off + $x * 3 + 2]
      if ($r -lt $minR) { $minR = $r }
      if ($r -gt $maxR) { $maxR = $r }
      if ($g -lt $minG) { $minG = $g }
      if ($g -gt $maxG) { $maxG = $g }
      if ($b -lt $minB) { $minB = $b }
      if ($b -gt $maxB) { $maxB = $b }
    }
    $spread = ($maxR - $minR) + ($maxG - $minG) + ($maxB - $minB)
    $active = $spread -gt 24
    if ($active -and (-not $inRun)) { $inRun = $true; $start = $y }
    elseif ((-not $active) -and $inRun) { $inRun = $false; [void]$runs.Add((New-Object int[] 2)); $runs[$runs.Count - 1][0] = $start; $runs[$runs.Count - 1][1] = ($y - 1) }
  }
  if ($inRun) { [void]$runs.Add((New-Object int[] 2)); $runs[$runs.Count - 1][0] = $start; $runs[$runs.Count - 1][1] = ($bmp.Height - 1) }
  $good = New-Object System.Collections.ArrayList
  foreach ($rn in $runs) {
    $h = $rn[1] - $rn[0] + 1
    if ($h -ge 30) { [void]$good.Add([PSCustomObject]@{ y0 = $rn[0]; y1 = $rn[1]; h = $h }) }
  }
  [void]$all.Add([PSCustomObject]@{ file = $f.Name; w = $bmp.Width; h = $bmp.Height; runs = $good })
  $bmp.Dispose()
}
$all | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\cover-runs.json' -Encoding UTF8
'done ' + $all.Count