param([string]$Ids, [string]$Out)
$ErrorActionPreference='Continue'
$ProgressPreference='SilentlyContinue'
$sb=New-Object 'System.Text.StringBuilder'
function W($s){ [void]$sb.AppendLine([string]$s) }
function Get-Balanced([string]$s,[int]$start){
  $depth=0; $i=$start; $inStr=$false; $esc=$false
  while($i -lt $s.Length){
    $c=$s[$i]
    if($inStr){ if($esc){$esc=$false} elseif($c -eq [char]92){$esc=$true} elseif($c -eq [char]34){$inStr=$false} }
    else { if($c -eq [char]34){$inStr=$true} elseif($c -eq [char]123 -or $c -eq [char]91){$depth++} elseif($c -eq [char]125 -or $c -eq [char]93){$depth--; if($depth -eq 0){ return $s.Substring($start,$i-$start+1) }} }
    $i++
  }
  return $null
}
foreach($id in $Ids.Split(',')){
  $id=$id.Trim(); if(-not $id){continue}
  try{ $r=Invoke-WebRequest -Uri ('https://styles.refero.design/style/'+$id) -UseBasicParsing -TimeoutSec 45; $h=$r.Content }
  catch{ W ('### '+$id+' FETCH-ERROR '+$_.Exception.Message); continue }
  $ix = $h.IndexOf('designSystem')
  if($ix -lt 0){ W ('### '+$id+' NO designSystem'); continue }
  $seg = $h.Substring($ix, [Math]::Min(70000, $h.Length-$ix))
  $u = [regex]::Unescape($seg)
  $u = $u.Replace(':$undefined',':null').Replace(':$undefined,',',')
  $b = $u.IndexOf('{')
  if($b -lt 0){ W ('### '+$id+' NO BRACE'); continue }
  $json = Get-Balanced $u $b
  if(-not $json){ W ('### '+$id+' UNBALANCED'); continue }
  try{ $d = $json | ConvertFrom-Json } catch { W ('### '+$id+' JSON-ERR '+$_.Exception.Message); W ($json.Substring(0,600)); continue }
  W ''; W ('#################### '+$id)
  W ('theme=' + $d.theme + '  industry=' + $d.industry)
  W ('northStar: ' + $d.northStar)
  W ('northStarDetail: ' + $d.northStarDetail)
  W ('LAYOUT: ' + $d.layout)
  W ('IMAGERY: ' + $d.imagery)
  W ('-- COLOR TOKENS')
  foreach($c in $d.colors){ W ('  [' + $c.group + '] ' + $c.name + ' ' + $c.hex + ' :: ' + $c.role) }
  W ('-- SURFACES')
  foreach($s in $d.surfaces){ W ('  L' + $s.level + ' ' + $s.name + ' ' + $s.hex + ' :: ' + $s.purpose) }
  W ('-- TYPE')
  if($d.typography){
    foreach($f in $d.typography.fonts){ W ('  FONT ' + $f.family + ' | weights=' + ($f.weights -join '/') + ' | src=' + $f.source + ' | subst=' + $f.substitute + ' | feats=' + $f.fontFeatureSettings) }
    W ('  BASE ' + $d.typography.base) 
    foreach($st in $d.typography.scale.steps){ W ('  STEP ' + $st.role + '/' + $st.name + ' size=' + $st.size + ' w=' + $st.weight + ' lh=' + $st.lineHeight + ' ls=' + $st.letterSpacing + ' tt=' + $st.textTransform) }
  }
  W ('-- SPACING')
  if($d.spacing){
    W ('  baseUnit=' + $d.spacing.baseUnit + ' density=' + $d.spacing.density + ' elementGap=' + $d.spacing.elementGap + ' sectionGap=' + $d.spacing.sectionGap + ' cardPadding=' + $d.spacing.cardPadding + ' pageMaxWidth=' + $d.spacing.pageMaxWidth)
    foreach($st in $d.spacing.scale.steps){ W ('  SP ' + $st.role + '/' + $st.name + ' = ' + $st.value) }
    if($d.spacing.radius){ foreach($p in $d.spacing.radius.PSObject.Properties){ W ('  RADIUS ' + $p.Name + ' = ' + $p.Value) } }
  }
  W ('-- RADII/SHAPES: ' + ($d.radii | ConvertTo-Json -Compress -Depth 4))
  W ('-- SHADOWS')
  foreach($s in $d.shadows){ W ('  ' + $s.element + ' => ' + $s.style) }
  W ('-- GRADIENTS: ' + ($d.gradients | ConvertTo-Json -Compress -Depth 4))
  W ('-- CONTRAST PAIRS')
  foreach($c in $d.contrastPairs){ W ('  ' + $c.foreground + ' on ' + $c.background + ' = ' + $c.ratio + ' (' + $c.level + ') ctx=' + ($c.contexts -join ',')) }
  W ('-- COMPONENTS')
  foreach($c in $d.components){ W ('  + ' + $c.name + ' :: ' + $c.role + ' :: ' + $c.description) }
  W ('-- DOS')
  foreach($x in $d.dos){ W ('  DO ' + $x) }
  W ('-- DONTS')
  foreach($x in $d.donts){ W ('  DONT ' + $x) }
  W ('-- CUSTOM SECTIONS')
  foreach($x in $d.customSections){ W ('  [' + $x.title + '] ' + $x.content) }
  W ('-- PROPERTIES: ' + ($d.properties -join ' | '))
  W ('-- PROPCTX: ' + ($d.propertyContextPairs | ConvertTo-Json -Compress -Depth 5))
}
$sb.ToString() | Out-File -FilePath $Out -Encoding utf8
Write-Output ('WROTE ' + $Out + ' bytes=' + (Get-Item $Out).Length)