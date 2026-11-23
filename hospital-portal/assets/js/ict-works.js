/* ========================================
   ICT WORKS — SHARED JAVASCRIPT
   Reusable across all ICT Works module pages
   ======================================== */

// ========================================
// CONSTANTS
// ========================================
const ICT_CATEGORIES = [
    "Network", "Hardware", "Software", "Helpdesk",
    "Printer", "Email", "Security", "Backup",
    "Power","Access Control", "Database",
    "Power", "Peripheral", "Other"
];

const ICT_STORAGE_KEY = 'ictActivities';
const ICT_DATA_FILE = '../../data/ict-activities.json';

// ========================================
// GLOBAL STATE
// ========================================
let ictUsersCache = [];
let ictFileDataCache = [];   // Cached file data
let ictFileLoaded = false;   // Flag to prevent re-fetching

// ========================================
// PAGE INITIALIZATION (MAIN ENTRY POINT)
// ========================================
async function initICTWorksPage(activeItem) {
    try {
        // 1. Load sidebar
        const sidebarContainer = document.getElementById('ict-sidebar-container');
        if (sidebarContainer) {
            const sidebarRes = await fetch('../../components/ict-works-sidebar.html');
            if (sidebarRes.ok) {
                sidebarContainer.innerHTML = await sidebarRes.text();
            } else {
                console.error('Failed to load sidebar:', sidebarRes.status);
            }
        }

        // 2. Load header
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const headerRes = await fetch('../../components/header.html');
            if (headerRes.ok) {
                headerContainer.innerHTML = await headerRes.text();
            }
        }

        // 3. Load footer
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            const footerRes = await fetch('../../components/footer.html');
            if (footerRes.ok) {
                footerContainer.innerHTML = await footerRes.text();
            }
        }

        // 4. Load modals
        const modalsContainer = document.getElementById('modals-container');
        if (modalsContainer) {
            const modalsRes = await fetch('../../components/modals.html');
            if (modalsRes.ok) {
                modalsContainer.innerHTML = await modalsRes.text();
            }
        }

        // 5. Load file data (once per session)
        await loadInitialActivitiesFromFile();

        // 6. Highlight active sidebar item
        if (activeItem) {
            highlightActiveSidebarItem(activeItem);
        }

        // 7. Setup user info
        setupICTUserInfo();

        // 8. Setup user dropdown
        if (typeof initUserDropdown === 'function') initUserDropdown();

        // 9. Initialize sidebar toggles
        initICTSidebarToggles();

        // 10. Restore sidebar state
        restoreICTSidebarState();

        // 11. Resize handler
        window.addEventListener('resize', function() {
            if (typeof handleResponsiveSidebar === 'function') handleResponsiveSidebar();
        });

        console.log('✅ ICT Works page initialized:', activeItem);

    } catch (error) {
        console.error('Error initializing ICT Works page:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error loading page components', 'error');
        }
    }
}

// ========================================
// LOAD INITIAL ACTIVITIES FROM FILE
// ========================================
async function loadInitialActivitiesFromFile() {
    if (ictFileLoaded) return;  // Already loaded this session

    try {
        const response = await fetch(ICT_DATA_FILE);
        if (!response.ok) {
            console.warn('Could not fetch activities file:', response.status);
            ictFileLoaded = true;
            return;
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            ictFileDataCache = data;
            console.log(`📁 Loaded ${data.length} activities from file`);
        }

        ictFileLoaded = true;
    } catch (error) {
        console.warn('Failed to load activities file:', error);
        ictFileLoaded = true;
    }
}

// ========================================
// SIDEBAR: ACTIVE ITEM HIGHLIGHTING
// ========================================
function highlightActiveSidebarItem(itemId) {
    document.querySelectorAll('#ictSidebar .sidebar-menu a').forEach(a => {
        a.classList.remove('active');
    });

    const itemMap = {
        'dashboard': 'ict-works.html',
        'reports': 'reports.html',
        'search-activities': 'search-activities.html',
        'log-activity': 'log-activity.html',
        'activity-list': 'activity-list.html',
        'network-devices': 'network-devices.html',
        'asset-registry': 'asset-registry.html',
        'printers': 'printers.html',
        'maintenance': 'maintenance.html',
        'categories': 'categories.html',
        'locations': 'locations.html',
        'user-management': '../../pages/user management/user-management.html'
    };

    const targetHref = itemMap[itemId];
    if (!targetHref) {
        console.warn(`⚠️ Unknown sidebar item: "${itemId}"`);
        return;
    }

    const activeLink = Array.from(document.querySelectorAll('#ictSidebar .sidebar-menu a'))
        .find(a => a.getAttribute('href') === targetHref);

    if (activeLink) {
        activeLink.classList.add('active');
    } else {
        console.warn(`⚠️ Sidebar link not found for: "${targetHref}"`);
    }
}

// ========================================
// SIDEBAR: TOGGLES & STATE
// ========================================
function initICTSidebarToggles() {
    const closeBtn = document.getElementById('closeSidebarBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('ictSidebar');
            if (sidebar) sidebar.classList.add('hidden');
            document.body.classList.add('sidebar-collapsed');
            sessionStorage.setItem('ictSidebarCollapsed', 'true');
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleICTSidebar();
        });
    }
}

function toggleICTSidebar() {
    const sidebar = document.getElementById('ictSidebar');
    if (!sidebar) return;

    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        document.body.classList.remove('sidebar-collapsed');
        sessionStorage.setItem('ictSidebarCollapsed', 'false');
    } else {
        sidebar.classList.add('hidden');
        document.body.classList.add('sidebar-collapsed');
        sessionStorage.setItem('ictSidebarCollapsed', 'true');
    }
}

function closeICTSidebar() {
    const sidebar = document.getElementById('ictSidebar');
    if (sidebar) sidebar.classList.add('hidden');
    document.body.classList.add('sidebar-collapsed');
    sessionStorage.setItem('ictSidebarCollapsed', 'true');
}

function restoreICTSidebarState() {
    const isCollapsed = sessionStorage.getItem('ictSidebarCollapsed') === 'true';
    const sidebar = document.getElementById('ictSidebar');
    if (isCollapsed && sidebar) {
        sidebar.classList.add('hidden');
        document.body.classList.add('sidebar-collapsed');
    }
}

// ========================================
// USER INFO SETUP
// ========================================
function setupICTUserInfo() {
    const jobTitle = sessionStorage.getItem('jobTitle') || 'Staff';
    const userName = sessionStorage.getItem('userName') || 'User';
    const userAvatar = document.getElementById('userAvatar');
    const userNameSpan = document.getElementById('userName');
    const jobTitleSpan = document.getElementById('jobTitle');

    if (jobTitleSpan) jobTitleSpan.textContent = jobTitle + ' |';
    if (userNameSpan) userNameSpan.textContent = userName;
    if (userAvatar) {
        const initials = userName.split(' ').map(n => n[0]).join('');
        userAvatar.textContent = initials;
    }
}

// ========================================
// CURRENT USER OBJECT (for schema)
// ========================================
function getCurrentUserObject() {
    return {
        employeeId: sessionStorage.getItem('employeeId') || '',
        fullName: sessionStorage.getItem('userName') || 'User',
        department: sessionStorage.getItem('userDepartment') || 'N/A'
    };
}

// ========================================
// TICKET REF GENERATOR
// ========================================
function generateTicketRef(prefix = 'TCK') {
    const year = new Date().getFullYear();
    const existing = getAllActivities();
    const fullPrefix = `${prefix}-${year}-`;

    const sequences = existing
        .filter(a => a.ticketRef && a.ticketRef.startsWith(fullPrefix))
        .map(a => parseInt(a.ticketRef.replace(fullPrefix, ''), 10))
        .filter(n => !isNaN(n));

    const nextSeq = (sequences.length > 0 ? Math.max(...sequences) : 0) + 1;
    return `${fullPrefix}${String(nextSeq).padStart(4, '0')}`;
}

// ========================================
// ACTIVITY DATA OPERATIONS (MERGED)
// ========================================

// Merge file + localStorage, dedupe by ticketRef, sort by date desc
function getAllActivities() {
    const localData = JSON.parse(localStorage.getItem(ICT_STORAGE_KEY) || '[]');
    const fileData = ictFileDataCache || [];

    // Build map by ticketRef (localStorage wins over file for same ticket)
    const merged = new Map();

    // Add file data first (base layer)
    fileData.forEach(a => {
        if (a.ticketRef) {
            merged.set(a.ticketRef, { ...a, _source: 'file' });
        }
    });

    // Add/override with localStorage (runtime layer)
    localData.forEach(a => {
        if (a.ticketRef) {
            merged.set(a.ticketRef, { ...a, _source: 'local' });
        }
    });

    // Convert to array and sort by date desc (newest first)
    const result = Array.from(merged.values());
    result.sort((a, b) => {
        const dateA = new Date(a.date || a.loggedAt || 0);
        const dateB = new Date(b.date || b.loggedAt || 0);
        return dateB - dateA;
    });

    return result;
}

// Get only localStorage-only activities (for saving operations)
function getLocalActivities() {
    return JSON.parse(localStorage.getItem(ICT_STORAGE_KEY) || '[]');
}

function loadActivityById(ticketRef) {
    return getAllActivities().find(a => a.ticketRef === ticketRef);
}

function saveActivity(activity, isEdit = false) {
    const activities = getLocalActivities();
    const now = new Date().toISOString();

    if (isEdit) {
        const index = activities.findIndex(a => a.ticketRef === activity.ticketRef);
        if (index !== -1) {
            activities[index] = {
                ...activities[index],
                ...activity,
                editedBy: getCurrentUserObject(),
                editedAt: now
            };
        } else {
            activities.unshift(activity);
        }
    } else {
        // Auto-fill only: id, loggedBy, loggedAt
        const newActivity = {
            ...activity,
            id: activity.ticketRef,
            loggedBy: getCurrentUserObject(),
            loggedAt: now
        };
        activities.unshift(newActivity);
    }

    localStorage.setItem(ICT_STORAGE_KEY, JSON.stringify(activities));
    return activity;
}

function deleteActivity(ticketRef) {
    const activities = getLocalActivities();
    const filtered = activities.filter(a => a.ticketRef !== ticketRef);

    // If the record is from file only, we can't "delete" it from file
    // but we can hide it by not adding it back to localStorage
    // For now, only delete if exists in localStorage
    if (filtered.length === activities.length) {
        // Not in localStorage — check if in file
        const inFile = ictFileDataCache.find(a => a.ticketRef === ticketRef);
        if (inFile) {
            console.warn(`Activity ${ticketRef} exists only in file, cannot delete`);
            return false;
        }
    }

    localStorage.setItem(ICT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

function getFilteredActivities(filters = {}) {
    let activities = getAllActivities();

    if (filters.search) {
        const term = filters.search.toLowerCase();
        activities = activities.filter(a =>
            (a.ticketRef && a.ticketRef.toLowerCase().includes(term)) ||
            (a.supportRequested && a.supportRequested.toLowerCase().includes(term)) ||
            (a.requester?.fullName && a.requester.fullName.toLowerCase().includes(term)) ||
            (a.officerAssigned?.fullName && a.officerAssigned.fullName.toLowerCase().includes(term))
        );
    }

    if (filters.status) {
        activities = activities.filter(a => a.status === filters.status);
    }
    if (filters.priority) {
        activities = activities.filter(a => a.priority === filters.priority);
    }
    if (filters.startDate) {
        activities = activities.filter(a => a.date >= filters.startDate);
    }
    if (filters.endDate) {
        activities = activities.filter(a => a.date <= filters.endDate);
    }

    return activities;
}

function getDashboardStats() {
    const activities = getAllActivities();
    const today = new Date().toISOString().split('T')[0];

    return {
        total: activities.length,
        today: activities.filter(a => a.date === today).length,
        inProgress: activities.filter(a => a.status === 'In Progress').length,
        done: activities.filter(a => a.status === 'Done').length,
        blocked: activities.filter(a => a.status === 'Blocked').length,
        critical: activities.filter(a => a.priority === 'Critical').length,
        high: activities.filter(a => a.priority === 'High').length,
        recent: activities.slice(0, 5)
    };
}

// ========================================
// MULTI-SELECT CATEGORIES
// ========================================
function setupCategorySelector(tagsId, dropdownId, options = {}) {
    const tagsEl = document.getElementById(tagsId);
    const dropdownEl = document.getElementById(dropdownId);
    if (!tagsEl || !dropdownEl) return;

    const categories = options.categories || ICT_CATEGORIES;
    const onUpdate = options.onUpdate || null;
    let state = options.state || [];

    renderCategoryTags(tagsEl, state);
    renderCategoryDropdown(dropdownEl, state, categories);

    tagsEl.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownEl.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!tagsEl.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.classList.remove('active');
        }
    });

    window.toggleCategory = function(category, event) {
        if (event) event.stopPropagation();
        const index = state.indexOf(category);
        if (index === -1) state.push(category);
        else state.splice(index, 1);

        renderCategoryTags(tagsEl, state);
        renderCategoryDropdown(dropdownEl, state, categories);
        if (onUpdate) onUpdate(state);
    };

    window.removeCategory = function(category, event) {
        if (event) event.stopPropagation();
        const index = state.indexOf(category);
        if (index !== -1) {
            state.splice(index, 1);
            renderCategoryTags(tagsEl, state);
            renderCategoryDropdown(dropdownEl, state, categories);
            if (onUpdate) onUpdate(state);
        }
    };

    return state;
}

function renderCategoryTags(tagsEl, state) {
    if (!tagsEl) return;
    if (state.length === 0) {
        tagsEl.innerHTML = '<span class="multi-select-placeholder">Click to select categories...</span>';
        return;
    }
    tagsEl.innerHTML = state.map(cat => `
        <span class="category-tag">
            ${cat}
            <button type="button" class="tag-remove" onclick="removeCategory('${cat}', event)">×</button>
        </span>
    `).join('');
}

function renderCategoryDropdown(dropdownEl, state, categories) {
    if (!dropdownEl) return;
    dropdownEl.innerHTML = categories.map(cat => `
        <div class="category-dropdown-item ${state.includes(cat) ? 'selected' : ''}"
             onclick="toggleCategory('${cat}', event)">
            <span>${cat}</span>
            ${state.includes(cat) ? '<i class="fas fa-check"></i>' : ''}
        </div>
    `).join('');
}

// ========================================
// DURATION CALCULATOR
// ========================================
function setupDurationCalculation(startId, endId, durationId) {
    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);
    const durationInput = document.getElementById(durationId);
    if (!startInput || !endInput || !durationInput) return;

    const calcDuration = () => {
        if (!startInput.value || !endInput.value) {
            durationInput.value = '';
            return;
        }
        const [startH, startM] = startInput.value.split(':').map(Number);
        const [endH, endM] = endInput.value.split(':').map(Number);
        let startMinutes = startH * 60 + startM;
        let endMinutes = endH * 60 + endM;
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        const totalMinutes = endMinutes - startMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        let display = '';
        if (hours > 0) display += `${hours}h `;
        if (mins > 0) display += `${mins}m`;
        durationInput.value = display.trim() || '0m';
    };

    startInput.addEventListener('input', calcDuration);
    endInput.addEventListener('input', calcDuration);
}

// ========================================
// ATTACHMENTS HANDLER
// ========================================
function setupAttachments(inputId, listId, countId, options = {}) {
    const input = document.getElementById(inputId);
    const listEl = document.getElementById(listId);
    const countEl = document.getElementById(countId);
    if (!input || !listEl) return;

    let state = options.state || [];
    const onUpdate = options.onUpdate || null;

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            state.push({ name: file.name, size: file.size, type: file.type });
        });
        renderAttachments(listEl, countEl, state);
        input.value = '';
        if (onUpdate) onUpdate(state);
    });

    window.removeAttachment = function(index) {
        state.splice(index, 1);
        renderAttachments(listEl, countEl, state);
        if (onUpdate) onUpdate(state);
    };

    renderAttachments(listEl, countEl, state);
    return state;
}

function renderAttachments(listEl, countEl, state) {
    if (!listEl) return;
    if (state.length === 0) {
        listEl.innerHTML = '';
        if (countEl) countEl.textContent = 'No files chosen';
        return;
    }
    if (countEl) {
        countEl.textContent = `${state.length} file${state.length !== 1 ? 's' : ''} chosen`;
    }
    listEl.innerHTML = state.map((file, index) => `
        <div class="attachment-item">
            <div class="att-name">
                <i class="fas fa-file"></i>
                ${file.name}
                <span class="att-size">(${formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="att-remove" onclick="removeAttachment(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ========================================
// USER DROPDOWNS
// ========================================
async function loadICTUsersCache() {
    try {
        const response = await fetch('../../data/users.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        ictUsersCache = await response.json();
        if (!Array.isArray(ictUsersCache)) {
            throw new Error('Invalid users data');
        }
        return ictUsersCache;
    } catch (error) {
        console.error('Failed to load users:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to load users', 'error');
        }
        return [];
    }
}

function populateICTUserDropdown(selectId, options = {}) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const placeholder = options.placeholder || '-- Select User --';
    const filterFn = options.filterFn || (() => true);
    const labelFormat = options.labelFormat || ((u) => `${u.fullName || 'Unknown'} (${u.department || 'N/A'})`);
    const dataFormat = options.dataFormat || ((u) => ({
        employeeId: u.employeeId || u.id,
        fullName: u.fullName || 'Unknown',
        department: u.department || 'N/A'
    }));

    select.innerHTML = `<option value="">${placeholder}</option>`;

    ictUsersCache
        .filter(filterFn)
        .filter(u => u.status === 'Active')
        .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
        .forEach(user => {
            const option = document.createElement('option');
            option.value = user.employeeId || user.id;
            option.textContent = labelFormat(user);
            option.dataset.userData = JSON.stringify(dataFormat(user));
            select.appendChild(option);
        });
}

// ========================================
// UTILITY: FORMAT DATE
// ========================================
function formatICTDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch { return dateStr; }
}

function formatICTDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateStr; }
}

// ========================================
// UTILITY: PRIORITY / STATUS BADGES
// ========================================
function getPriorityBadge(priority) {
    const colors = {
        'Critical': { bg: '#c0392b', color: 'white' },
        'High': { bg: '#e67e22', color: 'white' },
        'Medium': { bg: '#f39c12', color: 'white' },
        'Normal': { bg: '#27ae60', color: 'white' }
    };
    const c = colors[priority] || { bg: '#95a5a6', color: 'white' };
    return `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${c.bg};color:${c.color};">${priority || 'N/A'}</span>`;
}

function getStatusBadge(status) {
    const colors = {
        'Done': { bg: '#27ae60', color: 'white' },
        'In Progress': { bg: '#3498db', color: 'white' },
        'Blocked': { bg: '#e74c3c', color: 'white' }
    };
    const c = colors[status] || { bg: '#95a5a6', color: 'white' };
    return `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${c.bg};color:${c.color};">${status || 'N/A'}</span>`;
}

// ========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ========================================
window.initICTWorksPage = initICTWorksPage;
window.loadInitialActivitiesFromFile = loadInitialActivitiesFromFile;
window.highlightActiveSidebarItem = highlightActiveSidebarItem;
window.initICTSidebarToggles = initICTSidebarToggles;
window.toggleICTSidebar = toggleICTSidebar;
window.closeICTSidebar = closeICTSidebar;
window.restoreICTSidebarState = restoreICTSidebarState;
window.setupICTUserInfo = setupICTUserInfo;
window.getCurrentUserObject = getCurrentUserObject;
window.generateTicketRef = generateTicketRef;
window.getAllActivities = getAllActivities;
window.getLocalActivities = getLocalActivities;
window.loadActivityById = loadActivityById;
window.saveActivity = saveActivity;
window.deleteActivity = deleteActivity;
window.getFilteredActivities = getFilteredActivities;
window.getDashboardStats = getDashboardStats;
window.setupCategorySelector = setupCategorySelector;
window.renderCategoryTags = renderCategoryTags;
window.renderCategoryDropdown = renderCategoryDropdown;
window.setupDurationCalculation = setupDurationCalculation;
window.setupAttachments = setupAttachments;
window.renderAttachments = renderAttachments;
window.formatFileSize = formatFileSize;
window.loadICTUsersCache = loadICTUsersCache;
window.populateICTUserDropdown = populateICTUserDropdown;
window.formatICTDate = formatICTDate;
window.formatICTDateTime = formatICTDateTime;
window.getPriorityBadge = getPriorityBadge;
window.getStatusBadge = getStatusBadge;

// Debug exports
window.ictUsersCache = ictUsersCache;
window.ICT_CATEGORIES = ICT_CATEGORIES;
window.ICT_STORAGE_KEY = ICT_STORAGE_KEY;