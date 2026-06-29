from pathlib import Path
import re

root = Path('pages')

replacements = [
    # Finance invoices
    ('pages/finance/invoices.html', 'Create Invoice', 'invoice.html'),
    # Finance payments action buttons
    ('pages/finance/payments.html', 'Add Payment', 'payments.html'),
    ('pages/finance/payments.html', 'Generate Invoice', 'invoice.html'),
    ('pages/finance/payments.html', 'New Transaction', 'payments.html'),
    ('pages/finance/payments.html', 'Download Invoice', 'invoice.html'),
    # Finance scholarships
    ('pages/finance/scholarships.html', 'New Scholarship', 'scholarships.html'),
    # Finance financial reports
    ('pages/finance/financial-reports.html', 'Revenue Report', 'financial-reports.html'),
    ('pages/finance/financial-reports.html', 'Expense Report', 'expenses.html'),
    ('pages/finance/financial-reports.html', 'Outstanding Fees', 'pending-payments.html'),
    ('pages/finance/financial-reports.html', 'Payroll Report', 'payroll.html'),
    # Attendance
    ('pages/attendance/attendance.html', 'Mark Attendance', 'mark-attendance.html'),
    ('pages/attendance/attendance.html', 'Export Report', 'attendance-report.html'),
    # Courses
    ('pages/courses/courses.html', 'Add Course', 'add-course.html'),
    # Instructors
    ('pages/instructors/instructors.html', 'Add Instructor', 'add-instructor.html'),
    # Students
    ('pages/students/student-profile.html', 'Edit Profile', 'edit-student.html'),
    ('pages/students/student-results.html', 'Export Results', 'student-transcript.html'),
    ('pages/students/student-results.html', 'Print Transcript', 'student-transcript.html'),
    ('pages/students/student-results.html', 'Download PDF', 'student-transcript.html'),
    # Library books
    ('pages/library/books.html', 'fa-eye', 'books.html'),
    ('pages/library/books.html', 'fa-edit', 'add-book.html'),
    ('pages/library/books.html', 'fa-trash', 'books.html'),
]

for filepath, label, target in replacements:
    p = root / filepath if not filepath.startswith('pages/') else Path(filepath)
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8', errors='replace')
    # Build pattern to find href="#" within the context of the label
    if label.startswith('fa-'):
        # Icon-based replacement
        pattern = r'<i\s+[^>]*' + label + r'[^>]*></i>\s*</a>\s*' + \
                  r'<a\s+[^>]*href="#"'
        replacement = f'<i class="fa {label}"></i>\n                                    </a>\n\n                                    <a href="{target}"'
    else:
        # Text-based replacement
        escaped_label = re.escape(label)
        pattern = r'(<a\s+[^>]*href="#"[^>]*>.*?)' + escaped_label + r'(.*?</a>)'
        replacement = f'\\1\\2'.replace('href="#"', f'href="{target}"')
        # More direct approach
        idx = text.find(label)
        if idx > 0:
            a_start = text.rfind('<a', 0, idx)
            if a_start >= 0:
                a_close = text.find('</a>', idx)
                if a_close >= 0:
                    old_link = text[a_start:a_close + 4]
                    if 'href="#"' in old_link:
                        new_link = old_link.replace('href="#"', f'href="{target}"')
                        text = text[:a_start] + new_link + text[a_close + 4:]

    p.write_text(text, encoding='utf-8')
    print(f'Updated {filepath} label "{label}" -> {target}')
