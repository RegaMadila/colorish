// Filter warna transparan
function isTransparent(color) {
    if (!color || color === 'transparent') return true;
    const m = color.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    if (m && parseFloat(m[1]) === 0) return true;
    return false;
}

// Normalisasi format warna ke "rgb(r, g, b)" agar tidak ada duplikat
// Contoh: "rgba(0, 0, 0, 1)" → "rgb(0, 0, 0)"
function normalizeColor(color) {
    if (!color) return null;
    const nums = color.match(/[\d.]+/g);
    if (!nums || nums.length < 3) return color;
    const r = Math.round(parseFloat(nums[0]));
    const g = Math.round(parseFloat(nums[1]));
    const b = Math.round(parseFloat(nums[2]));
    return `rgb(${r}, ${g}, ${b})`;
}

// Ambil semua warna unik beserta jumlah elemen yang menggunakannya
function getAllColors() {
    const elements = document.querySelectorAll('*');
    const bgMap = new Map();
    const textMap = new Map();
    const borderMap = new Map();

    elements.forEach(el => {
        // Skip script, style, SVG sub-elements that might pollute colors
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') return;

        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        const border = style.borderColor;
        const borderWidth = parseFloat(style.borderWidth) || 0;

        if (bg && !isTransparent(bg)) {
            const normBg = normalizeColor(bg);
            bgMap.set(normBg, (bgMap.get(normBg) || 0) + 1);
        }
        if (fg && !isTransparent(fg)) {
            const normFg = normalizeColor(fg);
            textMap.set(normFg, (textMap.get(normFg) || 0) + 1);
        }
        if (border && !isTransparent(border) && borderWidth > 0 && style.borderStyle !== 'none') {
            const normBorder = normalizeColor(border);
            borderMap.set(normBorder, (borderMap.get(normBorder) || 0) + 1);
        }
    });

    const toSortedArray = (map, type) =>
        Array.from(map.entries())
            .map(([value, count]) => ({ value, type, count }))
            .sort((a, b) => b.count - a.count);

    return {
        bg: toSortedArray(bgMap, 'bg'),
        text: toSortedArray(textMap, 'text'),
        border: toSortedArray(borderMap, 'border')
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Ambil semua warna
    if (request.action === "getColors") {
        sendResponse({ colors: getAllColors() });
    }

    // Highlight elemen yang pakai warna ini saat hover di popup
    if (request.action === "highlightColor") {
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            let match = false;
            if (request.colorType === 'bg' && style.backgroundColor === request.color) match = true;
            if (request.colorType === 'text' && style.color === request.color) match = true;
            if (request.colorType === 'border' && style.borderColor === request.color) match = true;
            if (!request.colorType) {
                if (style.backgroundColor === request.color || style.color === request.color || style.borderColor === request.color) match = true;
            }

            if (match) {
                el.dataset.colorishHighlight = '1';
                el.dataset.colorishPrevOutline = el.style.outline || '';
                el.dataset.colorishPrevOutlineOffset = el.style.outlineOffset || '';
                el.dataset.colorishPrevBoxShadow = el.style.boxShadow || '';

                el.style.setProperty('outline', '2px dashed #8b5cf6', 'important');
                el.style.setProperty('outline-offset', '2px', 'important');
                el.style.setProperty('box-shadow', '0 0 12px rgba(139, 92, 246, 0.45)', 'important');
            }
        });
    }

    // Hapus semua highlight
    if (request.action === "clearHighlight") {
        document.querySelectorAll('[data-colorish-highlight]').forEach(el => {
            el.style.outline = el.dataset.colorishPrevOutline || '';
            el.style.outlineOffset = el.dataset.colorishPrevOutlineOffset || '';
            el.style.boxShadow = el.dataset.colorishPrevBoxShadow || '';
            delete el.dataset.colorishHighlight;
            delete el.dataset.colorishPrevOutline;
            delete el.dataset.colorishPrevOutlineOffset;
            delete el.dataset.colorishPrevBoxShadow;
        });
    }

    // Ganti warna — pakai setProperty 'important' agar bisa override !important di stylesheet
    if (request.action === "replaceColor") {
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (request.colorType === 'bg' && style.backgroundColor === request.oldColor) {
                el.style.setProperty('background-color', request.newColor, 'important');
            }
            if (request.colorType === 'text' && style.color === request.oldColor) {
                el.style.setProperty('color', request.newColor, 'important');
            }
            if (request.colorType === 'border' && style.borderColor === request.oldColor) {
                el.style.setProperty('border-color', request.newColor, 'important');
            }
        });
    }

    // Reset satu warna spesifik — hapus inline style agar warna kembali ke cascade asli CSS
    if (request.action === "resetColor") {
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (request.colorType === 'bg' && style.backgroundColor === request.currentColor) {
                el.style.removeProperty('background-color');
            }
            if (request.colorType === 'text' && style.color === request.currentColor) {
                el.style.removeProperty('color');
            }
            if (request.colorType === 'border' && style.borderColor === request.currentColor) {
                el.style.removeProperty('border-color');
            }
        });
    }

    // Reset SEMUA warna yang telah dimodifikasi
    if (request.action === "resetAll") {
        document.querySelectorAll('*').forEach(el => {
            el.style.removeProperty('background-color');
            el.style.removeProperty('color');
            el.style.removeProperty('border-color');
            if (el.dataset.colorishHighlight) {
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.boxShadow = '';
                delete el.dataset.colorishHighlight;
            }
        });
        sendResponse({ success: true });
    }
});