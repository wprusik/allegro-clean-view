const DEFAULT_MY_PURCHASES_SECTIONS = {
    shortcutTiles: true,
    cashbackBanner: true
};

// Klasy na <html> sterujące wczesnym CSS (my-purchases-instant-hide.css).
const ACV_MY_PURCHASES_CSS_CLASSES = {
    shortcutTiles: "acv-hide-my-purchases-shortcut-tiles",
    cashbackBanner: "acv-hide-my-purchases-cashback-banner"
};

function _acvApplyMyPurchasesClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_MY_PURCHASES_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Klasy ustawiamy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych; po odczycie configu są korygowane w IIFE na końcu pliku.
_acvApplyMyPurchasesClasses(DEFAULT_MY_PURCHASES_SECTIONS);

function whenMyPurchasesPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

function normalizeMyPurchasesSections(raw) {
    return Object.keys(DEFAULT_MY_PURCHASES_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getMyPurchasesConfig() {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get(["pageSettings", "enabled"])
            .then((result) => {
                const enabled = result?.enabled !== false && result?.pageSettings?.myPurchases !== false;
                return { enabled, sections: normalizeMyPurchasesSections(result?.pageSettings?.myPurchasesSections) };
            })
            .catch(() => ({ enabled: true, sections: { ...DEFAULT_MY_PURCHASES_SECTIONS } }));
    }

    return new Promise((resolve) => {
        if (typeof chrome === "undefined" || !chrome?.storage?.local) {
            resolve({ enabled: true, sections: { ...DEFAULT_MY_PURCHASES_SECTIONS } });
            return;
        }
        chrome.storage.local.get(["pageSettings", "enabled"], (result) => {
            const enabled = result?.enabled !== false && result?.pageSettings?.myPurchases !== false;
            resolve({ enabled, sections: normalizeMyPurchasesSections(result?.pageSettings?.myPurchasesSections) });
        });
    });
}

// Kafelki ze skrótami: rząd ikon-skrótów ("Moje przesyłki", "Kup
// ponownie", "Wiadomości", "Zgłoś problem") na górze podstron działu
// "Moje zakupy". Identyfikowany po stabilnym, specyficznym atrybucie
// data-testid="tiles" na kontenerze - nagłówek <h2 id="tiles-visually-
// hidden-title">Na skróty</h2> jest celowo ukryty wizualnie (tylko dla
// czytników ekranu), więc nie nadaje się jako punkt zaczepienia dla
// użytkownika, ale sam atrybut data-testid jest wystarczająco pewny.
function removeShortcutTiles() {
    const els = document.querySelectorAll('div[data-testid="tiles"]');
    els.forEach((el) => el.remove());
    return els.length > 0;
}

// Cashback za zakupy: mały baner promujący Allegro Klik z tytułem
// "Cashback za zakupy?" i przyciskiem "SPRAWDŹ". Nagłówek to <h5>, nie
// <h2>, a sam tekst tytułu występuje na stronie także w zagnieżdżonym,
// escapowanym stanie aplikacji (JSON do hydratacji) - więc identyfikacja
// wyłącznie po tekście byłaby zawodna. Zamiast tego celujemy w stabilny,
// specyficzny atrybut kontenera nadrzędnego
// data-box-name="myOrdersBoosters" (jednoznacznie odnosi się do
// "boosterów" promocyjnych na liście zamówień, nie jest to nazwa
// generyczna jak np. sam "banner", który też występuje na stronie ale
// obejmuje szerszy, mniej pewny obszar).
//
// Struktura: div.mryx_16 > div > div[data-box-name="banner"] > .opbox-sheet-wrapper
// > .opbox-sheet (inline margin-top:16px) > div[myOrdersBoosters]. Zewnętrzny
// div.mryx_16 (margin-bottom 16px) jest JEDYNYM odstępem między zamówieniami
// po obu stronach baneru - NIE wolno go ukrywać ani usuwać. Usuwamy tylko
// baner (puste .opbox-sheet-wrapper sprząta removeEmptyOpboxWrappers).
function removeCashbackBanner() {
    const els = document.querySelectorAll('div[data-box-name="myOrdersBoosters"]');
    els.forEach((el) => el.remove());
    return els.length > 0;
}

// Ostatni zbiór faktycznie zastosowanych (usuniętych z DOM) kluczy sekcji -
// używany wyłącznie do pogrubienia właściwych pozycji w popupie, patrz
// reportAppliedSections niżej i REPORT_APPLIED_SECTIONS w background.js.
let acvLastAppliedSections = new Set();

function removeAds(sections) {
    if (sections.shortcutTiles && removeShortcutTiles()) acvLastAppliedSections.add('shortcutTiles');
    if (sections.cashbackBanner && removeCashbackBanner()) acvLastAppliedSections.add('cashbackBanner');
    removeEmptyOpboxWrappers();
}

function reportAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "myPurchases",
            sections: [...acvLastAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak aktywnego listenera / kontekst rozszerzenia unieważniony - ignorujemy
    }
}

// Po usunięciu zawartości sekcji zostaje czasem pusty, osierocony
// .opbox-sheet-wrapper z marginesem (margin-top/margin-bottom), co widać
// jako pusty odstęp na stronie. Sprzątamy to generycznie - dla KAŻDEJ
// takiej sekcji, obecnej i przyszłej - zamiast dopisywać kolejne
// selektory ręcznie za każdym razem. Ta sama logika co w content.js
// (strona produktu), skopiowana tutaj bo to osobny content script.
//
// "Pusty" = brak widocznego tekstu I brak żadnego realnego obrazka.
// Allegro zostawia w takich miejscach analityczne piksele-śledzące
// (1x1px, height:1px, position:relative, z-index:-1) - te NIE liczą się
// jako treść, bo są celowo niewidoczne.
//
// Kilka przebiegów (do 5) obsługuje zagnieżdżone puste wrappery.
function removeEmptyOpboxWrappers() {
    const isAnalyticsPixel = (el) => {
        const style = el.getAttribute('style') || '';
        return /height:\s*1px/.test(style) && /position:\s*relative/.test(style) && /z-index:\s*-1/.test(style);
    };

    for (let pass = 0; pass < 5; pass++) {
        const wrappers = document.querySelectorAll('.opbox-sheet-wrapper');
        let removedAny = false;

        wrappers.forEach((wrapper) => {
            const hasText = (wrapper.textContent || '').trim().length > 0;
            if (hasText) return;

            const hasRealImage = Array.from(wrapper.querySelectorAll('img, picture, svg')).some((img) => {
                const pixelAncestor = img.closest('[style]');
                return !(pixelAncestor && isAnalyticsPixel(pixelAncestor));
            });
            if (hasRealImage) return;

            wrapper.remove();
            removedAny = true;
        });

        if (!removedAny) break;
    }
}

function watchMyPurchasesChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        setInterval(() => removeAds(sections), 1000);
        return;
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            removeAds(sections);
            reportAppliedSections();
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

(async () => {
    if (location.hostname !== "allegro.pl" || !location.pathname.startsWith("/moje-allegro/zakupy/")) {
        return;
    }

    const config = await getMyPurchasesConfig();
    if (!config.enabled) {
        _acvApplyMyPurchasesClasses({ shortcutTiles: false, cashbackBanner: false });
        return;
    }
    _acvApplyMyPurchasesClasses(config.sections);

    // Skrypt startuje w document_start - operacje na DOM dopiero po pełnym
    // załadowaniu strony (zmiana DOM przed hydracją Reacta bywa cofana).
    // Do tego czasu elementy ukrywa CSS.
    await whenMyPurchasesPageLoaded();
    removeAds(config.sections);
    reportAppliedSections();
    watchMyPurchasesChanges(config.sections);
})();
