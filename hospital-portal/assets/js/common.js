/* ========================================
   HOSPITAL SERVICE PORTAL - COMMON JS
   ======================================== */

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
    n.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`; 
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
    const userNameSpan = document.getElementById('userName');
    return userNameSpan ? userNameSpan.innerText.trim() : 'Phillip Z.P';
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        sessionStorage.clear();
        showNotification('Signed out successfully', 'success');
        setTimeout(() => {
            window.location.href = '../../../login.html';
        }, 1500);
    }
}

// ========================================
// SIDEBAR & NAVIGATION
// ========================================

function toggleSidebar() {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    
    if (body.classList.contains('sidebar-collapsed')) {
        // Expand sidebar
        body.classList.remove('sidebar-collapsed');
        if (sidebar) {
            sidebar.classList.remove('hidden');
            // Remove inline style if present
            sidebar.style.transform = '';
        }
        // Optional: Save preference to sessionStorage
        sessionStorage.setItem('sidebarCollapsed', 'false');
    } else {
        // Collapse sidebar
        body.classList.add('sidebar-collapsed');
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
        // Optional: Save preference to sessionStorage
        sessionStorage.setItem('sidebarCollapsed', 'true');
    }
}

function closeSidebar() {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    
    body.classList.add('sidebar-collapsed');
    if (sidebar) {
        sidebar.classList.add('hidden');
    }
    sessionStorage.setItem('sidebarCollapsed', 'true');
}

function openSidebar() {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    
    body.classList.remove('sidebar-collapsed');
    if (sidebar) {
        sidebar.classList.remove('hidden');
    }
    sessionStorage.setItem('sidebarCollapsed', 'false');
}

// Initialize sidebar state from sessionStorage
function initSidebarState() {
    const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('hidden');
    }
}

// For mobile responsiveness - auto-collapse on small screens
function handleResponsiveSidebar() {
    if (window.innerWidth <= 768) {
        // On mobile, collapse by default
        if (!document.body.classList.contains('sidebar-collapsed')) {
            document.body.classList.add('sidebar-collapsed');
        }
    } else {
        // On desktop, restore user preference
        const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }
}

// Update closeSidebarOnMobile to work with new system
function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('sidebar-collapsed');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('hidden');
        sessionStorage.setItem('sidebarCollapsed', 'true');
    }
}

// Update toggleSubmenu to work with new system (keep existing but ensure sidebar is visible)
function toggleSubmenu(el) { 
    const parent = el.closest('.has-submenu'); 
    const sub = parent.querySelector('.submenu'); 
    sub.classList.toggle('active'); 
}
function showDashboard() { 
    showNotification('Redirecting to Dashboard...', 'info');
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 500);
}

// ========================================
// MEMBER AUTHORIZATION DISPLAY
// ========================================
function displayAuthorizedMembers(members) {
    const tbody = document.getElementById('authorizedBody');
    if (!tbody) return;
    
    if (members.length === 0) {
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
    { code: 'CON002', name: 'Specialist Consultation', strength: 'N/A', dosage: 'By referral only' },
];

function openServicesModal() {
    const modal = document.getElementById('servicesModal');
    if (!modal) return;
    modal.classList.add('active');
    document.getElementById('servicesSearchInput').value = '';
    displayServicesTable(eligibleServices);
}

function closeServicesModal() {
    const modal = document.getElementById('servicesModal');
    if (modal) modal.classList.remove('active');
}

function displayServicesTable(services) {
    const tbody = document.getElementById('servicesTableBody');
    if (!tbody) return;
    
    if (services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-services">No eligible services found</td></tr>';
    } else {
        tbody.innerHTML = services.map(s => `
            <tr>
                <td>${s.code}</td>
                <td>${s.name}</td>
                <td>${s.strength}</td>
                <td>${s.dosage}</td>
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
        service.code.toLowerCase().includes(searchTerm) ||
        service.name.toLowerCase().includes(searchTerm) ||
        service.strength.toLowerCase().includes(searchTerm) ||
        service.dosage.toLowerCase().includes(searchTerm)
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
    // Set logged in user
    const jobTitle = sessionStorage.getItem('jobTitle') || 'System Administrator';
    const userName = sessionStorage.getItem('userName') || 'Phillip Z.P';
    const userAvatar = document.getElementById('userAvatar');
    const userNameSpan = document.getElementById('userName');
    const jobTitleSpan = document.getElementById('jobTitle');
    
    if (jobTitleSpan) jobTitleSpan.textContent = jobTitle + ' |';
    if (userNameSpan) userNameSpan.textContent = userName;
    if (userAvatar) {
        const initials = userName.split(' ').map(n => n[0]).join('');
        userAvatar.textContent = initials;
    }
    
    // Initialize user dropdown
    initUserDropdown();
}
/*==========================================
DATA SERVICE LAYER (Mock -> Real API Ready)
============================================*/
const DataService = {
    //base path for all data requests
    basePath: '../../data/',

    //Generic fetch with error handling
    async fetchData(endpoint){
        try{
            const response = await fetch(`${this.basePath}${endpoint}`);
            if(!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        }
            catch (error){
                console.error(`Failed to fetch ${endpoint}:`, error);
                showNotification(`Failed to load data: ${endpoint}`, 'error');
                return null;
            }
        },

        //Specific data endpoints
        async getMembers(){
        return this.fetchData('members.json');
    },
    
    async getAuthorizations() {
        return this.fetchData('authorizations.json');
    },
    
    async getApprovals() {
        return this.fetchData('approvals.json');
    },
    
    async getServices() {
        return this.fetchData('services.json');
    },
    
    async getIssuingServices() {
    // For now, derive from approvals (approved services)
    const approvals = await this.getApprovals();
    return approvals?.filter(a => a.status === 'Approved') || [];
    },

    async getReferrals() {
        return this.fetchData('referrals.json');
    },
    
    async getPriceList() {
        return this.fetchData('NHIF_ZHSF_price_list.json');
    },
    
    async getVisitTypes() {
        return this.fetchData('Visit types.json');
    },
    
    // Filtered queries (simulates API query params)
    async getApprovalsByStatus(status) {
        const all = await this.getApprovals();
        return all?.filter(a => a.status === status) || [];
    },
    
    async getAuthorizationsByMember(memberId) {
        const all = await this.getAuthorizations();
        return all?.filter(a => a.memberId === memberId) || [];
    }
};


// ========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ========================================
window.showNotification = showNotification;
window.withLoadingState = withLoadingState;
window.openChangePassword = openChangePassword;
window.closePasswordModal = closePasswordModal;
window.changePassword = changePassword;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.toggleSubmenu = toggleSubmenu;
window.closeSidebarOnMobile = closeSidebarOnMobile;
window.showDashboard = showDashboard;
window.displayAuthorizedMembers = displayAuthorizedMembers;
window.openServicesModal = openServicesModal;
window.closeServicesModal = closeServicesModal;
window.filterServicesTable = filterServicesTable;
window.initPage = initPage;
window.initUserDropdown = initUserDropdown;
window.DataService = DataService;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.initSidebarState = initSidebarState;
window.handleResponsiveSidebar = handleResponsiveSidebar;
window.initUserDropdown = initUserDropdown;