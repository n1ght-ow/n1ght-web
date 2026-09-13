$sep = [char]9
$missing = @()
foreach ($l in (Get-Content -LiteralPath 'C:\Users\qsr\night-web\archive\music-refresh\cover-plan.tsv' -Encoding UTF8)) {
  if (-not $l.Trim()) { continue }
  $f = ($l -split $sep)[0]
  if (-not (Test-Path (Join-Path 'C:\Users\qsr\night-web\album-covers' $f))) { $missing += $f }
}
'missing: ' + $missing.Count
$missing -join ','