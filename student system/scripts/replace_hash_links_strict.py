from pathlib import Path
import re

root = Path('pages')
html_files = sorted(root.glob('**/*.html'))

# mapping by folder for common actions
folder_detail = {
    'students': 'student-profile.html',
    'instructors': 'instructor-profile.html',
    'courses': 'course-details.html',
    'library': 'books.html',
    'finance': 'invoice.html',
    'attendance': 'mark-attendance.html',
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
}

pattern = re.compile(r'(<a\b[^>]*\bhref=["\']#['"\'][^>]*>)(.*?)</a>', re.S|re.I)

replacements_log = []

for f in html_files:
    text = f.read_text(encoding='utf-8', errors='replace')
    orig = text
    def fn(m):
        attrs = m.group(1)
        inner = m.group(2)
        inner_text = re.sub(r'<[^>]+>', '', inner).strip().lower()
        parent = f.parent.name
        new_href = None
        # try icons
        icon = None
        im = re.search(r'class=["\'][^"\']*(fa-[a-z0-9-]+)[^"\']*["\']', inner)
        if im:
            icon = im.group(1)
        # icon rules
        if icon == 'fa-eye':
            new_href = folder_detail.get(parent, None)
        elif icon == 'fa-edit':
            new_href = folder_edit.get(parent, None)
        elif icon == 'fa-trash':
            new_href = folder_list.get(parent, None)
        elif icon in ('fa-download','fa-file-export','fa-file-pdf','fa-file-excel','fa-file-word'):
            if parent == 'students':
                new_href = 'student-transcript.html'
            elif parent == 'finance':
                new_href = 'invoice.html'
            elif parent == 'reports':
                new_href = 'analytics-dashboard.html'
            else:
                new_href = folder_detail.get(parent, None)
        elif 'page-link' in attrs or re.match(r'^(previous|next|\d+)$', inner_text):
            new_href = f.name
        # text cues
        if not new_href:
            if 'edit' in inner_text or 'add' in inner_text or 'create' in inner_text:
                new_href = folder_edit.get(parent, folder_list.get(parent, f.name))
            elif 'download' in inner_text or 'export' in inner_text or 'print' in inner_text:
                if parent == 'students':
                    new_href = 'student-transcript.html'
                elif parent == 'finance':
                    new_href = 'invoice.html'
                else:
                    new_href = folder_detail.get(parent, f.name)
            elif 'view' in inner_text or 'details' in inner_text or 'profile' in inner_text:
                new_href = folder_detail.get(parent, f.name)
            elif 'mark attendance' in inner_text:
                new_href = 'mark-attendance.html'
            elif 'export report' in inner_text:
                new_href = 'analytics-dashboard.html'
        # fallback
        if not new_href:
            new_href = folder_list.get(parent, f.name)
        # replace href within attrs
        new_attrs = re.sub(r'href=["\']#['"\']', f'href="{new_href}"', attrs)
        replacements_log.append((str(f), inner_text[:60], new_href))
        return f'{new_attrs}{inner}</a>'
    new_text = pattern.sub(fn, text)
    if new_text != orig:
        f.write_text(new_text, encoding='utf-8')

print('done')
for r in replacements_log[:200]:
    print(r)
