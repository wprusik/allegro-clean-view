const DEFAULT_TRANSACTION_SECTIONS = {
    ads: true,
    lottery: true,
    allegroKlik: true,
    lowestPriceGuarantee: true,
    selectedForYou: true,
    basedOnViewed: true,
    basedOnLiked: true,
    buyRegularly: true,
    infiniteFeed: true
};

// Klasy na <html> sterujące wczesnym CSS (transaction-instant-hide.css).
const ACV_TRANSACTION_CSS_CLASSES = {
    ads: "acv-hide-transaction-ads",
    lottery: "acv-hide-transaction-lottery",
    allegroKlik: "acv-hide-transaction-allegro-klik",
    lowestPriceGuarantee: "acv-hide-transaction-lowest-price-guarantee",
    selectedForYou: "acv-hide-transaction-selected-for-you",
    basedOnViewed: "acv-hide-transaction-based-on-viewed",
    basedOnLiked: "acv-hide-transaction-based-on-liked",
    buyRegularly: "acv-hide-transaction-buy-regularly",
    infiniteFeed: "acv-hide-transaction-infinite-feed"
};

function _acvApplyTransactionClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_TRANSACTION_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Klasy ustawiamy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych; po odczycie configu są korygowane w IIFE na końcu pliku.
_acvApplyTransactionClasses(DEFAULT_TRANSACTION_SECTIONS);

function normalizeTransactionSections(raw) {
    return Object.keys(DEFAULT_TRANSACTION_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getTransactionConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.transaction !== false
            : result?.enabled !== false;
        return { enabled, sections: normalizeTransactionSections(result?.pageSettings?.transactionSections) };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_TRANSACTION_SECTIONS } };

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
const acvTransactionAppliedSections = new Set();

function reportTransactionAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "transaction",
            sections: [...acvTransactionAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

// Usuwa elementy o danym data-box-name, a potem sprząta puste kontenery-rodziców
// (layout boxy Allegro bez klas), które po usunięciu boxa zostają z własnym
// odstępem jako "pusty obszar". Usuwamy tylko rodziców naprawdę pustych
// (bez dzieci i bez tekstu) i idziemy w górę, dopóki taki jest.
function removeTransactionBox(boxName) {
    const els = document.querySelectorAll(`div[data-box-name="${boxName}"]`);
    els.forEach((el) => {
        let parent = el.parentElement;
        el.remove();
        while (parent && parent !== document.body && parent !== document.documentElement
            && parent.children.length === 0 && !parent.textContent.trim()) {
            const next = parent.parentElement;
            parent.remove();
            parent = next;
        }
    });
    return els.length > 0;
}

// "Gwarancja najniższej ceny": sponsorowana karuzela
// [transaction.container] Sponsored Offers Carousel.
function removeLowestPriceGuarantee() {
    return removeTransactionBox('[transaction.container] Sponsored Offers Carousel');
}

// "Wybrane dla Ciebie": karuzela polecanych ofert (recoOffers, MAJOR_CAMPAIGN).
function removeSelectedForYou() {
    return removeTransactionBox('[transaction.container] recoOffers_THANK_YOU_PAGE_MAJOR_CAMPAIGN');
}

// "Na podstawie oglądanych": karuzela "Na podstawie oglądanych przez Ciebie ofert".
function removeBasedOnViewed() {
    return removeTransactionBox('[transaction.container] recoOffers_THANK_YOU_PAGE');
}

// "Na podstawie polubionych": karuzela "Na podstawie polubionych przez Ciebie ofert".
function removeBasedOnLiked() {
    return removeTransactionBox('[transaction.container] recoOffers_INSPIRED_BY_FAVOURITES');
}

// "Kupuj regularnie": karuzela ofert kupowanych regularnie.
function removeBuyRegularly() {
    return removeTransactionBox('[transaction.container] recoOffers_DSH_RECURRING_PURCHASES_MAIN_PAGE');
}

// "Nieskończona dawka pomysłów": feed ofert na dole strony.
function removeInfiniteFeed() {
    return removeTransactionBox('infinite-feed.container.web');
}

// "Reklama": prawa kolumna z reklamami DSS (puste kolumny sprząta removeTransactionBox).
function removeTransactionAds() {
    return removeTransactionBox('Right [hidden for mobileapp]');
}

// "Graj w Loterii Smart!": zewnętrzny box transakcji z loterią.
function removeLottery() {
    return removeTransactionBox('[transaction.container] allegro.transaction.thankyou.lottery');
}

// "Allegro Klik": box "Wystarczy Klik i część kasy wraca".
function removeAllegroKlik() {
    return removeTransactionBox('[transaction.container] CFS-booster');
}

function applyTransactionSections(sections) {
    if (sections.ads && removeTransactionAds()) {
        acvTransactionAppliedSections.add('ads');
    }
    if (sections.lottery && removeLottery()) {
        acvTransactionAppliedSections.add('lottery');
    }
    if (sections.allegroKlik && removeAllegroKlik()) {
        acvTransactionAppliedSections.add('allegroKlik');
    }
    if (sections.lowestPriceGuarantee && removeLowestPriceGuarantee()) {
        acvTransactionAppliedSections.add('lowestPriceGuarantee');
    }
    if (sections.selectedForYou && removeSelectedForYou()) {
        acvTransactionAppliedSections.add('selectedForYou');
    }
    if (sections.basedOnViewed && removeBasedOnViewed()) {
        acvTransactionAppliedSections.add('basedOnViewed');
    }
    if (sections.basedOnLiked && removeBasedOnLiked()) {
        acvTransactionAppliedSections.add('basedOnLiked');
    }
    if (sections.buyRegularly && removeBuyRegularly()) {
        acvTransactionAppliedSections.add('buyRegularly');
    }
    if (sections.infiniteFeed && removeInfiniteFeed()) {
        acvTransactionAppliedSections.add('infiniteFeed');
    }
}

function watchTransactionChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        return;
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            applyTransactionSections(sections);
            reportTransactionAppliedSections();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenTransactionPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl" || !location.pathname.startsWith("/transakcja/dziekujemy")) {
        return;
    }

    const config = await getTransactionConfig();
    if (!config.enabled) {
        _acvApplyTransactionClasses({ ads: false, lottery: false, allegroKlik: false, lowestPriceGuarantee: false, selectedForYou: false, basedOnViewed: false, basedOnLiked: false, buyRegularly: false, infiniteFeed: false });
        return;
    }
    _acvApplyTransactionClasses(config.sections);

    // Skrypt startuje w document_start - operacje na DOM dopiero po pełnym
    // załadowaniu strony (zmiana DOM przed hydracją Reacta bywa cofana).
    // Do tego czasu elementy ukrywa CSS.
    await whenTransactionPageLoaded();
    applyTransactionSections(config.sections);
    reportTransactionAppliedSections();
    watchTransactionChanges(config.sections);
})();
