param([string]$Ids, [string]$Out)
$ErrorActionPreference='Continue'
$ProgressPreference='SilentlyContinue'
$sb=New-Object 'System.Text.StringBuilder'
function W($s){ [void]$sb.AppendLine([string]$s) }
function Get-Balanced([string]$s,[int]$start){ $depth=0;$i=$start;$inStr=$false;$esc=$false; while($i -lt $s.Length){ $c=$s[$i]; if($inStr){ if($esc){$esc=$false} elseif($c -eq [char]92){$esc=$true} elseif($c -eq [char]34){$inStr=$false} } else { if($c -eq [char]34){$inStr=$true} elseif($c -eq [char]123 -or $c -eq [char]91){$depth++} elseif($c -eq [char]125 -or $c -eq [char]93){$depth--; if($depth -eq 0){ return $s.Substring($start,$i-$start+1) }} } $i++ } return $null }
foreach($id in $Ids.Split(',')){
  $id=$id.Trim(); if(-not $id){continue}
  try{ $r=Invoke-WebRequest -Uri ('https://styles.refero.design/style/'+$id) -UseBasicParsing -TimeoutSec 40; $h=$r.Content } catch { W ('### '+$id+' ERR'); continue }
  $sm=[regex]::Match($h,'\"siteName\":\"((?:[^"\\]|\\.)*?)\"'); $sn=$sm.Groups[1].Value
  $um=[regex]::Match($h,'\"url\":\"(https?://[^"\\]*?)\",\"siteName'); $url=$um.Groups[1].Value
  $ix=$h.IndexOf('designSystem'); if($ix -lt 0){ W ('### '+$id+' NODS'); continue }
  $seg=$h.Substring($ix,[Math]::Min(70000,$h.Length-$ix)); $u=[regex]::Unescape($seg)
  $b=$u.IndexOf('{'); $json=Get-Balanced $u $b
  try{ $d=$json | ConvertFrom-Json } catch { W ('### '+$id+' JSONERR'); continue }
  W ''; W ('#################### '+$id+'  '+$sn+'  '+$url)
  W ('theme='+$d.theme+' industry='+$d.industry)
  W ('northStar: '+$d.northStar)
  W ('northStarDetail: '+$d.northStarDetail)
  W ('DESCRIPTION: '+$d.description)
  W ('LAYOUT: '+$d.layout)
  W ('IMAGERY: '+$d.imagery)
  W '-- COLORS'
  foreach($c in $d.colors){ W ('  ['+$c.group+'] '+$c.name+' '+$c.hex+' :: '+$c.role) }
  W '-- SURFACES'
  foreach($s in $d.surfaces){ W ('  L'+$s.level+' '+$s.name+' '+$s.hex+' :: '+$s.purpose) }
  W '-- TYPE'
  foreach($f in $d.typography){ W ('  FAM '+$f.family+' | sizes='+$f.sizes+' | w='+$f.weight+' | lh='+$f.lineHeight+' | ls='+$f.letterSpacing+' | sub='+$f.substitute+' | feat='+$f.fontFeatureSettings); W ('      ROLE: '+$f.role) }
  foreach($st in $d.typeScale){ W ('  SCALE '+$st.role+' = '+$st.size+'px / lh '+$st.lineHeight+' / ls '+$st.letterSpacing) }
  W '-- SPACING'
  if($d.spacing){ W ('  baseUnit='+$d.spacing.baseUnit+' density='+$d.spacing.density+' elementGap='+$d.spacing.elementGap+' sectionGap='+$d.spacing.sectionGap+' cardPadding='+$d.spacing.cardPadding+' pageMaxWidth='+$d.spacing.pageMaxWidth); W ('  radius: '+($d.spacing.radius | ConvertTo-Json -Compress)); if($d.spacing.scale){ W ('  scale: '+($d.spacing.scale | ConvertTo-Json -Compress -Depth 5)) } }
  W '-- ELEVATION'
  foreach($e in $d.elevation){ W ('  '+$e.element+' => '+$e.style) }
  W '-- COMPONENTS'
  foreach($c in $d.components){ W ('  + '+$c.name+' :: '+$c.role); if($c.description){ W ('      '+$c.description) } }
  W '-- DOS'
  foreach($x in $d.dos){ W ('  DO '+$x) }
  W '-- DONTS'
  foreach($x in $d.donts){ W ('  DONT '+$x) }
  W '-- CUSTOM'
  foreach($x in $d.customSections){ W ('  ['+$x.title+'] '+$x.content) }
  W '-- SIMILAR'
  foreach($x in $d.similar){ W ('  ~ '+$x.business+' because '+$x.why) }
}
$sb.ToString() | Out-File -FilePath $Out -Encoding utf8
Write-Output ('WROTE bytes=' + (Get-Item $Out).Length)