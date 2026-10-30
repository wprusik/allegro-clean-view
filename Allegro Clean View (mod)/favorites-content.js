const DEFAULT_FAVORITES_SECTIONS = {
    combineOffersProposal: true,
    inspiredByFavorites: true,
    othersAlsoBuy: true
};

// Klasy na <html> sterujące wczesnym CSS (favorites-instant-hide.css).
const ACV_FAVORITES_CSS_CLASSES = {
    combineOffersProposal: "acv-hide-favorites-combine-offers",
    inspiredByFavorites: "acv-hide-favorites-inspired",
    othersAlsoBuy: "acv-hide-favorites-others-buy"
};

function _acvApplyFavoritesClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_FAVORITES_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Ustawiamy klasy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych - jak w content.js. Jeśli zapisany config jest inny
// (lub rozszerzenie/strona wyłączone), klasy są korygowane po odczycie configu.
_acvApplyFavoritesClasses(DEFAULT_FAVORITES_SECTIONS);

function normalizeFavoritesSections(raw) {
    return Object.keys(DEFAULT_FAVORITES_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getFavoritesConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.favorites !== false
            : result?.enabled !== false;
        return { enabled, sections: normalizeFavoritesSections(result?.pageSettings?.favoritesSections) };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_FAVORITES_SECTIONS } };

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

// UWAGA: content scripty z tej samej strony dzielą globalny zakres (my-purchases-content.js
// też działa na /moje-allegro/zakupy/*), więc nazwy top-level muszą być unikalne.
// Ostatni zbiór faktycznie zastosowanych (usuniętych z DOM) kluczy sekcji -
// używany do pogrubienia pozycji w popupie (REPORT_APPLIED_SECTIONS).
const acvFavoritesAppliedSections = new Set();

function reportFavoritesAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "favorites",
            sections: [...acvFavoritesAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

// Propozycja połączenia ofert: usuwa panel "Oszczędzaj na przesyłkach!"
// (data-testid="partial-optimization-content") i zwraca true, jeśli coś usunął.
function removeCombineOffersProposal() {
    const els = document.querySelectorAll('div[data-testid="partial-optimization-content"]');
    els.forEach((el) => {
        // Rodzic zostaje jako stały odstęp między ofertami (patrz CSS) - znacznik
        // na wypadek, gdyby po usunięciu panelu :has() przestało go łapać.
        el.parentElement?.setAttribute('data-acv-favorites-gap', '');
        el.remove();
    });
    return els.length > 0;
}

// Zwraca true po udanym przeniesieniu (przycisk może pojawić się w DOM z opóźnieniem,
// więc próbujemy ponownie przy kolejnych zmianach DOM, aż się uda).
// Przenosi przycisk "Połącz przesyłki" z div[data-testid="optimizer-content"]
// obok "Utwórz listę" (makeAList) i opróżnia ten kontener. Idempotentne -
// wołane przy każdej zmianie DOM, bo React może odtworzyć usunięty element.
// Panel "partial-optimization-content" (z własnym przyciskiem "Połącz inne
// przesyłki") jest usuwany wcześniej, więc celujemy tylko w optimizer-content.
function moveCombineItemsButton() {
    const BTN = 'button[data-analytics-interaction-label="combineShipments"]';
    const containers = [...document.querySelectorAll('div[data-testid="optimizer-content"]')];
    const btn = containers.map((el) => el.querySelector(BTN)).find(Boolean);
    if (!btn) return false;

    const parent = document.querySelector('button[data-analytics-interaction-label="makeAList"]')?.parentElement;
    if (!parent) return false; // "Utwórz listę" jeszcze nie w DOM - spróbujemy przy kolejnej zmianie

    if (parent.querySelector(BTN)) {
        btn.remove(); // przycisk już przeniesiony wcześniej, to odtworzony duplikat
    } else {
        btn.style.width = '17em';
        btn.style.height = '2em';
        btn.style.marginTop = '1em';
        parent.appendChild(btn);
    }
    containers.forEach((el) => {
        [...el.childNodes].forEach((child) => child.remove()); // kopia listy - live NodeList pomijałby elementy
        el.parentElement?.setAttribute('data-acv-favorites-gap', '');
    });
    return true;
}

function applyFavoritesSections(sections) {
    if (sections.combineOffersProposal) {
        if (removeCombineOffersProposal()) acvFavoritesAppliedSections.add('combineOffersProposal');
        if (moveCombineItemsButton()) acvFavoritesAppliedSections.add('combineOffersProposal');
    }
    // Rekomendacje chowa wyłącznie CSS (stabilne data-box-name); tu tylko
    // raportujemy do popupu, że element jest na stronie i ukryty.
    if (sections.inspiredByFavorites && document.querySelector('div[data-box-name="layout.container.inspiration.items"]')) {
        acvFavoritesAppliedSections.add('inspiredByFavorites');
    }
    if (sections.othersAlsoBuy && document.querySelector('div[data-box-name="layout.container.complementary.items"]')) {
        acvFavoritesAppliedSections.add('othersAlsoBuy');
    }
}

function watchFavoritesChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        setInterval(() => applyFavoritesSections(sections), 1000);
        return;
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            applyFavoritesSections(sections);
            reportFavoritesAppliedSections();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl" || location.pathname !== "/moje-allegro/zakupy/obserwowane/ulubione") {
        return;
    }

    const config = await getFavoritesConfig();
    if (!config.enabled) {
        _acvApplyFavoritesClasses({ combineOffersProposal: false, inspiredByFavorites: false, othersAlsoBuy: false });
        return;
    }
    _acvApplyFavoritesClasses(config.sections);

    // Skrypt startuje w document_start - operacje na DOM dopiero po pełnym załadowaniu strony
    // (zmiana DOM przed hydracją Reacta bywa cofana). Do tego czasu ukrywa CSS.
    await whenPageLoaded();
    applyFavoritesSections(config.sections);
    reportFavoritesAppliedSections();
    watchFavoritesChanges(config.sections);
})();
