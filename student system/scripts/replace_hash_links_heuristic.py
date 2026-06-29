from pathlib import Path
import re

root = Path('pages')
html_files = sorted(root.glob('**/*.html'))

# directory-based defaults
dir_defaults = {
    'students': 'students.html',
    'instructors': 'instructors.html',
    'courses': 'courses.html',
    'library': 'books.html',
    'finance': 'payments.html',
    'attendance': 'attendance.html',
    'reports': 'reports.html',
    'auth': 'login.html',
    'timetable': 'timetable.html'
}

# icon-based mapping per directory
icon_map = {
    'fa-eye': {
        'students': 'student-profile.html',
        'instructors': 'instructor-profile.html',
        'courses': 'course-details.html',
        'library': 'books.html',
        'finance': 'invoice.html',
        'attendance': 'mark-attendance.html'
    },
    'fa-edit': {
        'students': 'edit-student.html',
        'instructors': 'add-instructor.html',
        'courses': 'add-course.html',
        'library': 'add-book.html'
    },
    'fa-trash': {
        'students': 'students.html',
        'instructors': 'instructors.html',
        'courses': 'courses.html',
        'library': 'books.html'
    },
    'fa-download': {
        'students': 'student-transcript.html',
        'finance': 'invoice.html',
        'reports': 'analytics-dashboard.html',
        'attendance': 'attendance-report.html'
    },
    'fa-print': {
        'students': 'student-transcript.html',
        'finance': 'invoice.html'
    }
}

# text cues mapping
text_map = {
    'mark attendance': ('attendance','mark-attendance.html'),
    'export report': ('reports','analytics-dashboard.html'),
    'export results': ('students','student-transcript.html'),
    'print transcript': ('students','student-transcript.html'),
    'download pdf': ('students','student-transcript.html'),
    'create invoice': ('finance','invoice.html'),
    'new transaction': ('finance','payments.html'),
    'add payment': ('finance','payments.html'),
    'add course': ('courses','add-course.html'),
    'add instructor': ('instructors','add-instructor.html'),
    'add book': ('library','add-book.html'),
    'new scholarship': ('finance','scholarships.html')
}

anchor_pattern = re.compile(r'<a\s+([^>]*?)href=["\']#(?:"|\')([^>]*)>(.*?)</a>', re.S|re.I)

updated_count = 0
files_changed = []

for f in html_files:
    text = f.read_text(encoding='utf-8', errors='replace')
    original = text
    dir_name = f.parent.name

    def repl(m):
        nonlocal updated_count
        attrs = m.group(1)
        after_attrs = m.group(2)
        inner = m.group(3)
        inner_text = re.sub(r'<[^>]+>', '', inner).strip().lower()
        target = None
        # text-based cues
        for cue, (d, tgt) in text_map.items():
            if cue in inner_text:
                target = tgt
                break
        if not target:
            # icon-based
            icon_match = re.search(r'fa-[a-z0-9-]+', inner)
            if icon_match:
                icon = icon_match.group(0)
                if icon in icon_map and dir_name in icon_map[icon]:
                    target = icon_map[icon][dir_name]
        if not target:
            # pagination or page links
            if 'page-link' in attrs or inner_text in {'previous','next','1','2','3'}:
                target = f.name
        if not target:
            # button classes hints
            if 'btn btn-primary' in attrs or 'btn btn-success' in attrs or 'btn btn-sm btn-primary' in attrs:
                # default to a detail or create page depending on verbs
                if any(w in inner_text for w in ('view','details','profile','report','invoice','download','print')):
                    target = dir_defaults.get(dir_name, f.name)
                elif any(w in inner_text for w in ('add','create','new','generate','mark')):
                    # map to add/create pages
                    if dir_name == 'students':
                        target = 'add-student.html'
                    elif dir_name == 'instructors':
                        target = 'add-instructor.html'
                    elif dir_name == 'courses':
                        target = 'add-course.html'
                    elif dir_name == 'library':
                        target = 'add-book.html'
                    elif dir_name == 'finance':
                        target = 'invoice.html'
                    else:
                        target = dir_defaults.get(dir_name, f.name)
        if not target:
            target = dir_defaults.get(dir_name, f.name)
        updated_count += 1
        new_attrs = attrs.replace("href=\"#\"", f'href="{target}"')
        return f'<a {new_attrs}>{inner}</a>'

    text = anchor_pattern.sub(repl, text)
    if text != original:
        f.write_text(text, encoding='utf-8')
        files_changed.append(str(f))

print(f'Updated {updated_count} anchors in {len(files_changed)} files')
for p in files_changed:
    print(p)
