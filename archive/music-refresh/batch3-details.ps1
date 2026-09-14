
$hdr = @{'User-Agent'='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'; 'Referer'='https://music.163.com/'}
$root = 'C:\Users\qsr\night-web\archive\music-refresh\'
$picks = (Get-Content -LiteralPath ($root + 'batch3-picks.json') -Raw -Encoding UTF8) | ConvertFrom-Json
$ids = ($picks | ForEach-Object { $_.id }) -join ','
$url = 'https://music.163.com/api/song/detail?ids=%5B' + $ids + '%5D'
$r = Invoke-RestMethod -Uri $url -Headers $hdr -TimeoutSec 40
$rows = @()
foreach ($s in $r.songs) {
  $rows += [PSCustomObject]@{
    id = "$($s.id)"; name = $s.name;
    artist = (($s.artists | ForEach-Object { $_.name }) -join ' / ');
    album = $s.album.name; albumId = "$($s.album.id)";
    pic = $s.album.picUrl; dur = "$([int]([math]::Floor($s.duration/60000))):$('{0:d2}' -f [int]([math]::Floor(($s.duration % 60000)/1000)))";
    alia = (($s.alia) -join ' | ')
  }
}
[System.IO.File]::WriteAllText($root + 'batch3-details.json', ($rows | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
foreach ($x in $rows) { "$($x.id) | $($x.name) | $($x.artist) | $($x.album) | $($x.dur) | alia=[$($x.alia)] | $($x.pic)" }
