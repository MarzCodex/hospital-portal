/* ========================================
   HOSPITAL SERVICE PORTAL - COMMON JS
   ======================================== */

// ========================================
// PATH DETECTION
// Automatically resolves correct relative path based on current page depth
// ========================================
function getBasePath() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const depth = Math.max(0, pathParts.length - 2);
    return depth > 0 ? '../'.repeat(depth) : './';
}

// ========================================
// SESSION HELPERS
// ========================================
function getSession(key, fallback = '') {
    return sessionStorage.getItem(key) || fallback;
}

function getUserName() { return getSession('userName', 'Unknown User'); }
function getUserRole() { return getSession('userRole', 'Staff'); }
function getJobTitle() { return getSession('jobTitle', 'Staff'); }
function getUserDepartment() { return getSession('userDepartment', ''); }
function getUserEmail() { return getSession('userEmail', ''); }
function getEmployeeId() { return getSession('employeeId', ''); }

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ')
        .filter(p => p.trim())
        .map(p => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function isLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

function requireLogin() {
    if (!isLoggedIn()) {
        // Save the URL the user tried to visit
        // so we can redirect them back after successful login
        const intendedUrl = window.location.pathname + window.location.search + window.location.hash;
        sessionStorage.setItem('redirectAfterLogin', intendedUrl);
        
        // Redirect to login
        window.location.href = getBasePath() + 'login.html';
        return false;
    }
    return true;
}

// ========================================
// ROLE-BASED ACCESS HELPERS
// ========================================
function hasRole(role) {
    return getUserRole().toLowerCase() === role.toLowerCase();
}

function hasAnyRole(roles) {
    const currentRole = getUserRole().toLowerCase();
    return roles.some(r => r.toLowerCase() === currentRole);
}

function isAdmin() {
    return hasRole('System Administrator');
}

function hideIfNotRole(elementId, allowedRoles) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!hasAnyRole(allowedRoles)) el.style.display = 'none';
}

// ========================================
// FORMAT HELPERS
// ========================================
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('en-GB', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

// ========================================
// VALIDATION HELPERS
// ========================================
function isValidEmail(email) {
    return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false;
}

function isValidUsername(username) {
    return username ? /^[a-zA-Z0-9_.-]{3,}$/.test(username) : false;
}

// ========================================
// AUTHENTICATION (root-level safe)
// ========================================
async function authenticateUser(username, password) {
    try {
        const response = await fetch(getBasePath() + 'data/users.json');
        if (!response.ok) throw new Error('Failed to load users');
        const users = await response.json();

        if (!Array.isArray(users)) {
            throw new Error('users.json is not an array');
        }

        const user = users.find(u =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.password === password
        );

        if (!user) return { success: false, reason: 'invalid' };
        if (user.status !== 'Active') return { success: false, reason: 'inactive', user };

        return { success: true, user };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, reason: 'error', error: error.message };
    }
}

// ========================================
// GLOBAL STATE
// ========================================
let authorizedMembers = JSON.parse(sessionStorage.getItem('authorizedMembers') || '[]');
let currentVerifiedMember = null;
let currentCardNumber = '';

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(msg, type = 'success') {
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle'
        : type === 'error' ? 'fa-exclamation-circle'
        : 'fa-info-circle';
    n.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    document.body.appendChild(n);
    n.style.display = 'block';
    setTimeout(() => n.remove(), 3000);
}

// ========================================
// LOADING STATE HANDLER
// ========================================
async function withLoadingState(btn, callback) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    try {
        return await callback();
    } catch (error) {
        console.error(error);
        showNotification('An error occurred. Please try again.', 'error');
        throw error;
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ========================================
// PASSWORD MANAGEMENT
// ========================================
function openChangePassword() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.add('active');
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('active');
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.remove('active');
    const inputs = ['currentPassword', 'newPassword', 'confirmPassword'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
}

function changePassword() {
    const currentPwd = document.getElementById('currentPassword')?.value || '';
    const newPwd = document.getElementById('newPassword')?.value || '';
    const confirmPwd = document.getElementById('confirmPassword')?.value || '';

    if (!currentPwd || !newPwd || !confirmPwd) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    if (newPwd !== confirmPwd) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPwd.length < 4) {
        showNotification('Password must be at least 4 characters', 'error');
        return;
    }

    showNotification('Password changed successfully!', 'success');
    closePasswordModal();
}

// ========================================
// USER & AUTHENTICATION
// ========================================
function getCurrentUser() {
    // Prefer session storage; fallback to DOM; ultimate fallback to 'User'
    const sessionName = sessionStorage.getItem('userName');
    if (sessionName) return sessionName;

    const userNameSpan = document.getElementById('userName');
    return userNameSpan ? userNameSpan.innerText.trim() : 'User';
}

function signOut() {
    sessionStorage.clear();
    showNotification('Signed out successfully', 'success');
    setTimeout(() => {
        window.location.href = getBasePath() + 'login.html';
    }, 1500);
}

// ========================================
// SIDEBAR & NAVIGATION
// ========================================
function toggleSidebar() {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');

    if (body.classList.contains('sidebar-collapsed')) {
        body.classList.remove('sidebar-collapsed');
        if (sidebar) {
            sidebar.classList.remove('hidden');
            sidebar.style.transform = '';
        }
        sessionStorage.setItem('sidebarCollapsed', 'false');
    } else {
        body.classList.add('sidebar-collapsed');
        if (sidebar) sidebar.classList.add('hidden');
        sessionStorage.setItem('sidebarCollapsed', 'true');
    }
}

function closeSidebar() {
    document.body.classList.add('sidebar-collapsed');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('hidden');
    sessionStorage.setItem('sidebarCollapsed', 'true');
}

function openSidebar() {
    document.body.classList.remove('sidebar-collapsed');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('hidden');
    sessionStorage.setItem('sidebarCollapsed', 'false');
}

function initSidebarState() {
    const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('hidden');
    }
}

function handleResponsiveSidebar() {
    if (window.innerWidth <= 768) {
        if (!document.body.classList.contains('sidebar-collapsed')) {
            document.body.classList.add('sidebar-collapsed');
        }
    } else {
        const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }
}

function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('sidebar-collapsed');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('hidden');
        sessionStorage.setItem('sidebarCollapsed', 'true');
    }
}

function toggleSubmenu(el) {
    const parent = el.closest('.has-submenu');
    if (!parent) return;
    const sub = parent.querySelector('.submenu');
    if (sub) sub.classList.toggle('active');
}

function showDashboard() {
    showNotification('Redirecting to Dashboard...', 'info');
    setTimeout(() => {
        window.location.href = getBasePath() + 'index.html';
    }, 500);
}

// ========================================
// MEMBER AUTHORIZATION DISPLAY
// ========================================
function displayAuthorizedMembers(members) {
    const tbody = document.getElementById('authorizedBody');
    if (!tbody) return;

    if (!members || members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No authorized patients found</td></tr>';
    } else {
        tbody.innerHTML = members.map(m => `
            <tr>
                <td>${m.time || 'N/A'}</td>
                <td>${m.name || 'N/A'}</td>
                <td>${m.gender || 'Male'}</td>
                <td>${m.id || 'N/A'}</td>
                <td>${m.authNumber || 'N/A'}</td>
                <td>${m.visitType || 'N/A'}</td>
                <td>${m.authorizedBy || getCurrentUser()}</td>
            </tr>
        `).join('');
    }
}

// ========================================
// SERVICES MODAL
// ========================================
let eligibleServices = [
    { code: 'MED001', name: 'Paracetamol', strength: '500mg', dosage: '1 tablet every 6 hours' },
    { code: 'MED002', name: 'Ibuprofen', strength: '400mg', dosage: '1 tablet every 8 hours' },
    { code: 'MED003', name: 'Amoxicillin', strength: '250mg', dosage: '1 capsule every 8 hours' },
    { code: 'MED004', name: 'Cetirizine', strength: '10mg', dosage: '1 tablet daily' },
    { code: 'MED005', name: 'Omeprazole', strength: '20mg', dosage: '1 capsule daily before meal' },
    { code: 'MED006', name: 'Metformin', strength: '500mg', dosage: '1 tablet twice daily' },
    { code: 'LAB001', name: 'Complete Blood Count', strength: 'N/A', dosage: 'As prescribed' },
    { code: 'LAB002', name: 'Blood Glucose', strength: 'Fasting', dosage: 'As prescribed' },
    { code: 'LAB003', name: 'Lipid Profile', strength: '12hrs fasting', dosage: 'As prescribed' },
    { code: 'CON001', name: 'General Consultation', strength: 'N/A', dosage: 'As scheduled' },
    { code: 'CON002', name: 'Specialist Consultation', strength: 'N/A', dosage: 'By referral only' }
];

function openServicesModal() {
    const modal = document.getElementById('servicesModal');
    if (!modal) return;
    modal.classList.add('active');
    const input = document.getElementById('servicesSearchInput');
    if (input) input.value = '';
    displayServicesTable(eligibleServices);
}

function closeServicesModal() {
    const modal = document.getElementById('servicesModal');
    if (modal) modal.classList.remove('active');
}

function displayServicesTable(services) {
    const tbody = document.getElementById('servicesTableBody');
    if (!tbody) return;

    if (!services || services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-services">No eligible services found</td></tr>';
    } else {
        tbody.innerHTML = services.map(s => `
            <tr>
                <td>${s.code || 'N/A'}</td>
                <td>${s.name || 'N/A'}</td>
                <td>${s.strength || 'N/A'}</td>
                <td>${s.dosage || 'N/A'}</td>
            </tr>
        `).join('');
    }
}

function filterServicesTable() {
    const searchTerm = document.getElementById('servicesSearchInput')?.value.toLowerCase().trim() || '';

    if (!searchTerm) {
        displayServicesTable(eligibleServices);
        return;
    }

    const filtered = eligibleServices.filter(service =>
        (service.code || '').toLowerCase().includes(searchTerm) ||
        (service.name || '').toLowerCase().includes(searchTerm) ||
        (service.strength || '').toLowerCase().includes(searchTerm) ||
        (service.dosage || '').toLowerCase().includes(searchTerm)
    );

    displayServicesTable(filtered);
}

// Close services modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('servicesModal');
        if (modal && modal.classList.contains('active')) {
            closeServicesModal();
        }
    }
});

// ========================================
// USER DROPDOWN INITIALIZATION
// ========================================
function initUserDropdown() {
    const userInfo = document.getElementById('userInfo');
    const userDropdown = document.getElementById('userDropdown');

    if (userInfo) {
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', function() {
        if (userDropdown) userDropdown.classList.remove('active');
    });
}

// ========================================
// PAGE INITIALIZATION (for component-based pages)
// ========================================
function initPage() {
    const jobTitleSpan = document.getElementById('jobTitle');
    const userNameSpan = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (jobTitleSpan) jobTitleSpan.textContent = getJobTitle() + ' |';
    if (userNameSpan) userNameSpan.textContent = getUserName();
    if (userAvatar) userAvatar.textContent = getInitials(getUserName());

    initUserDropdown();
}

// ========================================
// DATA SERVICE LAYER (Mock -> Real API Ready)
// ========================================
const DataService = {
    basePath: '../../data/',

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.basePath}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            showNotification(`Failed to load data: ${endpoint}`, 'error');
            return null;
        }
    },

    // === Members ===
    async getMembers() {
        return this.fetchData('members.json');
    },

    // === Authorizations ===
    async getAuthorizations() {
        return this.fetchData('authorizations.json');
    },

    async getAuthorizationsByMember(memberId) {
        const all = await this.getAuthorizations();
        return all?.filter(a => a.memberId === memberId) || [];
    },

    // === Approvals ===
    async getApprovals() {
        return this.fetchData('approvals.json');
    },

    async getApprovalsByStatus(status) {
        const all = await this.getApprovals();
        return all?.filter(a => a.status === status) || [];
    },

    // === Services ===
    async getServices() {
        return this.fetchData('services.json');
    },

    async getIssuingServices() {
        return this.fetchData('issuing-services.json');
    },

    async getIssuedServices() {
        return this.fetchData('issued-services.json');
    },

    async getRestrictedItems() {
        return this.fetchData('restricted-items.json');
    },

    // === Referrals ===
    async getReferrals() {
        const localData = localStorage.getItem('referrals');
        if (localData) {
            try { return JSON.parse(localData); } catch { /* fall through */ }
        }
        return this.fetchData('referrals.json');
    },

    // === Admissions ===
    async getAdmissions() {
        const localData = localStorage.getItem('admissions');
        if (localData) {
            try { return JSON.parse(localData); } catch { /* fall through */ }
        }
        return this.fetchData('admissions.json');
    },

    // === Departments ===
    async getDepartments() {
        return this.fetchData('departments.json');
    },

    // === Price List & Visit Types ===
    async getPriceList() {
        return this.fetchData('NHIF_ZHSF_price_list.json');
    },

    async getVisitTypes() {
        return this.fetchData('visit-types.json');
    },

    // === Users ===
    async getUsers() {
        // Prefer localStorage (for CRUD persistence), fallback to file
        const localData = localStorage.getItem('users');
        if (localData) {
            try { return JSON.parse(localData); } catch { /* fall through */ }
        }
        return this.fetchData('users.json');
    },

    async addUser(userData) {
        const users = await this.getUsers() || [];
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...userData,
            password: userData.password || 'HPU-2026',
            createdDate: new Date().toISOString().split('T')[0],
            lastLogin: null,
            status: userData.status || 'Active'
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    },

    async updateUser(id, userData) {
        const users = await this.getUsers() || [];
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    },

    async deleteUser(id) {
        const users = await this.getUsers() || [];
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(filtered));
        return true;
    },

    async resetPassword(id) {
        const users = await this.getUsers() || [];
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index].password = 'HPU-2026';
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        return false;
    },

    async toggleUserStatus(id) {
        const users = await this.getUsers() || [];
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index].status = users[index].status === 'Active' ? 'Inactive' : 'Active';
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }
};

// ========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ========================================

// Path & session helpers
window.getBasePath = getBasePath;
window.getSession = getSession;
window.getUserName = getUserName;
window.getUserRole = getUserRole;
window.getJobTitle = getJobTitle;
window.getUserDepartment = getUserDepartment;
window.getUserEmail = getUserEmail;
window.getEmployeeId = getEmployeeId;
window.getInitials = getInitials;
window.isLoggedIn = isLoggedIn;
window.requireLogin = requireLogin;

// Role helpers
window.hasRole = hasRole;
window.hasAnyRole = hasAnyRole;
window.isAdmin = isAdmin;
window.hideIfNotRole = hideIfNotRole;

// Format helpers
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;

// Validation helpers
window.isValidEmail = isValidEmail;
window.isValidUsername = isValidUsername;

// Auth
window.authenticateUser = authenticateUser;

// Core UI
window.showNotification = showNotification;
window.withLoadingState = withLoadingState;
window.openChangePassword = openChangePassword;
window.closePasswordModal = closePasswordModal;
window.changePassword = changePassword;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;

// Navigation
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openSidebar = openSidebar;
window.initSidebarState = initSidebarState;
window.handleResponsiveSidebar = handleResponsiveSidebar;
window.closeSidebarOnMobile = closeSidebarOnMobile;
window.toggleSubmenu = toggleSubmenu;
window.showDashboard = showDashboard;

// Display helpers
window.displayAuthorizedMembers = displayAuthorizedMembers;

// Services modal
window.openServicesModal = openServicesModal;
window.closeServicesModal = closeServicesModal;
window.filterServicesTable = filterServicesTable;

// Initialization
window.initPage = initPage;
window.initUserDropdown = initUserDropdown;

// Data layer
window.DataService = DataService;