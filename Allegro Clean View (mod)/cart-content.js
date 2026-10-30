const DEFAULT_CART_SECTIONS = {
    addToShipment: true
};

// Klasy na <html> sterujące wczesnym CSS (cart-instant-hide.css).
const ACV_CART_CSS_CLASSES = {
    addToShipment: "acv-hide-cart-add-to-shipment"
};

function _acvApplyCartClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_CART_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Klasy ustawiamy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych; po odczycie configu są korygowane w IIFE na końcu pliku.
_acvApplyCartClasses(DEFAULT_CART_SECTIONS);

function normalizeCartSections(raw) {
    return Object.keys(DEFAULT_CART_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getCartConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.cart !== false
            : result?.enabled !== false;
        return { enabled, sections: normalizeCartSections(result?.pageSettings?.cartSections) };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_CART_SECTIONS } };

    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get(["pageSettings", "enabled"])
            .then(build)
            .catch(() => fallback);
    }

    return new Promise((resolve) => {
        if (typeof chrome === "undefined" || !chrome?.storage?.local) {
            resolve(fallback);
            return;
        }
        chrome.storage.local.get(["pageSettings", "enabled"], (result) => resolve(build(result)));
    });
}

// Ostatni zbiór faktycznie zastosowanych (usuniętych z DOM) kluczy sekcji -
// używany do pogrubienia pozycji w popupie (REPORT_APPLIED_SECTIONS).
const acvCartAppliedSections = new Set();

function reportCartAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "cart",
            sections: [...acvCartAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

// "Dorzuć do przesyłki!": usuwa cały kontener div#crossSellCarousel
// (zawiera cart.carousel > cart.cross-sell.slot > cart.cross-sell.container).
function removeAddToShipment() {
    const els = document.querySelectorAll('div#crossSellCarousel');
    els.forEach((el) => el.remove());
    return els.length > 0;
}

function applyCartSections(sections) {
    if (sections.addToShipment && removeAddToShipment()) {
        acvCartAppliedSections.add('addToShipment');
    }
}

function watchCartChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        return;
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            applyCartSections(sections);
            reportCartAppliedSections();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenCartPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl" || location.pathname !== "/koszyk") {
        return;
    }

    const config = await getCartConfig();
    if (!config.enabled) {
        _acvApplyCartClasses({ addToShipment: false });
        return;
    }
    _acvApplyCartClasses(config.sections);

    // Skrypt startuje w document_start - operacje na DOM dopiero po pełnym
    // załadowaniu strony (zmiana DOM przed hydracją Reacta bywa cofana).
    // Do tego czasu element ukrywa CSS.
    await whenCartPageLoaded();
    applyCartSections(config.sections);
    reportCartAppliedSections();
    watchCartChanges(config.sections);
})();
