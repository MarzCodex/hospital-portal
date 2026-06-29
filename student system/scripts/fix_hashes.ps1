$files = Get-ChildItem -Path pages -Recurse -Filter *.html

foreach($f in $files) {
  $text = Get-Content -Path $f.FullName -Raw -Encoding UTF8
  if($text -notmatch 'href\s*=\s*["\']#') { continue }
  $parent = Split-Path $f.DirectoryName -Leaf
  $fname = Split-Path $f.FullName -Leaf

  # mappings
  $detail = @{
    'students' = 'student-profile.html'
    'instructors' = 'instructor-profile.html'
    'courses' = 'course-details.html'
    'library' = 'books.html'
    'finance' = 'invoice.html'
    'attendance' = 'mark-attendance.html'
    'reports' = 'analytics-dashboard.html'
  }
  $edit = @{
    'students' = 'edit-student.html'
    'instructors' = 'add-instructor.html'
    'courses' = 'add-course.html'
    'library' = 'add-book.html'
  }
  $list = @{
    'students' = 'students.html'
    'instructors' = 'instructors.html'
    'courses' = 'courses.html'
    'library' = 'books.html'
    'finance' = 'payments.html'
    'attendance' = 'attendance.html'
    'reports' = 'reports.html'
  }

  $new = $text -replace '(<a\b[^>]*\bhref\s*=\s*["\'])#(["\'][^>]*>)', '$1__TARGET__$2'

  # replace by icon/text
  $new = [regex]::Replace($new,'__TARGET__(?=[\s\S]*?<i[^>]*class=["\'][^"\']*fa-eye[^"\']*["\'])', ($detail[$parent] -as [string]))
  $new = [regex]::Replace($new,'__TARGET__(?=[\s\S]*?<i[^>]*class=["\'][^"\']*fa-edit[^"\']*["\'])', ($edit[$parent] -as [string]))
  $new = [regex]::Replace($new,'__TARGET__(?=[\s\S]*?<i[^>]*class=["\'][^"\']*fa-trash[^"\']*["\'])', ($list[$parent] -as [string]))
  $new = [regex]::Replace($new,'__TARGET__(?=[\s\S]*?<i[^>]*class=["\'][^"\']*(fa-download|fa-file|fa-print)[^"\']*["\'])', ($detail[$parent] -as [string] -or $fname))

  # pagination links
  $new = $new -replace '(<a[^>]*class=["\'][^"\']*page-link[^"\']*["\'][^>]*href=["\'])#(["\'])', "$1$fname$2"

  # any remaining markers -> default to list or filename
  if($list.ContainsKey($parent)) { $fallback = $list[$parent] } else { $fallback = $fname }
  $new = $new -replace '__TARGET__', $fallback

  if($new -ne $text) {
    Set-Content -Path $f.FullName -Value $new -Encoding UTF8
    Write-Output "Updated: $($f.FullName)"
  }
}
Write-Output "Done"
