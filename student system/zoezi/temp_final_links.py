from pathlib import Path
import re

root = Path('pages')

# One-pass batch replacement of all table action links
files_and_ops = [
    # students/students.html - table action links
    ('students/students.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-success[^>]*>\\s*<i class="fa fa-edit)', 
         r'href="edit-student.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-danger[^>]*>\\s*<i class="fa fa-trash)',
         r'href="students.html"\1'),
        # pagination
        (r'<a class="page-link" href="#">', r'<a class="page-link" href="students.html">'),
    ]),
    # instructors/instructors.html  
    ('instructors/instructors.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-[a-z-]*[^>]*>\\s*<i class="fa fa-eye)',
         r'href="instructor-profile.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-[a-z-]*[^>]*>\\s*<i class="fa fa-edit)',
         r'href="add-instructor.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-[a-z-]*[^>]*>\\s*<i class="fa fa-trash)',
         r'href="instructors.html"\1'),
    ]),
    # courses/courses.html
    ('courses/courses.html', [
        (r'href="#"(\\s+class="btn btn-[a-z-]*[^>]*>\\s*<i class="fa fa-eye)',
         r'href="course-details.html"\1'),
        (r'href="#"(\\s+class="btn btn-[a-z-]*[^>]*>\\s*<i class="fa fa-edit)',
         r'href="add-course.html"\1'),
        (r'href="#"(\\s+class="btn btn-[a-z-]*[^>]*>\\s*<i class="fa fa-trash)',
         r'href="courses.html"\1'),
    ]),
    # library/books.html
    ('library/books.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-primary[^>]*>\\s*<i class="fa fa-eye)',
         r'href="books.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-warning[^>]*>\\s*<i class="fa fa-edit)',
         r'href="add-book.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-danger[^>]*>\\s*<i class="fa fa-trash)',
         r'href="books.html"\1'),
    ]),
    # finance/invoices.html
    ('finance/invoices.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-primary[^>]*>\\s*<i class="fa fa-eye)',
         r'href="invoice.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-success[^>]*>\\s*<i class="fa fa-download)',
         r'href="invoice.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-secondary[^>]*>\\s*<i class="fa fa-print)',
         r'href="invoice.html"\1'),
    ]),
    # finance/payments.html
    ('finance/payments.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-primary[^>]*>\\s*<i class="fa fa-eye)',
         r'href="invoice.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-success[^>]*>\\s*<i class="fa fa-download)',
         r'href="invoice.html"\1'),
    ]),
    # attendance/attendance.html
    ('attendance/attendance.html', [
        (r'href="#"(\\s+class="btn btn-sm btn-success[^>]*>\\s*<i class="fa fa-edit)',
         r'href="mark-attendance.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-danger[^>]*>\\s*<i class="fa fa-trash)',
         r'href="attendance.html"\1'),
    ]),
    # finance/financial-reports.html
    ('finance/financial-reports.html', [
        (r'href="#"(\\s+class="btn btn-outline-primary[^>]*>)', r'href="financial-reports.html"\1'),
        (r'href="#"(\\s+class="btn btn-outline-success[^>]*>)', r'href="expenses.html"\1'),
        (r'href="#"(\\s+class="btn btn-outline-warning[^>]*>)', r'href="pending-payments.html"\1'),
        (r'href="#"(\\s+class="btn btn-outline-danger[^>]*>)', r'href="payroll.html"\1'),
    ]),
    # finance/payments.html - download invoice
    ('finance/payments.html', [
        (r'href="#"(\\s+class="btn btn-light[^>]*>)', r'href="invoice.html"\1'),
        (r'href="#"(\\s+class="btn btn-sm btn-primary[^>]*>)', r'href="payments.html"\1'),
    ]),
]

for filepath, replacements in files_and_ops:
    p = root / filepath
    if not p.exists():
        print(f'SKIP {filepath} - not found')
        continue
    text = p.read_text(encoding='utf-8', errors='replace')
    orig_text = text
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text, flags=re.MULTILINE | re.IGNORECASE)
    if text != orig_text:
        p.write_text(text, encoding='utf-8')
        print(f'Updated {filepath}')
    else:
        print(f'No changes needed in {filepath}')
