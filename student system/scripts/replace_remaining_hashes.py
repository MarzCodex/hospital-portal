from pathlib import Path
import re

root = Path('pages')
files = sorted([p for p in root.rglob('*.html') if p.is_file()])
anchor_re = re.compile(r'(<a\b[^>]*\bhref=(?P<q>["\"])#(?P=q)[^>]*>)(?P<inner>.*?)</a>', re.S|re.I)

# mappings
detail = {
    'students':'student-profile.html',
    'instructors':'instructor-profile.html',
    'courses':'course-details.html',
    'library':'books.html',
    'finance':'invoice.html',
    'attendance':'mark-attendance.html',
    'reports':'analytics-dashboard.html'
}
edit = {
    'students':'edit-student.html',
    'instructors':'add-instructor.html',
    'courses':'add-course.html',
    'library':'add-book.html'
}
listpage = {
    'students':'students.html',
    'instructors':'instructors.html',
    'courses':'courses.html',
    'library':'books.html',
    'finance':'payments.html',
    'attendance':'attendance.html',
    'reports':'reports.html'
}

def choose_target(parent, inner_text, attrs):
    t = None
    it = inner_text.lower()
    # look for fontawesome icons
    ic = re.search(r'fa-[a-z0-9-]+', inner_text)
    icon = ic.group(0) if ic else None
    if icon:
        if 'fa-eye' in icon:
            t = detail.get(parent)
        elif 'fa-edit' in icon:
            t = edit.get(parent)
        elif 'fa-trash' in icon:
            t = listpage.get(parent)
        elif 'fa-download' in icon or 'fa-file' in icon or 'fa-print' in icon:
            if parent=='students': t='student-transcript.html'
            elif parent=='finance': t='invoice.html'
            else: t = detail.get(parent)
    if not t:
        # text cues
        if any(k in it for k in ('edit','add','create')):
            t = edit.get(parent)
        elif any(k in it for k in ('view','details','profile')):
            t = detail.get(parent)
        elif any(k in it for k in ('download','export','print','pdf','transcript')):
            if parent=='students': t='student-transcript.html'
            elif parent=='finance': t='invoice.html'
            else: t = detail.get(parent)
        elif 'page-link' in attrs or re.match(r'^\s*(previous|next|\d+)\s*$', it):
            t = None  # will set to current file
    if not t:
        # fallback to common list/index pages
        t = listpage.get(parent)
    return t

changed = {}
for f in files:
    s = f.read_text(encoding='utf-8', errors='replace')
    if 'href="#"' not in s and "href='#'" not in s:
        continue
    parent = f.parent.name
    def repl(m):
        attrs_text = m.group(1)
        inner = m.group('inner')
        # extract inner text without tags
        inner_text = re.sub(r'<[^>]+>', '', inner).strip()
        target = choose_target(parent, inner_text, attrs_text)
        if not target:
            target = f.name
        # replace the href attribute specifically (keep other attrs)
        new = re.sub(r'href=("|\')#("|\')', f'href=\"{target}\"', attrs_text)
        return f'{new}{inner}</a>'
    new_s = anchor_re.sub(repl, s)
    if new_s != s:
        f.write_text(new_s, encoding='utf-8')
        changed[str(f)] = True

print('Updated files:', len(changed))
for p in changed:
    print(p)
