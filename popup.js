// ── SVG ICONS (Lucide Style) ──────────────────────────────────────────────────
const ICONS = {
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    rotateCcw: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>`,
    alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    shieldAlert: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    searchX: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    palette: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125 a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`
};

// ── APP STATE ─────────────────────────────────────────────────────────────────
const state = {
    tabId: null,
    currentUrl: '',
    colors: { bg: [], text: [], border: [] },
    allList: [], // combined list
    modifiedMap: new Map(), // key: `${type}_${originalRgb}` -> { oldColor, currentColor, inputEl, rowEl }
    currentTab: 'all', // 'all' | 'bg' | 'text' | 'border'
    searchQuery: '',
    exportFormat: 'css'
};

// ── DOM ELEMENTS ──────────────────────────────────────────────────────────────
const DOM = {
    colorList: document.getElementById('colorList'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    tabGroup: document.getElementById('tabGroup'),
    countAll: document.getElementById('countAll'),
    countBg: document.getElementById('countBg'),
    countText: document.getElementById('countText'),
    countBorder: document.getElementById('countBorder'),
    tabBorderBtn: document.getElementById('tabBorderBtn'),
    activeDomain: document.getElementById('activeDomain'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnResetAll: document.getElementById('btnResetAll'),
    btnExport: document.getElementById('btnExport'),
    exportModal: document.getElementById('exportModal'),
    btnCloseExport: document.getElementById('btnCloseExport'),
    formatSelector: document.getElementById('formatSelector'),
    codePreview: document.getElementById('codePreview'),
    btnCopyExport: document.getElementById('btnCopyExport'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
};

// ── INITIALIZATION ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    loadPageColors();
});

// ── EVENT BINDINGS ────────────────────────────────────────────────────────────
function initEvents() {
    // Search input
    DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        DOM.searchClear.style.display = state.searchQuery ? 'flex' : 'none';
        renderFilteredColors();
    });

    DOM.searchClear.addEventListener('click', () => {
        DOM.searchInput.value = '';
        state.searchQuery = '';
        DOM.searchClear.style.display = 'none';
        DOM.searchInput.focus();
        renderFilteredColors();
    });

    // Tab buttons
    DOM.tabGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        DOM.tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTab = btn.getAttribute('data-tab');
        renderFilteredColors();
    });

    // Refresh button
    DOM.btnRefresh.addEventListener('click', () => {
        DOM.btnRefresh.classList.add('spinning');
        loadPageColors(() => {
            setTimeout(() => DOM.btnRefresh.classList.remove('spinning'), 400);
            showToast('Palet warna diperbarui!');
        });
    });

    // Reset All button
    DOM.btnResetAll.addEventListener('click', () => {
        resetAllColors();
    });

    // Export Modal Open & Close
    DOM.btnExport.addEventListener('click', () => {
        updateExportPreview();
        DOM.exportModal.classList.add('open');
    });

    DOM.btnCloseExport.addEventListener('click', () => {
        DOM.exportModal.classList.remove('open');
    });

    DOM.exportModal.addEventListener('click', (e) => {
        if (e.target === DOM.exportModal) {
            DOM.exportModal.classList.remove('open');
        }
    });

    // Format selection
    DOM.formatSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.format-btn');
        if (!btn) return;
        DOM.formatSelector.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exportFormat = btn.getAttribute('data-format');
        updateExportPreview();
    });

    // Copy Export Snippet
    DOM.btnCopyExport.addEventListener('click', () => {
        const code = DOM.codePreview.textContent;
        navigator.clipboard.writeText(code).then(() => {
            showToast('Kode palet disalin!');
            DOM.exportModal.classList.remove('open');
        });
    });
}

// ── COLOR FETCHING ────────────────────────────────────────────────────────────
function loadPageColors(callback) {
    // Render loading indicator
    showLoading();

    // Check if running in browser extension context
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
        loadMockData();
        if (callback) callback();
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
            showStatus('error', ICONS.alertTriangle, 'Tidak Ada Tab Aktif', 'Buka halaman web di tab Chrome lalu coba lagi.');
            if (callback) callback();
            return;
        }

        const activeTab = tabs[0];
        state.tabId = activeTab.id;
        state.currentUrl = activeTab.url || '';

        // Display domain in subtitle
        try {
            if (activeTab.url) {
                const url = new URL(activeTab.url);
                DOM.activeDomain.textContent = url.hostname.replace(/^www\./, '') || 'Live Web Page';
            }
        } catch (_) {
            DOM.activeDomain.textContent = 'Live Web Page';
        }

        // Restrict chrome:// or edge:// internal pages
        if (state.currentUrl.startsWith('chrome://') || state.currentUrl.startsWith('edge://') || state.currentUrl.startsWith('chrome-extension://')) {
            showStatus('error', ICONS.shieldAlert, 'Halaman Diproteksi', 'Chrome membatasi ekstensi pada halaman internal browser. Buka situs publik seperti github.com atau google.com.');
            if (callback) callback();
            return;
        }

        chrome.tabs.sendMessage(state.tabId, { action: "getColors" }, (response) => {
            if (chrome.runtime.lastError) {
                showStatus('error', ICONS.shieldAlert, 'Akses Halaman Dibatasi', 'Tidak dapat menyuntikkan script ke halaman ini. Silakan refresh halaman tab terlebih dahulu.');
                if (callback) callback();
                return;
            }

            if (!response || !response.colors) {
                showStatus('error', ICONS.alertTriangle, 'Gagal Mengambil Warna', 'Respon dari halaman kosong.');
                if (callback) callback();
                return;
            }

            handleColorsReceived(response.colors);
            if (callback) callback();
        });
    });
}

function handleColorsReceived(colorsData) {
    state.colors.bg = colorsData.bg || [];
    state.colors.text = colorsData.text || [];
    state.colors.border = colorsData.border || [];

    // Hide or show border tab depending on presence
    if (state.colors.border.length === 0) {
        DOM.tabBorderBtn.style.display = 'none';
        if (state.currentTab === 'border') state.currentTab = 'all';
    } else {
        DOM.tabBorderBtn.style.display = 'flex';
    }

    // Combine list for 'All'
    state.allList = [
        ...state.colors.bg.map(c => ({ ...c, type: 'bg' })),
        ...state.colors.text.map(c => ({ ...c, type: 'text' })),
        ...state.colors.border.map(c => ({ ...c, type: 'border' }))
    ];

    // Update Counts in Badges
    DOM.countAll.textContent = state.allList.length;
    DOM.countBg.textContent = state.colors.bg.length;
    DOM.countText.textContent = state.colors.text.length;
    DOM.countBorder.textContent = state.colors.border.length;

    renderFilteredColors();
}

// ── RENDER FILTERED COLORS ────────────────────────────────────────────────────
function renderFilteredColors() {
    let list = [];
    if (state.currentTab === 'all') {
        list = state.allList;
    } else {
        list = state.colors[state.currentTab] || [];
    }

    // Apply search filter if query is present
    if (state.searchQuery) {
        list = list.filter(item => {
            const hex = rgbToHex(item.value) || '';
            const val = item.value.toLowerCase();
            return hex.toLowerCase().includes(state.searchQuery) ||
                   val.includes(state.searchQuery) ||
                   item.type.toLowerCase().includes(state.searchQuery);
        });
    }

    if (list.length === 0) {
        if (state.searchQuery) {
            showStatus('', ICONS.searchX, 'Warna Tidak Ditemukan', `Tidak ada warna yang cocok dengan "${state.searchQuery}".`);
        } else {
            showStatus('', ICONS.palette, 'Belum Ada Warna', 'Tidak ada warna terdeteksi pada kategori ini.');
        }
        return;
    }

    DOM.colorList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    list.forEach(item => {
        const hex = rgbToHex(item.value);
        if (!hex) return;

        const row = createColorCard(item, hex);
        fragment.appendChild(row);
    });

    DOM.colorList.appendChild(fragment);
}

// ── CREATE COLOR CARD ─────────────────────────────────────────────────────────
function createColorCard(item, originalHex) {
    const key = `${item.type}_${item.value}`;
    const modifiedInfo = state.modifiedMap.get(key);
    const isModified = !!modifiedInfo;
    const currentHex = isModified ? rgbToHex(modifiedInfo.currentColor) : originalHex;
    const currentRgb = isModified ? modifiedInfo.currentColor : item.value;

    const card = document.createElement('div');
    card.className = `color-card ${isModified ? 'is-modified' : ''}`;
    card.setAttribute('data-key', key);

    // Type badge label
    const typeLabel = item.type === 'bg' ? 'BG' : (item.type === 'text' ? 'TXT' : 'BDR');

    card.innerHTML = `
        <div class="swatch-box" title="Klik untuk ubah warna">
            <div class="swatch-fill" style="background: ${currentRgb};"></div>
        </div>
        <div class="color-details">
            <div class="color-hex-row">
                <span class="color-hex" title="Klik untuk salin HEX">${currentHex}</span>
                <span class="type-tag ${item.type}">${typeLabel}</span>
                ${isModified ? '<span class="modified-tag">Edited</span>' : ''}
            </div>
            <div class="color-meta">
                <span class="count-pill">${item.count} elemen</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="action-btn copy-btn" title="Salin HEX">${ICONS.copy}</button>
            <button class="action-btn reset-item-btn ${isModified ? 'enabled' : ''}" title="Reset warna ini" ${isModified ? '' : 'disabled'}>${ICONS.rotateCcw}</button>
            <div class="picker-btn-wrapper" title="Ganti warna dengan picker">
                <input type="color" value="${currentHex}" data-type="${item.type}" data-original="${item.value}">
            </div>
        </div>
    `;

    // Elements
    const swatchBox = card.querySelector('.swatch-box');
    const swatchFill = card.querySelector('.swatch-fill');
    const hexLabel = card.querySelector('.color-hex');
    const copyBtn = card.querySelector('.copy-btn');
    const resetBtn = card.querySelector('.reset-item-btn');
    const colorInput = card.querySelector('input[type="color"]');

    // 1. Hover Highlight on active tab
    card.addEventListener('mouseenter', () => {
        if (state.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.sendMessage(state.tabId, {
                action: "highlightColor",
                color: isModified ? modifiedInfo.currentColor : item.value,
                colorType: item.type
            });
        }
    });

    card.addEventListener('mouseleave', () => {
        if (state.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.sendMessage(state.tabId, { action: "clearHighlight" });
        }
    });

    // 2. Click Hex or Copy Button -> Copy to clipboard
    const triggerCopy = (e) => {
        e.stopPropagation();
        const hexToCopy = hexLabel.textContent.trim();
        navigator.clipboard.writeText(hexToCopy).then(() => {
            copyBtn.innerHTML = ICONS.check;
            copyBtn.classList.add('copied');
            showToast(`${hexToCopy} disalin!`);
            setTimeout(() => {
                copyBtn.innerHTML = ICONS.copy;
                copyBtn.classList.remove('copied');
            }, 1400);
        });
    };

    hexLabel.addEventListener('click', triggerCopy);
    copyBtn.addEventListener('click', triggerCopy);

    // 3. Swatch click triggers color input
    swatchBox.addEventListener('click', () => {
        colorInput.click();
    });

    // 4. Color Picker input -> Replace in real time
    colorInput.addEventListener('input', (e) => {
        const newHex = e.target.value;
        const newRgb = hexToRgb(newHex);

        swatchFill.style.background = newHex;
        hexLabel.textContent = newHex;
        card.classList.add('is-modified');
        resetBtn.disabled = false;
        resetBtn.classList.add('enabled');

        // Check modified tag
        if (!card.querySelector('.modified-tag')) {
            const hexRow = card.querySelector('.color-hex-row');
            const modTag = document.createElement('span');
            modTag.className = 'modified-tag';
            modTag.textContent = 'Edited';
            hexRow.appendChild(modTag);
        }

        const prevCurrentColor = state.modifiedMap.get(key)?.currentColor || item.value;

        // Update modified map
        state.modifiedMap.set(key, {
            type: item.type,
            originalColor: item.value,
            currentColor: newRgb,
            originalHex: originalHex,
            currentHex: newHex,
            inputEl: colorInput,
            rowEl: card
        });

        updateResetAllButtonVisibility();

        // Send replaceColor to content script
        if (state.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.sendMessage(state.tabId, {
                action: "replaceColor",
                oldColor: prevCurrentColor,
                newColor: newHex,
                colorType: item.type
            });
        }
    });

    // 5. Reset single color button
    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.modifiedMap.has(key)) return;

        const info = state.modifiedMap.get(key);

        if (state.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.sendMessage(state.tabId, {
                action: "resetColor",
                currentColor: info.currentColor,
                originalColor: info.originalColor,
                colorType: item.type
            });
        }

        // Restore UI
        swatchFill.style.background = item.value;
        hexLabel.textContent = originalHex;
        colorInput.value = originalHex;
        card.classList.remove('is-modified');
        resetBtn.disabled = true;
        resetBtn.classList.remove('enabled');

        const modTag = card.querySelector('.modified-tag');
        if (modTag) modTag.remove();

        state.modifiedMap.delete(key);
        updateResetAllButtonVisibility();
        showToast(`${originalHex} dikembalikan ke semula.`);
    });

    return card;
}

// ── RESET ALL COLORS ──────────────────────────────────────────────────────────
function resetAllColors() {
    if (state.modifiedMap.size === 0) return;

    if (state.tabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.sendMessage(state.tabId, { action: "resetAll" });
    }

    state.modifiedMap.clear();
    updateResetAllButtonVisibility();
    renderFilteredColors();
    showToast('Semua warna dikembalikan ke default!');
}

function updateResetAllButtonVisibility() {
    if (state.modifiedMap.size > 0) {
        DOM.btnResetAll.style.display = 'flex';
        DOM.btnResetAll.classList.add('has-changes');
        DOM.btnResetAll.title = `Reset ${state.modifiedMap.size} warna yang diubah`;
    } else {
        DOM.btnResetAll.style.display = 'none';
        DOM.btnResetAll.classList.remove('has-changes');
    }
}

// ── EXPORT PALETTE BUILDER ────────────────────────────────────────────────────
function updateExportPreview() {
    // Collect unique colors currently displayed or total
    const hexMap = new Map();
    state.allList.forEach(item => {
        const hex = rgbToHex(item.value);
        if (hex && !hexMap.has(hex)) {
            hexMap.set(hex, item.type);
        }
    });

    const hexList = Array.from(hexMap.keys());
    let code = '';

    if (state.exportFormat === 'css') {
        code = ':root {\n' +
            hexList.map((hex, i) => `  --color-${i + 1}: ${hex};`).join('\n') +
            '\n}';
    } else if (state.exportFormat === 'tailwind') {
        code = 'module.exports = {\n  theme: {\n    extend: {\n      colors: {\n' +
            hexList.map((hex, i) => `        'palette-${i + 1}': '${hex}',`).join('\n') +
            '\n      }\n    }\n  }\n};';
    } else if (state.exportFormat === 'hex') {
        code = hexList.join('\n');
    } else if (state.exportFormat === 'json') {
        code = JSON.stringify(hexList, null, 2);
    }

    DOM.codePreview.textContent = code;
}

// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────
let toastTimeout = null;
function showToast(message) {
    DOM.toastMsg.textContent = message;
    DOM.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 2200);
}

// ── STATUS / LOADING HELPERS ──────────────────────────────────────────────────
function showLoading() {
    DOM.colorList.innerHTML = `
        <div class="status-card">
            <div class="pulsing-loader"><span></span><span></span><span></span></div>
            <div class="status-title">Memindai Halaman...</div>
            <div class="status-desc">Mendeteksi warna background, teks, dan elemen CSS.</div>
        </div>
    `;
}

function showStatus(type, svgIcon, title, message) {
    DOM.colorList.innerHTML = `
        <div class="status-card ${type}">
            <div class="status-icon-wrapper">
                ${svgIcon}
            </div>
            <div class="status-title">${title}</div>
            <div class="status-desc">${message}</div>
        </div>
    `;
}

// ── CONVERTERS ────────────────────────────────────────────────────────────────
function rgbToHex(color) {
    if (!color) return null;
    const nums = color.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length < 3) return null;
    const [r, g, b] = nums.slice(0, 3)
        .map(x => Math.round(parseFloat(x)).toString(16).padStart(2, '0'));
    return `#${r}${g}${b}`.toUpperCase();
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

// ── MOCK DATA FOR LOCAL TESTING ───────────────────────────────────────────────
function loadMockData() {
    DOM.activeDomain.textContent = 'Demo Mode (Local)';
    const mockColors = {
        bg: [
            { value: 'rgb(11, 15, 25)', type: 'bg', count: 48 },
            { value: 'rgb(139, 92, 246)', type: 'bg', count: 18 },
            { value: 'rgb(236, 72, 153)', type: 'bg', count: 12 },
            { value: 'rgb(30, 41, 59)', type: 'bg', count: 8 },
            { value: 'rgb(16, 185, 129)', type: 'bg', count: 5 }
        ],
        text: [
            { value: 'rgb(248, 250, 252)', type: 'text', count: 64 },
            { value: 'rgb(148, 163, 184)', type: 'text', count: 32 },
            { value: 'rgb(196, 181, 253)', type: 'text', count: 14 },
            { value: 'rgb(244, 63, 94)', type: 'text', count: 6 }
        ],
        border: [
            { value: 'rgb(51, 65, 85)', type: 'border', count: 24 },
            { value: 'rgb(139, 92, 246)', type: 'border', count: 7 }
        ]
    };
    handleColorsReceived(mockColors);
}