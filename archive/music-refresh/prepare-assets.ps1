param([string]$Plan, [string]$OutDir)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$n = 0; $fail = 0
foreach ($line in (Get-Content -LiteralPath $Plan -Encoding UTF8)) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $dest = Join-Path $OutDir $f[0]
  $src = $f[1]
  if (Test-Path $dest) { $n++; continue }
  try {
    if ($src -like 'http*') {
      $tmp = $dest + '.tmp'
      Invoke-WebRequest -Uri $src -Headers $hdr -OutFile $tmp -TimeoutSec 25
      $im = [System.Drawing.Image]::FromFile($tmp)
      $bmp = New-Object System.Drawing.Bitmap -ArgumentList 96, 96
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($im, 0, 0, 96, 96)
      $g.Dispose(); $im.Dispose()
      $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $bmp.Dispose(); Remove-Item $tmp -Force
    } else {
      $im = [System.Drawing.Image]::FromFile($src)
      $bmp = New-Object System.Drawing.Bitmap -ArgumentList 96, 96
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($im, 0, 0, 96, 96)
      $g.Dispose(); $im.Dispose()
      $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $bmp.Dispose()
    }
    $n++
  } catch { $fail++ }
  if (($n % 100) -eq 0) { "assets $n" }
  Start-Sleep -Milliseconds 70
}
"assets done=$n fail=$fail"