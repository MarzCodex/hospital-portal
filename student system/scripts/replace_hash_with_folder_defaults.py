from pathlib import Path
import re

root = Path('pages')
html_files = sorted(root.glob('**/*.html'))

pattern = re.compile(r'href=("|\')#("|\')')

updated = 0
files = []
for f in html_files:
    text = f.read_text(encoding='utf-8', errors='replace')
    if '#"' not in text and "#'" not in text and 'href="#"' not in text:
        # still check general
        pass
    if 'href="#"' not in text and "href='#'" not in text:
        continue
    parent = f.parent
    parent_name = parent.name
    candidates = [
        parent / f"{parent_name}.html",
        parent / 'index.html',
        parent / 'books.html',
        parent / 'students.html',
        parent / 'instructors.html',
        parent / 'courses.html',
        parent / 'payments.html',
        parent / 'invoice.html',
        parent / 'attendance.html',
        parent / 'reports.html',
        parent / 'library.html'
    ]
    chosen = None
    for c in candidates:
        if c.exists():
            chosen = c.name
            break
    if not chosen:
        chosen = f.name
    new_text = pattern.sub(f'href="{chosen}"', text)
    if new_text != text:
        f.write_text(new_text, encoding='utf-8')
        updated += new_text.count(f'href="{chosen}"')
        files.append(str(f))

print(f'Updated {updated} links in {len(files)} files')
for p in files:
    print(p)
