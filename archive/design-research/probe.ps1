param([string]$Id)
$ProgressPreference='SilentlyContinue'
$r=Invoke-WebRequest -Uri ('https://styles.refero.design/style/'+$Id) -UseBasicParsing -TimeoutSec 40
$h=$r.Content
$ix=$h.IndexOf('designSystem')
$seg=$h.Substring($ix,[Math]::Min(70000,$h.Length-$ix))
$u=[regex]::Unescape($seg)
$b=$u.IndexOf('{')
function Get-Balanced([string]$s,[int]$start){ $depth=0;$i=$start;$inStr=$false;$esc=$false; while($i -lt $s.Length){ $c=$s[$i]; if($inStr){ if($esc){$esc=$false} elseif($c -eq [char]92){$esc=$true} elseif($c -eq [char]34){$inStr=$false} } else { if($c -eq [char]34){$inStr=$true} elseif($c -eq [char]123 -or $c -eq [char]91){$depth++} elseif($c -eq [char]125 -or $c -eq [char]93){$depth--; if($depth -eq 0){ return $s.Substring($start,$i-$start+1) }} } $i++ } return $null }
$json=Get-Balanced $u $b
$d=$json | ConvertFrom-Json
Write-Output '=== TOP LEVEL KEYS ==='
$d.PSObject.Properties | ForEach-Object { Write-Output ($_.Name + ' : ' + $_.TypeNameOfValue) }
Write-Output '=== typography JSON ==='
$d.typography | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== typeScale JSON ==='
$d.typeScale | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== radii ==='
$d.radii | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== shapes ==='
$d.shapes | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== shadows ==='
$d.shadows | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== gradients ==='
$d.gradients | ConvertTo-Json -Depth 6 -Compress
Write-Output '=== contrastPairs ==='
$d.contrastPairs | ConvertTo-Json -Depth 6 -Compress