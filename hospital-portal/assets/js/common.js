// Global state
let authorizedMembers = JSON.parse(sessionStorage.getItem('authorizedMembers') || '[]');
let currentVerifiedMember = null;
let currentCardNumber = '';

// Reusable loading state handler
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

// Show notification
function showNotification(msg, type = 'success') { 
    const n = document.createElement('div'); 
    n.className = `notification ${type}`; 
    n.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`; 
    document.body.appendChild(n); 
    n.style.display = 'block'; 
    setTimeout(() => n.remove(), 3000); 
}

// Change Password Functions
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

// Sign Out with confirmation
function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        sessionStorage.clear();
        showNotification('Signed out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Toggle submenu
function toggleSubmenu(el) { 
    const parent = el.closest('.has-submenu'); 
    const sub = parent.querySelector('.submenu'); 
    sub.classList.toggle('active'); 
}

// Close sidebar on mobile
function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('hidden');
    }
}

// Show "Coming Soon" notification for placeholder modules
function comingSoon(moduleName) {
    showNotification(`${moduleName} - This feature will be online soon!`, 'info');
}

// Load components (for pages that use component architecture)
async function loadComponents() {
    try {
        // Use absolute paths from root (starting with /)
        const headerResponse = await fetch('/hospital-portal/components/header.html');
        if (headerResponse.ok) {
            document.getElementById('header-container').innerHTML = await headerResponse.text();
        }
        
        const sidebarResponse = await fetch('/hospital-portal/components/sidebar.html');
        if (sidebarResponse.ok) {
            document.getElementById('sidebar-container').innerHTML = await sidebarResponse.text();
        }
        
        const footerResponse = await fetch('/hospital-portal/components/footer.html');
        if (footerResponse.ok) {
            document.getElementById('footer-container').innerHTML = await footerResponse.text();
        }
        
        const modalsResponse = await fetch('/hospital-portal/components/modals.html');
        if (modalsResponse.ok) {
            document.getElementById('modals-container').innerHTML = await modalsResponse.text();
        }
        
        // Initialize event listeners
        initEventListeners();
        
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

function initEventListeners() {
    // Hamburger menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('hidden');
        });
    }
    
    // Close sidebar button
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('hidden');
        });
    }
    
    // User dropdown
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
    });
}