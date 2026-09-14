
Add-Type -AssemblyName System.Drawing
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$root = 'C:\Users\qsr\night-web\archive\music-refresh\'
$outDir = 'C:\Users\qsr\night-web\album-covers'
$rows = (Get-Content -LiteralPath ($root + 'batch3-details.json') -Raw -Encoding UTF8) | ConvertFrom-Json
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85L)
$new = 0; $have = 0; $fail = 0; $conv = 0; $map = @()
foreach ($r in $rows) {
  $file = $r.pic.Split('/')[-1]
  $dest = Join-Path $outDir $file
  if (Test-Path $dest) { $have++ } else {
    $ok = $false
    for ($t = 0; $t -lt 4; $t++) {
      try { Invoke-WebRequest -Uri ($r.pic + '?param=500y500') -Headers $hdr -OutFile $dest -TimeoutSec 30 -UseBasicParsing; $ok = $true; break }
      catch { Start-Sleep -Milliseconds (800 * ($t + 1)) }
    }
    if ($ok) { $new++ } else { $fail++; "FAIL $file" }
    Start-Sleep -Milliseconds 250
  }
  if (Test-Path $dest) {
    $b = [System.IO.File]::ReadAllBytes($dest)
    if (-not ($b[0] -eq 0xFF -and $b[1] -eq 0xD8)) {
      $img = [System.Drawing.Image]::FromFile($dest)
      $w = $img.Width; $h = $img.Height; $target = $img
      if ($w -gt 500 -or $h -gt 500) {
        $scale = [Math]::Min(500 / $w, 500 / $h)
        $nw = [int][Math]::Round($w * $scale); $nh = [int][Math]::Round($h * $scale)
        $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $nw, $nh); $g.Dispose(); $target = $bmp
      }
      $tmp = $dest + '.tmp.jpg'
      $target.Save($tmp, $codec, $ep)
      if (-not [object]::ReferenceEquals($target, $img)) { $img.Dispose() }
      $target.Dispose()
      Move-Item -LiteralPath $tmp -Destination $dest -Force
      $conv++
      "  converted $file  $($w)x$($h) -> $([math]::Round((Get-Item $dest).Length/1KB))KB"
    }
  }
  $map += [PSCustomObject]@{ songId="$($r.id)"; title=$r.name; artist=$r.artist; album=$r.album; albumId=$r.albumId; cover=$file }
}
$ep.Dispose()
[System.IO.File]::WriteAllText($root + 'batch3-covers.json', ($map | ConvertTo-Json -Depth 3), (New-Object System.Text.UTF8Encoding($false)))
"covers: existing=$have new=$new fail=$fail converted=$conv"
foreach ($m in $map) { "  $($m.songId) -> $($m.cover)  ($($m.album))" }