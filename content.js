// Filter warna transparan
function isTransparent(color) {
    if (!color || color === 'transparent') return true;
    const m = color.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    if (m && parseFloat(m[1]) === 0) return true;
    return false;
}

// Hasilkan key unik untuk deduplication berdasarkan nilai warna.
// Menyertakan alpha sehingga rgba(0,0,0,0.5) ≠ rgb(0,0,0).
// Hanya menyatukan format berbeda yang secara visual identik:
// misal "rgba(0, 0, 0, 1)" dan "rgb(0, 0, 0)" → key yang sama.
function colorKey(color) {
    if (!color) return color;
    const nums = color.match(/[\d.]+/g);
    if (!nums || nums.length < 3) return color;
    const r = Math.round(parseFloat(nums[0]));
    const g = Math.round(parseFloat(nums[1]));
    const b = Math.round(parseFloat(nums[2]));
    // Jika alpha ada dan bukan 1, sertakan agar semi-transparan tidak digabung dengan opak
    const a = nums.length >= 4 ? parseFloat(nums[3]) : 1;
    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
    return `rgb(${r}, ${g}, ${b})`;
}

// Ambil semua warna unik beserta jumlah elemen yang menggunakannya
function getAllColors() {
    const elements = document.querySelectorAll('*');
    // Map<key, { rawValue, count }>
    // key = colorKey (untuk dedup), rawValue = string asli dari browser
    // rawValue HARUS tetap asli agar cocok dengan getComputedStyle di replaceColor/highlight
    const bgMap = new Map();
    const textMap = new Map();
    const borderMap = new Map();

    function addToMap(map, rawColor) {
        const key = colorKey(rawColor);
        if (map.has(key)) {
            map.get(key).count++;
        } else {
            // Simpan raw value asli — jangan normalize — agar perbandingan di replaceColor tetap akurat
            map.set(key, { rawValue: rawColor, count: 1 });
        }
    }

    elements.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') return;

        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        const border = style.borderColor;
        const borderWidth = parseFloat(style.borderWidth) || 0;

        if (bg && !isTransparent(bg)) addToMap(bgMap, bg);
        if (fg && !isTransparent(fg)) addToMap(textMap, fg);
        if (border && !isTransparent(border) && borderWidth > 0 && style.borderStyle !== 'none') {
            addToMap(borderMap, border);
        }
    });

    const toSortedArray = (map, type) =>
        Array.from(map.values())
            .map(({ rawValue, count }) => ({ value: rawValue, type, count }))
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