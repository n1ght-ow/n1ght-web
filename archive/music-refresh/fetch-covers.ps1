Add-Type -AssemblyName System.Drawing
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$outDir = 'C:\Users\qsr\night-web\album-covers'
$new = 0; $have = 0; $fail = 0
foreach ($line in (Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\cover-plan.tsv' -Encoding UTF8)) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $file = $f[0]; $url = $f[1]
  $dest = Join-Path $outDir $file
  if (Test-Path $dest) { $have++; continue }
  $ok = $false
  for ($try = 0; $try -lt 4; $try++) {
    try {
      $u = if ($url -match '\?') { $url + '&param=500y500' } else { $url + '?param=500y500' }
      Invoke-WebRequest -Uri $u -Headers $hdr -OutFile $dest -TimeoutSec 30
      $ok = $true; break
    } catch { Start-Sleep -Milliseconds (800 * ($try + 1)) }
  }
  if ($ok) { $new++ } else { $fail++; "FAIL $file" }
  Start-Sleep -Milliseconds 120
}
"covers: existing=$have new=$new fail=$fail"