$mapping_detail = @{ "students" = 'student-profile.html'; "instructors"='instructor-profile.html'; "courses"='course-details.html'; "library"='books.html'; "finance"='invoice.html'; "attendance"='mark-attendance.html'; "reports"='reports.html' }
$mapping_edit = @{ "students"='edit-student.html'; "instructors"='add-instructor.html'; "courses"='add-course.html'; "library"='add-book.html' }
$mapping_list = @{ "students"='students.html'; "instructors"='instructors.html'; "courses"='courses.html'; "library"='books.html'; "finance"='payments.html'; "attendance"='attendance.html'; "reports"='reports.html' }

Get-ChildItem -Path pages -Recurse -Filter *.html | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $parent = Split-Path $file -Parent | Split-Path -Leaf
    $orig = $content

    # fa-eye -> detail
    if($mapping_detail.ContainsKey($parent)){
        $detail = [regex]::Escape($mapping_detail[$parent])
    } else { $detail = Split-Path $file -Leaf }
    $pattern_eye = '(?is)(<a\b[^>]*href\s*=\s*["\']#(?:"|\')[^>]*>\s*(?:<span[^>]*>\s*)?(?:<i[^>]*class=["\'][^"\']*fa-eye[^"\']*["\'][^>]*>))'
    $content = [regex]::Replace($content, $pattern_eye, { param($m) $m.Value -replace 'href=("|\')#("|\')', "href=\"$detail\"" }, 'IgnoreCase')

    # fa-edit -> edit map
    if($mapping_edit.ContainsKey($parent)) { $edit = [regex]::Escape($mapping_edit[$parent]) } else { $edit = Split-Path $file -Leaf }
    $pattern_edit = '(?is)(<a\b[^>]*href\s*=\s*["\']#(?:"|\')[^>]*>\s*(?:<span[^>]*>\s*)?(?:<i[^>]*class=["\'][^"\']*fa-edit[^"\']*["\'][^>]*>))'
    $content = [regex]::Replace($content, $pattern_edit, { param($m) $m.Value -replace 'href=("|\')#("|\')', "href=\"$edit\"" }, 'IgnoreCase')

    # fa-trash -> list map
    if($mapping_list.ContainsKey($parent)) { $list = [regex]::Escape($mapping_list[$parent]) } else { $list = Split-Path $file -Leaf }
    $pattern_trash = '(?is)(<a\b[^>]*href\s*=\s*["\']#(?:"|\')[^>]*>\s*(?:<span[^>]*>\s*)?(?:<i[^>]*class=["\'][^"\']*fa-trash[^"\']*["\'][^>]*>))'
    $content = [regex]::Replace($content, $pattern_trash, { param($m) $m.Value -replace 'href=("|\')#("|\')', "href=\"$list\"" }, 'IgnoreCase')

    # fa-download/fa-print/file icons -> detail or invoice
    $pattern_down = '(?is)(<a\b[^>]*href\s*=\s*["\']#(?:"|\')[^>]*>\s*(?:<span[^>]*>\s*)?(?:<i[^>]*class=["\'][^"\']*(fa-download|fa-print|fa-file[^"\']*)[^"\']*["\'][^>]*>))'
    $content = [regex]::Replace($content, $pattern_down, { param($m) $m.Value -replace 'href=("|\')#("|\')', "href=\"$detail\"" }, 'IgnoreCase')

    # pagination links: class page-link -> current file name
    $fname = Split-Path $file -Leaf
    $pattern_page = '(?is)(<a\b[^>]*class=["\'][^"\']*page-link[^"\']*["\'][^>]*href=["\'])#(["\'])'
    $content = [regex]::Replace($content, $pattern_page, "$1$fname$2")

    if($content -ne $orig){
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Output "Updated: $file"
    }
}
Write-Output "Regex passthrough complete."