// ============================================================
// COMMON.JS - Shared Functions for All Pages

// 1. USER SESSION MANAGEMENT
// ============================================================
function getUserSession() {
    try {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch (e) {
        console.error('Error reading user session:', e);
        return null;
    }
}

function setUserSession(user) {
    try {
        sessionStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
        console.error('Error saving user session:', e);
    }
}

function clearUserSession() {
    try {
        sessionStorage.removeItem('user');
    } catch (e) {
        console.error('Error clearing user session:', e);
    }
}

function isLoggedIn() {
    return getUserSession() !== null;
}

// ============================================================
// 2. HEADER UPDATE FUNCTIONS
// ============================================================
function updateHeaderWithUser() {
    const user = getUserSession();
    
    if (!user) {
        console.warn('⚠️ No user session found. Header will show default values.');
        return;
    }
    
    // Update display name - using id="displayName"
    const displayNameElements = document.querySelectorAll('#displayName');
    displayNameElements.forEach(el => {
        if (el) {
            el.textContent = user.displayName || user.username || 'User';
        }
    });
    
    // Update user role/title - using id="role"
    const roleElements = document.querySelectorAll('#role');
    roleElements.forEach(el => {
        if (el) {
            el.textContent = user.role || 'Staff';
        }
    });
    
    // Update avatar initials
    const avatarElements = document.querySelectorAll('.avatar');
    avatarElements.forEach(el => {
        if (el) {
            const name = user.displayName || user.username || 'User';
            const initials = getInitials(name);
            
            const children = el.childNodes;
            for (let i = 0; i < children.length; i++) {
                if (children[i].nodeType === Node.TEXT_NODE) {
                    children[i].textContent = initials;
                    break;
                }
            }
        }
    });
    
    console.log(`👤 Header updated for: ${user.displayName} (${user.role})`);
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ============================================================
// 3. DROPDOWN CONTROLS (Global)
// ============================================================
function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownOverlay = document.getElementById('dropdownOverlay');
    const avatarBtn = document.getElementById('avatarBtn');
    
    if (!dropdownMenu) return;
    
    const isOpen = dropdownMenu.classList.contains('open');
    dropdownMenu.classList.toggle('open');
    if (dropdownOverlay) dropdownOverlay.classList.toggle('active');
    if (avatarBtn) avatarBtn.setAttribute('aria-expanded', !isOpen);
}

function closeDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownOverlay = document.getElementById('dropdownOverlay');
    const avatarBtn = document.getElementById('avatarBtn');
    
    if (!dropdownMenu) return;
    
    dropdownMenu.classList.remove('open');
    if (dropdownOverlay) dropdownOverlay.classList.remove('active');
    if (avatarBtn) avatarBtn.setAttribute('aria-expanded', 'false');
}

// ============================================================
// 4. LOGOUT FUNCTION
// ============================================================
function logoutUser() {
    if (typeof showToast === 'function') {
        showToast('👋 Logging out...', 'info', 2000);
    }
    console.log('🔒 Logging out user...');
    clearUserSession();
    
    const path = window.location.pathname;
    let loginPath = '../auth/login.html';
    
    if (path.includes('/dashboard/')) {
        loginPath = '../auth/login.html';
    } else if (path.includes('/pages/')) {
        loginPath = '../auth/login.html';
    }
    
    setTimeout(() => {
        window.location.href = loginPath;
    }, 500);
}

// ============================================================
// 5. NAVIGATION HELPERS
// ============================================================
function goToDashboard() {
    const path = window.location.pathname;
    if (path.includes('/dashboard/')) {
        window.location.href = 'index.html';
    } else if (path.includes('/pages/')) {
        window.location.href = 'dashboard/index.html';
    } else {
        window.location.href = 'pages/dashboard/index.html';
    }
}

function goToLogin() {
    const path = window.location.pathname;
    if (path.includes('/dashboard/')) {
        window.location.href = '../auth/login.html';
    } else if (path.includes('/pages/')) {
        window.location.href = 'auth/login.html';
    } else {
        window.location.href = 'pages/auth/login.html';
    }
}

// ============================================================
// 6. CHECK AUTHENTICATION
// ============================================================
function requireAuth(redirectTo) {
    if (!redirectTo) {
        const path = window.location.pathname;
        if (path.includes('/dashboard/')) {
            redirectTo = '../auth/login.html';
        } else if (path.includes('/pages/')) {
            redirectTo = 'auth/login.html';
        } else {
            redirectTo = 'pages/auth/login.html';
        }
    }
    
    if (!isLoggedIn()) {
        console.warn('⚠️ Unauthorized access. Redirecting to login...');
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

// ============================================================
// 7. MODAL LOADER - Inject modals into every page
// ============================================================
let modalsLoaded = false;
let modalLoadPromise = null;

async function loadModals() {
    if (modalsLoaded) return Promise.resolve();
    if (modalLoadPromise) return modalLoadPromise;
    
    modalLoadPromise = (async () => {
        try {
            const path = window.location.pathname;
            let modalPath = '';
            
            if (path.includes('/pages/')) {
                const folderDepth = path.split('/pages/')[1].split('/').length;
                modalPath = '../'.repeat(folderDepth) + 'components/modals.html';
            } else {
                modalPath = 'components/modals.html';
            }
            
            console.log(`📦 Loading modals from: ${modalPath}`);
            
            const response = await fetch(modalPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const modalHTML = await response.text();
            
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            modalsLoaded = true;
            console.log('✅ Modals loaded successfully');
            
            initializeModalListeners();
            
        } catch (error) {
            console.error('❌ Failed to load modals:', error);
            if (typeof showToast === 'function') {
                showToast('⚠️ Password change feature unavailable', 'warning');
            }
        }
    })();
    
    return modalLoadPromise;
}

// ============================================================
// 8. MODAL EVENT LISTENERS
// ============================================================
function initializeModalListeners() {
    const passwordModal = document.getElementById('passwordModal');
    
    if (passwordModal) {
        passwordModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closePasswordModal();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('passwordModal');
            if (modal && modal.classList.contains('open')) {
                closePasswordModal();
            }
        }
    });
}

// ============================================================
// 9. PASSWORD MODAL FUNCTIONS
// ============================================================
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (!modal) {
        console.warn('⚠️ Password modal not found. Attempting to load...');
        loadModals().then(() => {
            const retryModal = document.getElementById('passwordModal');
            if (retryModal) {
                openPasswordModal();
            } else if (typeof showToast === 'function') {
                showToast('⚠️ Password change feature unavailable', 'warning');
            }
        });
        return;
    }
    
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    const form = document.getElementById('passwordForm');
    if (form) form.reset();
    
    const messageEl = document.getElementById('passwordModalMessage');
    if (messageEl) {
        messageEl.className = 'modal-message';
        messageEl.style.display = 'none';
    }
    
    const matchStatus = document.getElementById('matchStatus');
    if (matchStatus) {
        matchStatus.className = 'match-status';
    }
    
    document.querySelectorAll('.strength-bar .segment').forEach(seg => seg.className = 'segment');
    const strengthLabel = document.querySelector('.strength-label');
    if (strengthLabel) {
        strengthLabel.textContent = 'Weak';
        strengthLabel.className = 'strength-label weak';
    }
    
    document.querySelectorAll('.password-requirements small').forEach(el => {
        el.className = '';
    });
    
    const submitBtn = document.getElementById('changePasswordBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Password';
    }
    
    setTimeout(() => {
        const currentPassword = document.getElementById('currentPassword');
        if (currentPassword) currentPassword.focus();
    }, 300);
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('open');
    }
    document.body.style.overflow = '';
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function validateNewPassword(password) {
    if (!password) return;
    
    const requirements = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    const reqLength = document.getElementById('reqLength');
    const reqUppercase = document.getElementById('reqUppercase');
    const reqLowercase = document.getElementById('reqLowercase');
    const reqNumber = document.getElementById('reqNumber');
    
    if (reqLength) reqLength.parentElement.className = requirements.length ? 'valid' : 'invalid';
    if (reqUppercase) reqUppercase.parentElement.className = requirements.uppercase ? 'valid' : 'invalid';
    if (reqLowercase) reqLowercase.parentElement.className = requirements.lowercase ? 'valid' : 'invalid';
    if (reqNumber) reqNumber.parentElement.className = requirements.number ? 'valid' : 'invalid';
    
    updatePasswordStrength(password);
    
    const confirm = document.getElementById('confirmPassword');
    if (confirm && confirm.value) {
        checkPasswordMatch();
    }
}

function updatePasswordStrength(password) {
    const segments = document.querySelectorAll('.strength-bar .segment');
    const label = document.querySelector('.strength-label');
    
    if (!segments.length || !label) return;
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    score = Math.min(score, 4);
    
    const levels = [
        { label: 'Weak', class: 'weak' },
        { label: 'Fair', class: 'medium' },
        { label: 'Good', class: 'medium' },
        { label: 'Strong', class: 'strong' }
    ];
    
    const level = levels[score - 1] || levels[0];
    
    segments.forEach((seg, index) => {
        seg.className = 'segment';
        if (index < score) {
            seg.classList.add('filled', level.class);
        }
    });
    
    label.textContent = level.label;
    label.className = 'strength-label ' + level.class;
}

function checkPasswordMatch() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const status = document.getElementById('matchStatus');
    
    if (!newPassword || !confirmPassword || !status) return;
    
    const icon = status.querySelector('i');
    const text = document.getElementById('matchText');
    
    if (!confirmPassword.value) {
        status.className = 'match-status';
        return;
    }
    
    status.className = 'match-status show';
    
    if (newPassword.value === confirmPassword.value && newPassword.value.length > 0) {
        status.className = 'match-status show match';
        icon.className = 'fas fa-check-circle';
        text.textContent = '✅ Passwords match';
        confirmPassword.classList.remove('error');
        confirmPassword.classList.add('success');
    } else {
        status.className = 'match-status show unmatch';
        icon.className = 'fas fa-times-circle';
        text.textContent = '❌ Passwords do not match';
        confirmPassword.classList.remove('success');
        confirmPassword.classList.add('error');
    }
}

async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const messageEl = document.getElementById('passwordModalMessage');
    const submitBtn = document.getElementById('changePasswordBtn');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('Form fields not found. Please refresh the page.', 'error');
        }
        return;
    }
    
    if (messageEl) {
        messageEl.className = 'modal-message';
        messageEl.style.display = 'none';
    }
    
    if (!currentPassword.value) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('Please enter your current password.', 'error');
        }
        return;
    }
    
    if (newPassword.value.length < 6) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('New password must be at least 6 characters long.', 'error');
        }
        return;
    }
    
    if (!/[A-Z]/.test(newPassword.value)) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('New password must contain at least one uppercase letter.', 'error');
        }
        return;
    }
    
    if (!/[a-z]/.test(newPassword.value)) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('New password must contain at least one lowercase letter.', 'error');
        }
        return;
    }
    
    if (!/\d/.test(newPassword.value)) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('New password must contain at least one number.', 'error');
        }
        return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('Passwords do not match.', 'error');
        }
        return;
    }
    
    const user = getUserSession();
    if (!user) {
        if (typeof showModalMessage === 'function') {
            showModalMessage('User session not found. Please login again.', 'error');
        }
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Updating...';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (typeof showModalMessage === 'function') {
            showModalMessage('✅ Password changed successfully!', 'success');
        }
        
        setTimeout(() => {
            closePasswordModal();
            if (typeof showToast === 'function') {
                showToast('🔑 Password changed successfully!', 'success');
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Password change failed:', error);
        if (typeof showModalMessage === 'function') {
            showModalMessage('❌ Failed to change password. Please try again.', 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Password';
    }
}

function showModalMessage(message, type) {
    const el = document.getElementById('passwordModalMessage');
    if (!el) return;
    
    el.className = 'modal-message ' + type;
    el.textContent = message;
    el.style.display = 'block';
}

// ============================================================
// 10. SIDE NAVIGATION - ACTIVE STATE MANAGEMENT
// ============================================================
function setActiveNavItem(activeId) {
    document.querySelectorAll('.side-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.side-nav .sub-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (activeId) {
        const mainItem = document.querySelector(`.side-nav .nav-item[data-page="${activeId}"]`);
        if (mainItem) {
            mainItem.classList.add('active');
            return;
        }
        
        const subItem = document.querySelector(`.side-nav .sub-item[data-page="${activeId}"]`);
        if (subItem) {
            subItem.classList.add('active');
            const parentSubmenu = subItem.closest('.nav-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('open');
                const parentNav = parentSubmenu.previousElementSibling;
                if (parentNav && parentNav.classList.contains('nav-item')) {
                    parentNav.classList.add('open');
                }
            }
        }
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    
    const pageMap = {
        'index': 'dashboard',
        'doctors-works-dashboard': 'doctors-works',
        'reception-dashboard': 'reception',
        'user-management': 'users',
        'item-management': 'items',
        'price-list': 'prices'
    };
    
    return pageMap[filename] || filename;
}

function handleNavClick(pageName, element) {
    document.querySelectorAll('.side-nav .nav-item, .side-nav .sub-item').forEach(el => {
        el.classList.remove('active');
    });
    
    element.classList.add('active');
    
    if (element.classList.contains('sub-item')) {
        const parentSubmenu = element.closest('.nav-submenu');
        if (parentSubmenu) {
            const parentNav = parentSubmenu.previousElementSibling;
            if (parentNav && parentNav.classList.contains('nav-item')) {
                parentNav.classList.add('active');
            }
        }
    }
    
    if (typeof showToast === 'function') {
        showToast(`📋 ${pageName} page is being loaded...`, 'info');
    }
    console.log(`🔗 Navigating to: ${pageName}`);
}

// ============================================================
// 11. FALLBACK TOAST (if page doesn't have one)
// ============================================================
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'info', duration = 3000) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const colors = {
            success: '#0a8a5a',
            error: '#c0392b',
            info: '#0756ba',
            warning: '#e67e22'
        };

        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background: ${colors[type] || colors.info};
            color: #fff;
            padding: 12px 24px;
            border-radius: 10px;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: toastIn 0.3s ease-out;
            max-width: 90%;
        `;

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes toastOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };
}

// ============================================================
// 12. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.getUserSession = getUserSession;
window.setUserSession = setUserSession;
window.clearUserSession = clearUserSession;
window.isLoggedIn = isLoggedIn;
window.updateHeaderWithUser = updateHeaderWithUser;
window.getInitials = getInitials;
window.logoutUser = logoutUser;
window.goToDashboard = goToDashboard;
window.goToLogin = goToLogin;
window.requireAuth = requireAuth;
window.loadModals = loadModals;
window.toggleDropdown = toggleDropdown;
window.closeDropdown = closeDropdown;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.validateNewPassword = validateNewPassword;
window.updatePasswordStrength = updatePasswordStrength;
window.checkPasswordMatch = checkPasswordMatch;
window.handlePasswordChange = handlePasswordChange;
window.showModalMessage = showModalMessage;
window.setActiveNavItem = setActiveNavItem;
window.getCurrentPage = getCurrentPage;
window.handleNavClick = handleNavClick;

console.log('🔧 Common.js loaded successfully');