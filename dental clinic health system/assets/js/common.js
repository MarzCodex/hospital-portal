// ============================================================
// PASSWORD CHANGE MODAL FUNCTIONS
// ============================================================

// Open modal
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Reset form
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordModalMessage').className = 'modal-message';
    document.getElementById('passwordModalMessage').style.display = 'none';
    document.getElementById('matchStatus').className = 'match-status';
    document.getElementById('changePasswordBtn').disabled = false;
    document.getElementById('changePasswordBtn').innerHTML = '<i class="fas fa-save"></i> Update Password';
    
    // Reset password strength
    document.querySelectorAll('.strength-bar .segment').forEach(seg => seg.className = 'segment');
    document.querySelector('.strength-label').textContent = 'Weak';
    document.querySelector('.strength-label').className = 'strength-label weak';
    
    // Reset requirements
    document.querySelectorAll('.password-requirements small').forEach(el => {
        el.className = '';
    });
    
    // Focus on current password
    setTimeout(() => {
        document.getElementById('currentPassword').focus();
    }, 300);
}

// Close modal
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('passwordModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closePasswordModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('passwordModal');
        if (modal.classList.contains('open')) {
            closePasswordModal();
        }
    }
});

// ============================================================
// PASSWORD VALIDATION & STRENGTH
// ============================================================

function validateNewPassword(password) {
    const requirements = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    // Update requirement indicators
    document.getElementById('reqLength').parentElement.className = requirements.length ? 'valid' : 'invalid';
    document.getElementById('reqUppercase').parentElement.className = requirements.uppercase ? 'valid' : 'invalid';
    document.getElementById('reqLowercase').parentElement.className = requirements.lowercase ? 'valid' : 'invalid';
    document.getElementById('reqNumber').parentElement.className = requirements.number ? 'valid' : 'invalid';
    
    // Update password strength
    updatePasswordStrength(password);
    
    // Check confirm password match if confirm has value
    const confirm = document.getElementById('confirmPassword').value;
    if (confirm) {
        checkPasswordMatch();
    }
}

function updatePasswordStrength(password) {
    const segments = document.querySelectorAll('.strength-bar .segment');
    const label = document.querySelector('.strength-label');
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    score = Math.min(score, 4);
    
    const levels = [
        { label: 'Weak', color: 'var(--danger)', class: 'weak' },
        { label: 'Fair', color: 'var(--warning)', class: 'medium' },
        { label: 'Good', color: 'var(--warning)', class: 'medium' },
        { label: 'Strong', color: 'var(--success)', class: 'strong' }
    ];
    
    const level = levels[score - 1] || levels[0];
    
    // Update segments
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
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const status = document.getElementById('matchStatus');
    const icon = status.querySelector('i');
    const text = document.getElementById('matchText');
    
    if (!confirmPassword) {
        status.className = 'match-status';
        return;
    }
    
    status.className = 'match-status show';
    const confirmInput = document.getElementById('confirmPassword');
    
    if (newPassword === confirmPassword && newPassword.length > 0) {
        status.className = 'match-status show match';
        icon.className = 'fas fa-check-circle';
        text.textContent = '✅ Passwords match';
        confirmInput.classList.remove('error');
        confirmInput.classList.add('success');
    } else {
        status.className = 'match-status show unmatch';
        icon.className = 'fas fa-times-circle';
        text.textContent = '❌ Passwords do not match';
        confirmInput.classList.remove('success');
        confirmInput.classList.add('error');
    }
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
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

// ============================================================
// HANDLE PASSWORD CHANGE
// ============================================================
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageEl = document.getElementById('passwordModalMessage');
    const submitBtn = document.getElementById('changePasswordBtn');
    
    // Clear previous messages
    messageEl.className = 'modal-message';
    messageEl.style.display = 'none';
    
    // Validate current password
    if (!currentPassword) {
        showModalMessage('Please enter your current password.', 'error');
        return;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
        showModalMessage('New password must be at least 6 characters long.', 'error');
        return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
        showModalMessage('New password must contain at least one uppercase letter.', 'error');
        return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
        showModalMessage('New password must contain at least one lowercase letter.', 'error');
        return;
    }
    
    if (!/\d/.test(newPassword)) {
        showModalMessage('New password must contain at least one number.', 'error');
        return;
    }
    
    // Validate confirm password
    if (newPassword !== confirmPassword) {
        showModalMessage('Passwords do not match.', 'error');
        return;
    }
    
    // Get current user
    const user = getUserSession();
    if (!user) {
        showModalMessage('User session not found. Please login again.', 'error');
        return;
    }
    
    // Simulate API call to change password
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Updating...';
    
    try {
        // In a real implementation, this would be an API call:
        // const response = await fetch('/api/change-password', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username: user.username, currentPassword, newPassword })
        // });
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Success - update user session with new password (in real scenario, would be stored on server)
        showModalMessage('⚠️ Database connection required', 'warning');
        
        // Log the change
        console.log(`🔑 Password changed for user: ${user.username}`);
        
        // Close modal after delay
        setTimeout(() => {
            closePasswordModal();
            showToast('⚠️ Database connection required for CRUD operations', 'warning', 3000);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Password change failed:', error);
        showModalMessage('❌ Failed to change password. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Password';
    }
}

function showModalMessage(message, type) {
    const el = document.getElementById('passwordModalMessage');
    el.className = 'modal-message ' + type;
    el.textContent = message;
    el.style.display = 'block';
}

// ============================================================
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
    
    // Update avatar initials - looking for the avatar div text node
    const avatarElements = document.querySelectorAll('.avatar');
    avatarElements.forEach(el => {
        if (el) {
            // Get the text node (first child) - not the dropdown arrow span
            const name = user.displayName || user.username || 'User';
            const initials = getInitials(name);
            
            // Find the text node (excluding the dropdown-arrow span)
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
// 3. LOGOUT FUNCTION
// ============================================================
function logoutUser() {
        showToast('👋 Logging out...', 'info', 2000);
        console.log('🔒 Logging out user...');
        clearUserSession();
        // Determine the correct login path based on current location
        const path = window.location.pathname;
        let loginPath = '../auth/login.html'; // Default path
        
        // If we're in the root or pages folder, adjust path
        if (path.includes('/dashboard/')) {
            loginPath = '../auth/login.html';
        } else if (path.includes('/pages/')) {
            loginPath = '../auth/login.html';
        }
        
        window.location.href = loginPath;

}

// ============================================================
// 4. NAVIGATION HELPERS
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
// 5. CHECK AUTHENTICATION
// ============================================================
function requireAuth(redirectTo) {
    // Determine default redirect path if not provided
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
// 6. EXPOSE FUNCTIONS TO GLOBAL SCOPE
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

console.log('🔧 Common.js loaded successfully');