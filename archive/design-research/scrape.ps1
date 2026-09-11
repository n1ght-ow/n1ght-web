param([string]$Ids, [string]$Out)
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$NL = [string][char]10
$sb = New-Object 'System.Text.StringBuilder'
function Get-Field([string]$h, [string]$name) {
  $m = [regex]::Match($h, '\\"' + $name + '\\":\\"((?:[^"\\]|\\.)*?)\\"')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}
function Get-AllFields([string]$h, [string]$name) {
  $ms = [regex]::Matches($h, '\\"' + $name + '\\":\\"((?:[^"\\]|\\.)*?)\\"')
  $r = @(); foreach ($m in $ms) { $r += $m.Groups[1].Value }; return $r
}
function W($s) { [void]$sb.AppendLine($s) }
foreach ($id in $Ids.Split(',')) {
  $id = $id.Trim(); if (-not $id) { continue }
  $u = 'https://styles.refero.design/style/' + $id
  try { $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 45; $h = $r.Content }
  catch { W ('### ' + $id + ' FETCH-ERROR ' + $_.Exception.Message); continue }
  W ''; W ('=========== ' + $id + '  len=' + $h.Length + ' ===========')
  W ('siteName: ' + (Get-Field $h 'siteName'))
  W ('northStar: ' + (Get-Field $h 'northStar'))
  $cols = [regex]::Matches($h, '\{\\"name\\":\\"((?:[^"\\]|\\.)*?)\\",\\"(?:hex|gradient)\\":\\"((?:[^"\\]|\\.)*?)\\"(?:,\\"role\\":\\"((?:[^"\\]|\\.)*?)\\")?\}')
  W ('-- COLORS (' + $cols.Count + ')')
  foreach ($m in $cols) { W ('  * ' + $m.Groups[1].Value + ' | ' + $m.Groups[2].Value + ' | ' + $m.Groups[3].Value) }
  $fams = Get-AllFields $h 'family'
  W ('-- FONTS: ' + (($fams | Select-Object -Unique) -join ' ; '))
  $roles = [regex]::Matches($h, '\\"role\\":\\"((?:[^"\\]|\\.)*?)\\"')
  W ('-- ROLES (' + $roles.Count + ')')
  foreach ($m in $roles) { W ('  - ' + $m.Groups[1].Value) }
  $sh = [regex]::Matches($h, '\\"element\\":\\"((?:[^"\\]|\\.)*?)\\",\\"style\\":\\"((?:[^"\\]|\\.)*?)\\"')
  W ('-- SHADOWS (' + $sh.Count + ')')
  foreach ($m in $sh) { W ('  > ' + $m.Groups[1].Value + ' => ' + $m.Groups[2].Value) }
  $cp = [regex]::Matches($h, '\{\\"name\\":\\"((?:[^"\\]|\\.)*?)\\",\\"role\\":\\"((?:[^"\\]|\\.)*?)\\"\}')
  W ('-- COMPONENTS (' + $cp.Count + ')')
  foreach ($m in $cp) { W ('  + ' + $m.Groups[1].Value + ' :: ' + $m.Groups[2].Value) }
  $vals = Get-AllFields $h 'value'
  W ('-- VALUES: ' + (($vals | Select-Object -Unique) -join ' | '))
  $ch = [regex]::Matches($h, '\\"children\\":\\"((?:[^"\\]|\\.){25,700}?)\\"')
  W '-- RULES'
  foreach ($m in $ch) { $t = $m.Groups[1].Value; if ($t -match '^(Do|Use|Never|Avoid|Apply|Set|Keep|Reserve|Pair|Treat|Prefer|Maintain|Limit|Ensure|Only|Always|Place|Give|Bold|Italic|Body|Headline|Display|Caption|Label|Small|Large|Medium|Extra|Type|Color|Spacing|Radius|Shadow|Grid|Nav|Hero|Image|Photo|Motion|Icon|Button|Card|Section)') { W ('  = ' + $t) } }
}
$sb.ToString() | Out-File -FilePath $Out -Encoding utf8
Write-Output ('WROTE ' + $Out + ' bytes=' + (Get-Item $Out).Length)