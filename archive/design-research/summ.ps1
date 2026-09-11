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
  try{ $r=Invoke-WebRequest -Uri ('https://styles.refero.design/style/'+$id) -UseBasicParsing -TimeoutSec 40; $h=$r.Content }
  catch{ W ($id+' | FETCH-ERROR'); continue }
  $cat=''; $m=[regex]::Match($h,'\"article:section\",\"content\":\"((?:[^"\\]|\\.)*?)\"'); if($m.Success){$cat=$m.Groups[1].Value}
  $ix = $h.IndexOf('designSystem'); if($ix -lt 0){ W ($id+' | NO-DS'); continue }
  $seg = $h.Substring($ix, [Math]::Min(70000, $h.Length-$ix))
  $u = [regex]::Unescape($seg)
  $b = $u.IndexOf('{'); if($b -lt 0){ W ($id+' | NOBRACE'); continue }
  $json = Get-Balanced $u $b
  try{ $d = $json | ConvertFrom-Json } catch { W ($id+' | JSONERR'); continue }
  $sm = [regex]::Match($h,'\"siteName\":\"((?:[^"\\]|\\.)*?)\"'); $sn=$sm.Groups[1].Value
  $fonts=@(); if($d.typography -and $d.typography.fonts){ foreach($f in $d.typography.fonts){ if($f.family){$fonts+=$f.family} } }
  $pmw=''; $sg=''; $cp=''; $bu=''; $den=''
  if($d.spacing){ $pmw=$d.spacing.pageMaxWidth; $sg=$d.spacing.sectionGap; $cp=$d.spacing.cardPadding; $bu=$d.spacing.baseUnit; $den=$d.spacing.density }
  W ($id+' | '+$sn+' | '+$cat+' | theme='+$d.theme+' | ind='+$d.industry+' | mw='+$pmw+' secGap='+$sg+' cardPad='+$cp+' base='+$bu+' dens='+$den+' | fonts='+($fonts -join '/')+' | NS='+$d.northStar)
}
$sb.ToString() | Out-File -FilePath $Out -Encoding utf8
Write-Output ('WROTE ' + (Get-Item $Out).Length)