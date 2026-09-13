cd 'C:\Users\qsr\night-web\'
$out = @()
foreach ($l in (git diff --cached --numstat)) {
  $p = $l -split "`t"
  if ($p.Count -lt 3) { continue }
  $f = Join-Path 'C:\Users\qsr\night-web\' $p[2]
  if (Test-Path $f) { $out += [PSCustomObject]@{ kb = [math]::Round((Get-Item $f).Length/1KB,1); path = $p[2] } }
}
$out | Sort-Object kb -Descending | Select-Object -First 25 | Format-Table -AutoSize | Out-String
"total MB: {0:N1}" -f (($out | Measure-Object -Property kb -Sum).Sum / 1024)
"png staged: " + ($out | Where-Object { $_.path -like '*.png' }).Count