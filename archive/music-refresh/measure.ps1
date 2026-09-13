Add-Type -AssemblyName System.Drawing
function Probe([string]$file) {
  $img = [System.Drawing.Bitmap]::FromFile($file)
  $w = $img.Width; $h = $img.Height
  $best = 0; $bx0 = 0; $bx1 = 0; $by = 0
  for ($y = 60; $y -lt ($h - 60); $y += 3) {
    $run = 0; $s = -1
    for ($x = 70; $x -lt ($w - 70); $x++) {
      $c = $img.GetPixel($x, $y)
      $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
      if ($lum -gt 55) { if ($run -eq 0) { $s = $x }; $run++ }
      else { if ($run -gt $best) { $best = $run; $bx0 = $s; $bx1 = $x - 1; $by = $y }; $run = 0 }
    }
    if ($run -gt $best) { $best = $run; $bx0 = $s; $bx1 = $w - 71; $by = $y }
  }
  $cx = ($bx0 + $bx1) / 2
  "$([System.IO.Path]::GetFileName($file))  ${w}x${h}  sleeve width=$best  x[$bx0..$bx1]  centre-offset=$([math]::Round($cx - $w/2,1))"
  $img.Dispose()
}
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-desktop.png'
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-laptop.png'
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-w500.png'
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-w720.png'
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-w760.png'
Probe 'C:\Users\qsr\night-web\archive\music-refresh\shot-landscape.png'