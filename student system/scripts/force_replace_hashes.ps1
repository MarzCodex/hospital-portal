$map = @{
  'students'='students.html';
  'instructors'='instructors.html';
  'courses'='courses.html';
  'library'='books.html';
  'finance'='payments.html';
  'attendance'='attendance.html';
  'reports'='reports.html';
}
Get-ChildItem -Path pages -Recurse -Filter *.html | ForEach-Object {
  $file = $_.FullName
  $parent = Split-Path $file -Parent | Split-Path -Leaf
  if($map.ContainsKey($parent)) { $target = $map[$parent] } else { $target = Split-Path $file -Leaf }
  $text = Get-Content -Path $file -Raw -Encoding UTF8
  if($text -match 'href\s*=\s*"#"' -or $text -match "href\s*=\s*'#'"){
    $new = $text -replace 'href\s*=\s*"#"', "href=\"$target\""
    $new = $new -replace "href\s*=\s*'#'", "href=\"$target\""
    Set-Content -Path $file -Value $new -Encoding UTF8
    Write-Output "Replaced in: $file -> $target"
  }
}
Write-Output "Force replacement done."