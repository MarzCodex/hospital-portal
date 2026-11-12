// ========================================
// LOAD ITEMS — EXTERNAL FILE VIEWER
// Adapted from translator.js (read-only, upload-based)
// ========================================

// ========== GLOBAL VARIABLES ==========
let currentFileType = null;
let allItems = [];
let filteredItems = [];
let currentPage = 1;
let itemsPerPage = 20;
let sortColumn = null;
let sortDirection = 'asc';
let columnDefinitions = [];
let currentPopupTableColumns = [];
let tableStats = {
    totalItems: 0,
    filteredItems: 0,
    restrictedItems: 0,
    minPrice: null,
    maxPrice: null
};

// ========== LOOKUP TABLES ==========
const benefitSchemes = {
    1001: "Standard NHIF Benefit Scheme",
    1002: "Ngorongoro Benefit Scheme",
    1003: "Serengeti Benefit Scheme",
    1004: "Toto Afya Kadi Benefit Scheme",
    1005: "Student Benefit Scheme",
    1006: "Najali Benefit Scheme",
    1007: "Wekeza Benefit Scheme",
    1008: "Timiza Benefit Scheme",
    1009: "NSSF Benefit Scheme",
    1010: "TRA Benefit Scheme",
    1011: "Tarangire Benefit Scheme",
    1012: "Mikumi Benefit Scheme",
    1013: "Tanzanite Benefit Scheme",
    1014: "Essential Benefit Scheme (UHI)",
    1099: "Tourist Benefit Scheme (CHAN)",
    2001: "Bunge Health Insurance Scheme",
    3001: "BoT Health Insurance Scheme",
    4001: "Option One",
    5001: "Option Two",
    6001: "Option Three",
    7001: "CRDB Health Insurance Scheme",
    8001: "NMB Health Insurance Scheme",
    9001: "DCB Health Insurance Scheme",
    10001: "WVT Health Insurance Scheme",
    10002: "PSSF Benefit Scheme"
};

const itemTypes = {
    1: "Registration/Consultation Charges",
    2: "Inpatient Charges",
    3: "Medicine and Consumables",
    4: "Surgical Charges",
    5: "Diagnostic Examinations",
    6: "Procedural Charges",
    7: "Other Charges",
    8: "Major Surgeries",
    9: "Specialized Surgeries",
    10: "Specialized Procedures",
    11: "Cardiac Services",
    12: "Optical Services",
    13: "Physio and Occupational Services",
    14: "Evacuation Services",
    15: "Medical Appliance",
    16: "Renal Services",
    17: "Oncology Services",
    18: "Implant Services"
};

// ========== HELPER FUNCTIONS ==========
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatBoolean(value) {
    if (value === true || value === 1 || value === 'true' || value === 'True') return 'Yes';
    if (value === false || value === 0 || value === 'false' || value === 'False') return 'No';
    return 'N/A';
}

function getSchemeName(schemeId) {
    return benefitSchemes[schemeId] || '';
}

function getItemType(typeId) {
    return itemTypes[typeId] || '';
}

function getColumnDisplayName(columnName) {
    const nameMap = {
        'ItemCode': 'Item Code',
        'PriceCode': 'Price Code',
        'ItemTypeID': 'Item Type',
        'ItemName': 'Item Name',
        'Strength': 'Strength',
        'Dosage': 'Dosage',
        'PackageID': 'Package ID',
        'SchemeID': 'Scheme ID',
        'UnitPrice': 'Unit Price',
        'IsRestricted': 'Restricted',
        'IsOverTheCounter': 'OTC',
        'MaximumQuantity': 'Max Qty',
        'MaximumQuantityOutPatient': 'Max Qty (OP)',
        'MaximumQuantityInPatient': 'Max Qty (IP)',
        'HasCoPayment': 'Co-payment',
        'Action': 'Action',
        'VisitTypeID': 'Visit Type ID',
        'VisitTypeName': 'Visit Type Name',
        'RequiredInput': 'Required Input',
        'Alias': 'Alias',
        'RequiresRemarks': 'Requires Remarks',
        'RequiresReferralNo': 'Requires Referral No',
        'HasConsultationCharges': 'Has Consultation Charges',
        'Description': 'Description'
    };
    return nameMap[columnName] || columnName.replace(/([A-Z])/g, ' $1').trim();
}

// ========== COLUMN CONFIGURATIONS ==========
function getColumnConfigs(fileType) {
    if (fileType === 'price_package') {
        return {
            mainTableColumns: [
                'ItemCode', 'ItemTypeID', 'ItemName', 'Strength', 'Dosage',
                'UnitPrice', 'SchemeID', 'IsRestricted', 'Action'
            ],
            popupTableColumns: [
                'PackageID', 'PriceCode', 'IsOverTheCounter', 'MaximumQuantity',
                'MaximumQuantityOutPatient', 'MaximumQuantityInPatient', 'HasCoPayment'
            ]
        };
    } else if (fileType === 'visit_types') {
        return {
            mainTableColumns: [
                'VisitTypeID', 'VisitTypeName', 'RequiredInput', 'Alias',
                'RequiresRemarks', 'RequiresReferralNo', 'HasConsultationCharges',
                'Description', 'Action'
            ],
            popupTableColumns: []
        };
    }
    return { mainTableColumns: [], popupTableColumns: [] };
}

// ========== FILE UPLOAD HANDLING ==========
function initializeUploadZone() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

    if (!uploadZone || !fileInput) return;

    // Click to upload
    uploadZone.addEventListener('click', (e) => {
        // Don't trigger if clicking the "Change File" button
        if (e.target.classList.contains('change-file-btn')) return;
        fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Drag & drop — prevent default on dragover
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    });
}

async function handleFileUpload(file) {
    const fileName = file.name.toLowerCase();

    // Validate file type
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
        showNotification('Invalid file type. Please upload a .json or .txt file.', 'error');
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    const emptyState = document.getElementById('empty-state');
    const controls = document.getElementById('controls');
    const itemsTable = document.getElementById('items-table');
    const statsInfo = document.getElementById('stats-info');
    const fileInfoDiv = document.getElementById('file-info');

    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const startTime = Date.now();

    try {
        // Read file as text
        const content = await file.text();

        // Parse content (support JSON, single object, or line-delimited JSON)
        let data;
        const trimmed = content.trim();

        if (trimmed.startsWith('[')) {
            data = JSON.parse(trimmed);
        } else if (trimmed.startsWith('{')) {
            // Check if line-delimited JSON (multiple objects on separate lines)
            const lines = trimmed.split('\n').filter(line => line.trim());
            if (lines.length > 1) {
                data = lines.map(line => JSON.parse(line.trim()));
            } else {
                data = [JSON.parse(trimmed)];
            }
        } else {
            // Line-delimited JSON
            const lines = trimmed.split('\n').filter(line => line.trim());
            data = lines.map(line => JSON.parse(line.trim()));
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('File contains no valid data items');
        }

        // Auto-detect file type based on content
        const detectedType = detectFileType(data);

        if (!detectedType) {
            throw new Error('Unable to detect data type. File must contain either ItemCode (Price List) or VisitTypeID (Visit Types).');
        }

        // Confirm with user if tab mismatch
        const currentTab = getCurrentTab();
        if (currentTab !== detectedType) {
            const confirmed = confirm(
                `This file appears to contain ${detectedType === 'price_package' ? 'Price List' : 'Visit Types'} data, ` +
                `but you're on the ${currentTab === 'price_package' ? 'Price List' : 'Visit Types'} tab.\n\n` +
                `Switch tab automatically?`
            );

            if (confirmed) {
                switchTabTo(detectedType);
            } else {
                throw new Error('File data does not match current tab');
            }
        }

        const endTime = Date.now();

        // Store data
        allItems = data;
        filteredItems = [...data];
        currentFileType = detectedType;

        // Update file info display
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = `${(file.size / 1024).toFixed(2)} KB`;
        document.getElementById('item-count').textContent = data.length.toLocaleString();
        document.getElementById('load-time').textContent = `${endTime - startTime}ms`;
        fileInfoDiv.style.display = 'flex';

        // Show controls + table
        emptyState.style.display = 'none';
        controls.style.display = 'flex';
        itemsTable.style.display = 'table';
        statsInfo.style.display = 'block';

        // Reset pagination/sort state
        currentPage = 1;
        sortColumn = null;
        sortDirection = 'asc';

        // Render
        initializeColumns(data, detectedType);
        renderTableHeader();
        calculateStats();
        renderTable();

        // Compact the upload zone
        compactUploadZone(file.name);

        showNotification(`Loaded ${data.length.toLocaleString()} items from "${file.name}" in ${endTime - startTime}ms`, 'success');

    } catch (error) {
        console.error('File upload error:', error);

        // Reset UI
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <div class="empty-state-icon">❌</div>
            <h3>Failed to Load File</h3>
            <p>${error.message || 'Invalid file format'}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Expected: JSON array, single JSON object, or line-delimited JSON
            </p>
        `;

        controls.style.display = 'none';
        itemsTable.style.display = 'none';
        statsInfo.style.display = 'none';
        fileInfoDiv.style.display = 'none';

        showNotification(`Failed to load: ${error.message || 'Invalid file'}`, 'error');

    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        // Reset file input so same file can be re-uploaded
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    }
}

function detectFileType(data) {
    if (!data || data.length === 0) return null;

    const firstItem = data[0];

    // Price List: has ItemCode
    if ('ItemCode' in firstItem) return 'price_package';

    // Visit Types: has VisitTypeID
    if ('VisitTypeID' in firstItem) return 'visit_types';

    return null;
}

function getCurrentTab() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (!activeTab) return 'price_package';
    const tabId = activeTab.getAttribute('data-tab');
    return tabId === 'price' ? 'price_package' : 'visit_types';
}

function compactUploadZone(fileName) {
    const uploadZone = document.getElementById('upload-zone');
    if (!uploadZone) return;

    uploadZone.classList.add('compact');
    uploadZone.innerHTML = `
        <i class="fas fa-file-check" style="color: var(--success);"></i>
        <div class="upload-content">
            <p>${fileName}</p>
            <span>File loaded successfully — click to upload a different file</span>
        </div>
        <button class="change-file-btn" type="button">Change File</button>
        <input type="file" id="file-input" accept=".json,.txt" hidden>
    `;

    // Re-attach handlers
    const newFileInput = document.getElementById('file-input');
    const newChangeBtn = uploadZone.querySelector('.change-file-btn');

    if (newChangeBtn) {
        newChangeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            newFileInput.click();
        });
    }

    uploadZone.addEventListener('click', (e) => {
        if (e.target === newChangeBtn) return;
        newFileInput.click();
    });

    newFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Re-attach drag & drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files[0]) handleFileUpload(files[0]);
    });
}

// ========== TAB SWITCHING ==========
function switchTab(tabId) {
    const priceBtn = document.querySelector('[data-tab="price"]');
    const visitsBtn = document.querySelector('[data-tab="visits"]');
    const currentActive = document.querySelector('.tab-btn.active');
    const currentTab = currentActive ? currentActive.getAttribute('data-tab') : null;

    if (currentTab === tabId) return;

    if (tabId === 'price') {
        priceBtn?.classList.add('active');
        visitsBtn?.classList.remove('active');
        updateUploadHint('price_package');
    } else {
        visitsBtn?.classList.add('active');
        priceBtn?.classList.remove('active');
        updateUploadHint('visit_types');
    }

    // If data is loaded but from wrong tab, warn but don't clear
    if (allItems.length > 0 && currentFileType) {
        const expectedType = tabId === 'price' ? 'price_package' : 'visit_types';
        if (currentFileType !== expectedType) {
            showNotification(`Currently viewing uploaded ${currentFileType === 'price_package' ? 'Price List' : 'Visit Types'} data. Upload a new file to switch.`, 'info');
        }
    }
}

function switchTabTo(fileType) {
    const tabId = fileType === 'price_package' ? 'price' : 'visits';
    const priceBtn = document.querySelector('[data-tab="price"]');
    const visitsBtn = document.querySelector('[data-tab="visits"]');

    if (tabId === 'price') {
        priceBtn?.classList.add('active');
        visitsBtn?.classList.remove('active');
    } else {
        visitsBtn?.classList.add('active');
        priceBtn?.classList.remove('active');
    }
    updateUploadHint(fileType);
}

function updateUploadHint(fileType) {
    const hint = document.getElementById('upload-hint');
    if (hint) {
        hint.textContent = `Currently viewing: ${fileType === 'price_package' ? 'Price List' : 'Visit Types'}`;
    }
}

// ========== INITIALIZE COLUMNS ==========
function initializeColumns(data, fileType) {
    if (data.length === 0) return;

    const configs = getColumnConfigs(fileType);
    const columnsToUse = configs.mainTableColumns;
    currentPopupTableColumns = configs.popupTableColumns || [];

    columnDefinitions = columnsToUse.map(key => ({
        key: key,
        displayName: getColumnDisplayName(key),
        type: typeof data[0][key]
    }));

    const filterSelect = document.getElementById('column-filter');
    filterSelect.innerHTML = '<option value="">Filter by Column</option>';

    if (fileType === 'price_package') {
        const schemeOption = document.createElement('option');
        schemeOption.value = '__scheme__';
        schemeOption.textContent = 'Benefit Schemes';
        filterSelect.appendChild(schemeOption);
    }

    columnDefinitions.forEach(col => {
        if (col.key !== 'Action') {
            const option = document.createElement('option');
            option.value = col.key;
            option.textContent = col.displayName;
            filterSelect.appendChild(option);
        }
    });

    if (fileType === 'price_package') populateSchemeDropdown();
}

function populateSchemeDropdown() {
    const schemeValue = document.getElementById('scheme-value');
    schemeValue.innerHTML = '<option value="">Select Benefit Scheme...</option>';

    const uniqueSchemes = [...new Set(allItems.map(item => item.SchemeID))]
        .filter(schemeId => schemeId != null)
        .sort((a, b) => a - b);

    uniqueSchemes.forEach(schemeId => {
        const option = document.createElement('option');
        option.value = schemeId;
        const schemeName = getSchemeName(schemeId);
        option.textContent = schemeName ? `${schemeId} - ${schemeName}` : schemeId;
        schemeValue.appendChild(option);
    });
}

function updateFilterInput() {
    const columnFilter = document.getElementById('column-filter');
    const filterValue = document.getElementById('filter-value');
    const schemeValue = document.getElementById('scheme-value');
    const selectedValue = columnFilter.value;

    filterValue.style.display = 'none';
    schemeValue.style.display = 'none';

    if (selectedValue === '__scheme__') {
        schemeValue.style.display = 'block';
        schemeValue.focus();
    } else if (selectedValue) {
        filterValue.style.display = 'block';
        filterValue.placeholder = `Filter ${columnFilter.options[columnFilter.selectedIndex].text}...`;
        filterValue.focus();
    }
}

// ========== TABLE RENDERING ==========
function renderTableHeader() {
    const header = document.getElementById('table-header');
    header.innerHTML = '';
    const row = document.createElement('tr');

    columnDefinitions.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.displayName;
        th.setAttribute('data-column', col.key);

        if (col.key !== 'Action') {
            th.className = 'sortable';
            if (sortColumn === col.key) {
                th.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
            th.addEventListener('click', () => sortTable(col.key));
        }
        row.appendChild(th);
    });
    header.appendChild(row);
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    const loadingOverlay = document.getElementById('loading-overlay');

    loadingOverlay.style.display = 'flex';

    setTimeout(() => {
        tbody.innerHTML = '';
        const totalItems = filteredItems.length;
        const effectiveItemsPerPage = itemsPerPage === Infinity ? totalItems : itemsPerPage;
        const start = (currentPage - 1) * effectiveItemsPerPage;
        const end = start + effectiveItemsPerPage;
        const pageItems = filteredItems.slice(start, end);

        if (pageItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columnDefinitions.length}" style="text-align: center; padding: 60px;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3>No Matching Items Found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </td></tr>`;
            updatePagination();
            loadingOverlay.style.display = 'none';
            return;
        }

        pageItems.forEach((item, index) => {
            const row = document.createElement('tr');
            if (item.IsRestricted) row.classList.add('restricted');

            columnDefinitions.forEach(col => {
                const td = document.createElement('td');
                let value = item[col.key];

                if (col.key === 'UnitPrice') {
                    td.className = 'price-cell';
                    value = formatCurrency(value);
                } else if (col.key === 'ItemCode') {
                    td.className = 'code-cell';
                } else if (col.key === 'ItemName') {
                    td.className = 'item-name';
                } else if (col.key === 'Strength') {
                    td.className = 'item-name';
                } else if (col.key === 'SchemeID') {
                    const schemeName = getSchemeName(value);
                    value = schemeName ? `${value}<br><small>${schemeName}</small>` : value;
                } else if (col.key === 'ItemTypeID') {
                    const typeName = getItemType(value);
                    value = typeName ? `${value}<br><small>${typeName}</small>` : value;
                } else if (col.key === 'Action') {
                    value = `<button class="view-more-btn" data-index="${start + index}">View More</button>`;
                } else if (col.key === 'IsRestricted') {
                    value = item.IsRestricted ? '<span class="restricted-badge">Restricted</span>' : 'No';
                } else if (typeof value === 'boolean') {
                    td.className = 'boolean-cell';
                    value = formatBoolean(value);
                    td.classList.add(value === 'Yes' ? 'boolean-true' : 'boolean-false');
                }

                td.innerHTML = value == null || value === '' ? 'N/A' : value;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        attachViewMoreListeners();
        updatePagination();
        loadingOverlay.style.display = 'none';
    }, 50);
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredItems.sort((a, b) => {
        let aVal = a[column] ?? '';
        let bVal = b[column] ?? '';

        if (aVal === '' && bVal === '') return 0;
        if (aVal === '') return 1;
        if (bVal === '') return -1;

        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
            return sortDirection === 'asc' ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
        }

        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    renderTableHeader();
    renderTable();
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalItems = filteredItems.length;
    const effectiveItemsPerPage = itemsPerPage === Infinity ? totalItems : itemsPerPage;
    const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);

    if (itemsPerPage === Infinity || totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    let html = `
        <button id="first-page" ${currentPage === 1 ? 'disabled' : ''}>««</button>
        <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>«</button>
    `;

    const maxVisible = 7;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (start > 2) html += `<span>...</span>`;
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span>...</span>`;
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `
        <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
        <button id="last-page" ${currentPage === totalPages ? 'disabled' : ''}>»»</button>
        <div class="page-info">Page ${currentPage} of ${totalPages} | ${totalItems} items</div>
    `;

    pagination.innerHTML = html;

    document.getElementById('first-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage = 1; renderTable(); } });
    document.getElementById('prev-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
    document.getElementById('next-page')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderTable(); } });
    document.getElementById('last-page')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage = totalPages; renderTable(); } });
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderTable(); });
    });
}

// ========== FILTERING ==========
function filterItems() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const column = document.getElementById('column-filter').value;
    const filterValue = document.getElementById('filter-value').value.toLowerCase();
    const schemeValue = document.getElementById('scheme-value').value;

    filteredItems = allItems.filter(item => {
        if (search) {
            const matches = Object.values(item).some(val => val != null && String(val).toLowerCase().includes(search));
            if (!matches) return false;
        }
        if (column && column !== '__scheme__' && filterValue) {
            const itemValue = item[column];
            if (itemValue == null) return false;
            if (!String(itemValue).toLowerCase().includes(filterValue)) return false;
        }
        if (column === '__scheme__' && schemeValue) {
            if (String(item.SchemeID) !== schemeValue) return false;
        }
        return true;
    });
    currentPage = 1;
    calculateStats();
    renderTable();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('column-filter').value = '';
    document.getElementById('filter-value').value = '';
    document.getElementById('filter-value').style.display = 'none';
    document.getElementById('scheme-value').value = '';
    document.getElementById('scheme-value').style.display = 'none';
    document.getElementById('pageSize').value = '20';

    filteredItems = [...allItems];
    currentPage = 1;
    itemsPerPage = 20;
    sortColumn = null;
    sortDirection = 'asc';

    calculateStats();
    renderTableHeader();
    renderTable();
    showNotification('All filters have been reset', 'info');
}

function calculateStats() {
    tableStats.totalItems = allItems.length;
    tableStats.filteredItems = filteredItems.length;

    if (currentFileType === 'price_package') {
        tableStats.restrictedItems = filteredItems.filter(item => item.IsRestricted).length;
        const prices = filteredItems.map(item => parseFloat(item.UnitPrice)).filter(price => !isNaN(price));
        if (prices.length > 0) {
            tableStats.minPrice = Math.min(...prices);
            tableStats.maxPrice = Math.max(...prices);
        } else {
            tableStats.minPrice = tableStats.maxPrice = null;
        }
    } else {
        tableStats.restrictedItems = 0;
        tableStats.minPrice = tableStats.maxPrice = null;
    }
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const filterStats = document.getElementById('filter-stats');
    const restrictedCount = document.getElementById('restricted-count');
    const priceRange = document.getElementById('price-range');

    filterStats.textContent = `Showing ${tableStats.filteredItems} of ${tableStats.totalItems} items`;

    if (currentFileType === 'price_package') {
        restrictedCount.textContent = `${tableStats.restrictedItems} restricted items`;
        if (tableStats.minPrice !== null && tableStats.maxPrice !== null) {
            priceRange.textContent = `Price range: ${formatCurrency(tableStats.minPrice)} - ${formatCurrency(tableStats.maxPrice)}`;
        } else {
            priceRange.textContent = 'Price range: N/A';
        }
    } else {
        restrictedCount.textContent = '';
        priceRange.textContent = '';
    }
}

// ========== POPUP DETAILS ==========
function showPopupDetails(item) {
    const moreDetails = document.getElementById('more-details');
    const popHeader = document.getElementById('pop-header');
    const popBody = document.getElementById('pop-body');
    const popupClose = document.querySelector('.popup-close');

    popHeader.innerHTML = '';
    popBody.innerHTML = '';

    if (currentPopupTableColumns.length === 0) {
        const messageRow = document.createElement('tr');
        const messageCell = document.createElement('td');
        messageCell.colSpan = 1;
        messageCell.style.textAlign = 'center';
        messageCell.style.padding = '40px';
        messageCell.innerHTML = '<div style="font-size: 20px; margin-bottom: 10px;">ℹ️</div><div>No additional details available</div>';
        messageRow.appendChild(messageCell);
        popBody.appendChild(messageRow);
        moreDetails.classList.add('active');

        const closePopup = () => {
            moreDetails.classList.remove('active');
            document.removeEventListener('keydown', handleEscape);
        };
        popupClose.addEventListener('click', closePopup, { once: true });
        moreDetails.addEventListener('click', (e) => { if (e.target === moreDetails) closePopup(); }, { once: true });
        const handleEscape = (e) => { if (e.key === 'Escape') closePopup(); };
        document.addEventListener('keydown', handleEscape);
        return;
    }

    const headerRow = document.createElement('tr');
    currentPopupTableColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = getColumnDisplayName(col);
        headerRow.appendChild(th);
    });
    popHeader.appendChild(headerRow);

    const dataRow = document.createElement('tr');
    currentPopupTableColumns.forEach(col => {
        const td = document.createElement('td');
        let value = item[col];
        if (col === 'IsOverTheCounter' || col === 'HasCoPayment') {
            td.className = 'boolean-cell';
            value = formatBoolean(value);
            td.classList.add(value === 'Yes' ? 'boolean-true' : 'boolean-false');
        } else if (col === 'MaximumQuantity' || col === 'MaximumQuantityOutPatient' || col === 'MaximumQuantityInPatient') {
            td.style.textAlign = 'center';
            td.style.fontWeight = 'bold';
        } else if (col === 'PackageID' || col === 'PriceCode') {
            td.className = 'code-cell';
        }
        if (typeof value === 'boolean') value = formatBoolean(value);
        td.innerHTML = value == null || value === '' ? 'N/A' : value;
        dataRow.appendChild(td);
    });
    popBody.appendChild(dataRow);
    moreDetails.classList.add('active');

    const closePopup = () => {
        moreDetails.classList.remove('active');
        document.removeEventListener('keydown', handleEscape);
    };
    popupClose.addEventListener('click', closePopup, { once: true });
    moreDetails.addEventListener('click', (e) => { if (e.target === moreDetails) closePopup(); }, { once: true });
    const handleEscape = (e) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', handleEscape);
}

function attachViewMoreListeners() {
    document.querySelectorAll('.view-more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemIndex = parseInt(btn.dataset.index);
            const start = (currentPage - 1) * itemsPerPage;
            const pageItems = filteredItems.slice(start, start + itemsPerPage);
            showPopupDetails(pageItems[itemIndex - start]);
            e.stopPropagation();
        });
    });
}

// ========== INITIALIZE APP ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize upload zone
    initializeUploadZone();

    // Tab event listeners
    const priceTab = document.querySelector('[data-tab="price"]');
    const visitsTab = document.querySelector('[data-tab="visits"]');

    if (priceTab) priceTab.addEventListener('click', () => switchTab('price'));
    if (visitsTab) visitsTab.addEventListener('click', () => switchTab('visits'));

    // Control event listeners
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const columnFilter = document.getElementById('column-filter');
    const filterValue = document.getElementById('filter-value');
    const schemeValue = document.getElementById('scheme-value');
    const pageSizeSelect = document.getElementById('pageSize');

    if (searchInput) searchInput.addEventListener('input', filterItems);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (columnFilter) columnFilter.addEventListener('change', () => { updateFilterInput(); filterItems(); });
    if (filterValue) filterValue.addEventListener('input', filterItems);
    if (schemeValue) schemeValue.addEventListener('change', filterItems);
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            itemsPerPage = this.value === 'ALL' ? Infinity : parseInt(this.value);
            currentPage = 1;
            renderTable();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
            if (searchInput) searchInput.value = '';
            filterItems();
        }
    });
});