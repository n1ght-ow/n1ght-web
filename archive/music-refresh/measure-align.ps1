Add-Type -AssemblyName System.Drawing
function Look([string]$file) {
  $img = [System.Drawing.Bitmap]::FromFile($file)
  $w = $img.Width; $h = $img.Height
  $minX = $w; $maxX = -1
  for ($y = [int]($h*0.45); $y -lt [int]($h*0.6); $y += 3) {
    for ($x = 0; $x -lt $w; $x += 2) {
      $c = $img.GetPixel($x,$y); $l = 0.299*$c.R + 0.587*$c.G + 0.114*$c.B
      if ($l -gt 90) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x } }
    }
  }
  $covC = ($minX + $maxX) / 2
  $cols = @{}
  for ($y = 20; $y -lt [int]($h*0.13); $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $c = $img.GetPixel($x,$y); $l = 0.299*$c.R + 0.587*$c.G + 0.114*$c.B
      if ($l -gt 130) { $cols[$x] = $true }
    }
  }
  $xs = $cols.Keys | Sort-Object
  $runs = @(); $s = -1; $prev = -99
  foreach ($x in $xs) { if ($s -lt 0) { $s = $x } elseif ($x - $prev -gt 60) { $runs += ,@($s,$prev); $s = $x }; $prev = $x }
  if ($s -ge 0) { $runs += ,@($s,$prev) }
  $names = @('count','act','close')
  "$(Split-Path $file -Leaf)  ${w}x${h}"
  "  cover   x[$minX..$maxX] centre=$([math]::Round($covC,1))"
  for ($i = 0; $i -lt $runs.Count; $i++) {
    $c2 = ($runs[$i][0] + $runs[$i][1]) / 2
    $nm = if ($i -lt 3) { $names[$i] } else { 'extra' + $i }
    "  $nm padded  x[$($runs[$i][0])..$($runs[$i][1])] centre=$([math]::Round($c2,1))  offset-vs-cover=$([math]::Round($c2 - $covC,1))"
  }
  $img.Dispose()
}
Look 'C:\Users\qsr\night-web\archive\music-refresh\final-desktop.png'
Look 'C:\Users\qsr\night-web\archive\music-refresh\final-long.png'