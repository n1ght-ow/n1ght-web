param([string]$Ids, [string]$Out)
$ErrorActionPreference='Continue'; $ProgressPreference='SilentlyContinue'
$sb=New-Object 'System.Text.StringBuilder'
function W($s){ [void]$sb.AppendLine([string]$s) }
function Get-Balanced([string]$s,[int]$start){ $depth=0;$i=$start;$inStr=$false;$esc=$false; while($i -lt $s.Length){ $c=$s[$i]; if($inStr){ if($esc){$esc=$false} elseif($c -eq [char]92){$esc=$true} elseif($c -eq [char]34){$inStr=$false} } else { if($c -eq [char]34){$inStr=$true} elseif($c -eq [char]123 -or $c -eq [char]91){$depth++} elseif($c -eq [char]125 -or $c -eq [char]93){$depth--; if($depth -eq 0){ return $s.Substring($start,$i-$start+1) }} } $i++ } return $null }
foreach($id in $Ids.Split(',')){
  $id=$id.Trim(); if(-not $id){continue}
  try{ $r=Invoke-WebRequest -Uri ('https://styles.refero.design/style/'+$id) -UseBasicParsing -TimeoutSec 40; $h=$r.Content } catch { W ('### '+$id+' ERR'); continue }
  $sm=[regex]::Match($h,'\"siteName\":\"((?:[^"\\]|\\.)*?)\"'); $sn=$sm.Groups[1].Value
  $ix=$h.IndexOf('\"result\":{'); if($ix -lt 0){ W ('### '+$id+' NORESULT'); continue }
  $seg=$h.Substring($ix,[Math]::Min(200000,$h.Length-$ix)); $u=[regex]::Unescape($seg)
  $b=$u.IndexOf('{'); $json=Get-Balanced $u $b
  try{ $d=$json | ConvertFrom-Json } catch { W ('### '+$id+' JSONERR '+$_.Exception.Message); continue }
  W ''; W ('#################### '+$id+'  '+$sn)
  $raw=$d.raw
  W ('META viewport=' + $d.meta.viewport.width + 'x' + $d.meta.viewport.height + ' elements=' + $d.meta.elementCount)
  W '-- TOP COLORS BY PROMINENCE (hex | freq | prominence | contexts)'
  $i=0
  foreach($c in ($raw.colors.tokens | Sort-Object -Property prominence -Descending)){ $i++; if($i -gt 12){break}; W ('  '+$i+'. '+$c.hex+' | freq='+$c.frequency+' | prom='+[Math]::Round($c.prominence)+' | '+($c.contexts -join ',')+' | props='+($c.properties -join ',')) }
  W '-- CONTRAST PAIRS'
  foreach($c in $raw.contrastPairs){ W ('  ' + $c.foreground + ' on ' + $c.background + ' = ' + $c.ratio + ' [' + $c.level + '] ctx=' + ($c.contexts -join ',') + ' freq=' + $c.frequency) }
  W ('-- SPACING raw: ' + ($raw.spacing | ConvertTo-Json -Compress -Depth 6))
  W ('-- RADII raw: ' + ($raw.radii | ConvertTo-Json -Compress -Depth 6))
  W ('-- SHAPES raw: ' + ($raw.shapes | ConvertTo-Json -Compress -Depth 6))
  W ('-- SHADOWS raw: ' + ($raw.shadows | ConvertTo-Json -Compress -Depth 6))
  W ('-- GRADIENTS raw: ' + ($raw.gradients | ConvertTo-Json -Compress -Depth 6))
  W ('-- TYPO raw: ' + ($raw.typography | ConvertTo-Json -Compress -Depth 6))
}
$sb.ToString() | Out-File -FilePath $Out -Encoding utf8
Write-Output ('WROTE ' + (Get-Item $Out).Length)