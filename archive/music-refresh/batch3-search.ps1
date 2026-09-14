
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$root = 'C:\Users\qsr\night-web\archive\music-refresh\'
$queries = (Get-Content -LiteralPath ($root + 'batch3-queries.json') -Raw -Encoding UTF8) | ConvertFrom-Json
$out = @()
foreach ($item in $queries) {
  $url = 'https://music.163.com/api/search/get/web?s=' + [uri]::EscapeDataString($item.q) + '&type=1&offset=0&limit=8'
  $rows = @(); $code = $null; $err = $null
  for ($t = 0; $t -lt 4; $t++) {
    $rows = @()
    try {
      $r = Invoke-RestMethod -Uri $url -Headers $hdr -TimeoutSec 30
      $code = $r.code
      if ($r.result -and $r.result.songs) {
        foreach ($s in $r.result.songs) {
          $rows += [PSCustomObject]@{
            id = "$($s.id)"; name = $s.name;
            artists = (($s.artists | ForEach-Object { $_.name }) -join ' / ');
            album = $s.album.name; albumId = "$($s.album.id)";
            dur = "$([int]([math]::Floor($s.duration/60000))):$('{0:d2}' -f [int]([math]::Floor(($s.duration % 60000)/1000)))"
          }
        }
      }
    } catch { $err = $_.Exception.Message }
    if ($rows.Count -gt 0) { break }
    Start-Sleep -Milliseconds (1200 * ($t + 1))
  }
  $rec = [PSCustomObject]@{ q = $item.q; expect = $item.expect; code = $code; results = $rows }
  if ($err) { $rec | Add-Member -NotePropertyName error -NotePropertyValue $err }
  $out += $rec
  Start-Sleep -Milliseconds 900
}
[System.IO.File]::WriteAllText($root + 'batch3-search.json', ($out | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false)))
$i = 0
foreach ($o in $out) {
  $i++
  "== Q$i  $($o.q)  code=$($o.code)  n=$(@($o.results).Count)   [want: $($o.expect.title) | $($o.expect.artist) | $($o.expect.album) | $($o.expect.dur)]"
  foreach ($s in $o.results) { "   $($s.id) | $($s.name) | $($s.artists) | $($s.album) | $($s.dur)" }
  if ($o.error) { "   ERR $($o.error)" }
}
