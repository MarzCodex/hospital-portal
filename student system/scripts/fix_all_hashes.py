from pathlib import Path
import re

root = Path('pages')
files = sorted([p for p in root.rglob('*.html') if p.is_file()])

icon_re = re.compile(r'fa-[a-z0-9-]+', re.I)
class_re = re.compile(r'class\s*=\s*["\']([^"\']*)["\']', re.I)
strip_tags = re.compile(r'<[^>]+>')

folder_detail = {
    'students': 'student-profile.html',
    'instructors': 'instructor-profile.html',
    'courses': 'course-details.html',
    'library': 'books.html',
    'finance': 'invoice.html',
    'attendance': 'mark-attendance.html',
    'reports': 'financial-reports.html',
}
folder_edit = {
    'students': 'edit-student.html',
    'instructors': 'add-instructor.html',
    'courses': 'add-course.html',
    'library': 'add-book.html',
}
folder_list = {
    'students': 'students.html',
    'instructors': 'instructors.html',
    'courses': 'courses.html',
    'library': 'books.html',
    'finance': 'payments.html',
    'attendance': 'attendance.html',
    'reports': 'reports.html',
}
folder_download = {
    'students': 'student-transcript.html',
    'finance': 'invoice.html',
    'reports': 'financial-reports.html',
    'attendance': 'attendance-report.html',
}
folder_add = {
    'students': 'add-student.html',
    'instructors': 'add-instructor.html',
    'courses': 'add-course.html',
    'library': 'add-book.html',
    'attendance': 'mark-attendance.html',
}

anchor_re = re.compile(r'(<a\b[^>]*?\bhref\s*=\s*["\"]#(["\"][^>]*>))(.*?</a>)', re.S|re.I)
changed_files = []


def choose_target(parent, inner, attrs, filename):
    lower = strip_tags.sub('', inner).lower().strip()
    cls = ''
    mcls = class_re.search(attrs)
    if mcls:
        cls = mcls.group(1).lower()
    icon = None
    mic = icon_re.search(inner)
    if mic:
        icon = mic.group(0).lower()

    if 'page-link' in cls or 'pagination' in cls:
        return filename
    if icon == 'fa-eye' or ' view' in lower or lower == 'view':
        return folder_detail.get(parent, filename)
    if icon == 'fa-edit' or ' edit' in lower or lower == 'edit':
        return folder_edit.get(parent, folder_list.get(parent, filename))
    if icon == 'fa-trash' or ' delete' in lower or lower == 'delete':
        return folder_list.get(parent, filename)
    if icon and ('fa-download' in icon or 'fa-print' in icon or 'fa-file' in icon):
        return folder_download.get(parent, folder_detail.get(parent, filename))
    if 'download' in lower or 'export' in lower:
        return folder_download.get(parent, folder_detail.get(parent, filename))
    if 'print' in lower:
        return folder_download.get(parent, folder_detail.get(parent, filename))
    if 'new transaction' in lower:
        return 'payments.html'
    if 'add record' in lower:
        return 'mark-attendance.html'
    if 'revenue report' in lower or 'expense report' in lower or 'outstanding fees' in lower or 'payroll report' in lower:
        return 'financial-reports.html'
    if 'add' in lower and not 'address' in lower:
        return folder_add.get(parent, folder_list.get(parent, filename))
    if parent == 'finance' and 'invoice' in lower:
        return 'invoice.html'
    if parent == 'attendance' and 'mark' in lower:
        return 'mark-attendance.html'
    if parent == 'library' and ('borrowed' in lower or 'overdue' in lower):
        return 'books.html'
    if parent in folder_list:
        return folder_list[parent]
    return filename

for f in files:
    text = f.read_text(encoding='utf-8', errors='replace')
    if 'href="#"' not in text and "href='#'" not in text:
        continue
    original = text
    parent = f.parent.name
    filename = f.name

    def repl(match):
        attrs = match.group(1)
        inner = match.group(3)
        target = choose_target(parent, inner, attrs, filename)
        return re.sub(r'href\s*=\s*["\"]#(["\"])', f'href="{target}"', match.group(0), count=1)

    new_text = anchor_re.sub(repl, text)
    if new_text != original:
        f.write_text(new_text, encoding='utf-8')
        changed_files.append(str(f))

print('Changed files:', len(changed_files))
for p in changed_files:
    print(p)
