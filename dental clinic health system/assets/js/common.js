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