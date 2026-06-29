from pathlib import Path
import re

root = Path('pages')

icon_map = {
    'fa-eye': {
        'students.html': 'student-profile.html',
        'instructors.html': 'instructor-profile.html',
        'courses.html': 'course-details.html',
        'books.html': 'books.html',
        'invoices.html': 'invoice.html',
        'payments.html': 'invoice.html',
        'attendance.html': 'mark-attendance.html',
        'student-results.html': 'student-transcript.html',
    },
    'fa-edit': {
        'student-profile.html': 'edit-student.html',
        'students.html': 'edit-student.html',
        'instructors.html': 'add-instructor.html',
        'courses.html': 'add-course.html',
        'books.html': 'add-book.html',
        'invoices.html': 'invoice.html',
        'payments.html': 'payments.html',
        'attendance.html': 'mark-attendance.html',
    },
    'fa-trash': {
        'students.html': 'students.html',
        'instructors.html': 'instructors.html',
        'courses.html': 'courses.html',
        'books.html': 'books.html',
        'invoices.html': 'invoice.html',
        'payments.html': 'payments.html',
        'attendance.html': 'mark-attendance.html',
    },
    'fa-download': {
        'students.html': 'student-transcript.html',
        'invoices.html': 'invoice.html',
        'payments.html': 'invoice.html',
        'student-results.html': 'student-transcript.html',
        'student-profile.html': 'student-transcript.html',
        'attendance.html': 'attendance-report.html',
    },
    'fa-print': {
        'invoices.html': 'invoice.html',
        'payment-history.html': 'payments.html',
    },
}

text_map = {
    'forgot password': 'forgot-password.html',
    'mark attendance': 'mark-attendance.html',
    'export report': 'attendance-report.html',
    'generate report': 'analytics-dashboard.html',
    'new report': 'analytics-dashboard.html',
    'create invoice': 'invoice.html',
    'download invoice': 'invoice.html',
    'generate invoice': 'invoice.html',
    'new transaction': 'payments.html',
    'add payment': 'payments.html',
    'add course': 'add-course.html',
    'add instructor': 'add-instructor.html',
    'add book': 'add-book.html',
    'new scholarship': 'scholarships.html',
    'export results': 'student-transcript.html',
    'print transcript': 'student-transcript.html',
    'download pdf': 'student-transcript.html',
    'view reports': None,  # use context
    'revenue report': 'financial-reports.html',
    'expense report': 'expenses.html',
    'outstanding fees': 'pending-payments.html',
    'payroll report': 'payroll.html',
    'add payment': 'payments.html',
}

page_defaults = {
    'dashboard/index.html': 'users/profile.html',
    'library/books.html': 'books.html',
    'attendance/attendance.html': 'attendance-report.html',
    'finance/invoices.html': 'invoice.html',
    'finance/payments.html': 'invoice.html',
    'students/students.html': 'students.html',
    'students/student-profile.html': 'edit-student.html',
    'students/student-results.html': 'student-transcript.html',
    'instructors/instructors.html': 'instructor-profile.html',
    'courses/courses.html': 'course-details.html',
    'library/books.html': 'books.html',
    'finance/financial-reports.html': 'financial-reports.html',
    'finance/scholarships.html': 'scholarships.html',
    'reports/reports.html': 'reports.html',
}

pattern = re.compile(r'(<a\s+[^>]*href="#"[^>]*>)(.*?)(</a>)', re.S | re.I)

for file in sorted(root.glob('**/*.html')):
    text = file.read_text(encoding='utf-8', errors='replace')
    changed = False
    def replace(m):
        nonlocal changed
        pre = m.group(1)
        inner = m.group(2)
        post = m.group(3)
        lower = re.sub(r'<[^>]+>', '', inner).strip().lower()
        target = None
        fname = file.name
        path_str = str(file.relative_to(root)).replace('\\', '/')
        # direct text map
        for key, val in text_map.items():
            if key in lower:
                target = val
                if target is None:
                    break
                return pre.replace('href="#"', f'href="{target}"') + inner + post
        # icon map
        icon_match = re.search(r'fa-([a-z-]+)', inner)
        if icon_match:
            icon = 'fa-' + icon_match.group(1)
            if icon in icon_map and fname in icon_map[icon]:
                target = icon_map[icon][fname]
                return pre.replace('href="#"', f'href="{target}"') + inner + post
        # special dashboard map
        if path_str == 'dashboard/index.html':
            if 'profile' in lower:
                target = '../users/profile.html'
            elif 'settings' in lower:
                target = '../users/settings.html'
            else:
                target = '../users/profile.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        # student pagination or generic page links
        if lower in {'previous', 'next', '1', '2', '3'}:
            target = file.name
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'courses.html':
            target = 'course-details.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'instructors.html':
            target = 'instructor-profile.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'books.html':
            target = 'books.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'payments.html':
            target = 'invoice.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'invoices.html':
            target = 'invoice.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        if 'view' in lower and fname == 'students.html':
            target = 'student-profile.html'
            return pre.replace('href="#"', f'href="{target}"') + inner + post
        # fallback to page default or file itself
        target = page_defaults.get(path_str, file.name)
        return pre.replace('href="#"', f'href="{target}"') + inner + post

    new_text = pattern.sub(replace, text)
    if new_text != text:
        changed = True
        file.write_text(new_text, encoding='utf-8')
        print(f'updated {file}')
