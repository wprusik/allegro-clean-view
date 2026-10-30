const DEFAULT_PRODUCT_OFFERS_SECTIONS = {
    sponsoredBrand: true,
    officialStore: true,
    similarOffers: true
};

// Klasy na <html> sterujące wczesnym CSS (product-offers-instant-hide.css).
const ACV_PRODUCT_OFFERS_CSS_CLASSES = {
    sponsoredBrand: "acv-hide-product-offers-sponsored-brand",
    officialStore: "acv-hide-product-offers-official-store",
    similarOffers: "acv-hide-product-offers-similar-offers"
};

function _acvApplyProductOffersClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_PRODUCT_OFFERS_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Ustawiamy klasy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych - jak w pozostałych content scriptach. Jeśli zapisany
// config jest inny (lub rozszerzenie/strona wyłączone), klasy są korygowane
// po odczycie configu.
_acvApplyProductOffersClasses(DEFAULT_PRODUCT_OFFERS_SECTIONS);

function normalizeProductOffersSections(raw) {
    return Object.keys(DEFAULT_PRODUCT_OFFERS_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getProductOffersConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.productOffers !== false
            : result?.enabled !== false;
        return { enabled, sections: normalizeProductOffersSections(result?.pageSettings?.productOffersSections) };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_PRODUCT_OFFERS_SECTIONS } };

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
const acvProductOffersAppliedSections = new Set();

function reportProductOffersAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "productOffers",
            sections: [...acvProductOffersAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

// Marka sponsorowana: usuwa kontenery premium.with.dfp (nad listą ofert) i
// ads.dss.listing.bottom.container (pod listą) - baner DSS + szablon reklamowy
// marki - i zwraca true, jeśli coś usunął.
function removeSponsoredBrand() {
    const els = document.querySelectorAll('div[data-box-name="premium.with.dfp"], div[data-box-name="ads.dss.listing.bottom.container"]');
    els.forEach((el) => el.remove());
    return els.length > 0;
}

// Odkryj oficjalny sklep: kafelek <li> w liście ofert z linkiem "ZOBACZ SKLEP MARKI".
// Ukrywa go wyłącznie CSS (li jest elementem listy zarządzanej przez React - nie
// usuwamy go z DOM); tu tylko wykrycie, czy jest na stronie (pogrubienie w popupie).
function detectOfficialStore() {
    return !!document.querySelector('li a[title="ZOBACZ SKLEP MARKI"]');
}

// Podobne oferty: usuwa kontener "similar offers" (tytuł + karuzela) i zwraca
// true, jeśli coś usunął.
function removeSimilarOffers() {
    const els = document.querySelectorAll('div[data-box-name="similar offers"]');
    els.forEach((el) => el.remove());
    return els.length > 0;
}

function applyProductOffersSections(sections) {
    if (sections.sponsoredBrand) {
        if (removeSponsoredBrand()) acvProductOffersAppliedSections.add('sponsoredBrand');
    }
    if (sections.officialStore) {
        if (detectOfficialStore()) acvProductOffersAppliedSections.add('officialStore');
    }
    if (sections.similarOffers) {
        if (removeSimilarOffers()) acvProductOffersAppliedSections.add('similarOffers');
    }
}

function watchProductOffersChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        setInterval(() => applyProductOffersSections(sections), 1000);
        return;
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            applyProductOffersSections(sections);
            reportProductOffersAppliedSections();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl" || !location.pathname.startsWith("/oferty-produktu/")) {
        return;
    }

    const config = await getProductOffersConfig();
    if (!config.enabled) {
        _acvApplyProductOffersClasses({ sponsoredBrand: false, officialStore: false, similarOffers: false });
        return;
    }
    _acvApplyProductOffersClasses(config.sections);

    // Skrypt startuje w document_start - operacje na DOM dopiero po pełnym załadowaniu strony
    // (zmiana DOM przed hydracją Reacta bywa cofana). Do tego czasu ukrywa CSS.
    await whenPageLoaded();
    applyProductOffersSections(config.sections);
    reportProductOffersAppliedSections();
    watchProductOffersChanges(config.sections);
})();
