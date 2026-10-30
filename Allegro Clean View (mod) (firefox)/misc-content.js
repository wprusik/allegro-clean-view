const DEFAULT_MISC_SECTIONS = {
    searchSuggestions: true,
    sponsoredOffers: true,
    loginAd: true,
    allegroServices: true,
    reviewsFilter: true,
    comparisonRecommended: true,
    allegroAssistant: true,
    footerLinks: true,
    footerColumns: true,
    footerAd: true,
    mainTopAd: true
};

// Klasy na <html> sterujące wczesnym CSS (misc-instant-hide.css).
const ACV_MISC_CSS_CLASSES = {
    searchSuggestions: "acv-hide-misc-search-suggestions",
    sponsoredOffers: "acv-hide-misc-sponsored-offers",
    loginAd: "acv-hide-misc-login-ad",
    allegroServices: "acv-hide-misc-allegro-services",
    reviewsFilter: "acv-hide-misc-reviews-filter",
    comparisonRecommended: "acv-hide-misc-comparison-recommended",
    allegroAssistant: "acv-hide-misc-allegro-assistant",
    footerLinks: "acv-hide-misc-footer-links",
    footerColumns: "acv-hide-misc-footer-columns",
    footerAd: "acv-hide-misc-footer-ad",
    mainTopAd: "acv-hide-misc-main-top-ad"
};

// Ten sam zestaw selektorów co w misc-instant-hide.css - służy tylko do
// wykrycia, czy element faktycznie jest na stronie (pogrubienie pozycji w popupie).
const MISC_ALLEGRO_SERVICES_SELECTOR = [
    'li:has(> div > div > a[href*="strefaokazji/gwarancja-ceny"])',
    'li:has(> div > div > a[href*="referer=LISTING_INFOBOX"])'
].join(", ");

// Wybierz, co dla Ciebie ważne: panel filtra opinii po cechach (przycisk
// rozwijający) przy opiniach o produkcie - strona opinii (/oferty-produktu/.../opinie)
// i sekcja opinii na stronie produktu. Brak data-box-name - identyfikacja po
// data-testid="featuresFilter" (1 raz na obu stronach).
const MISC_REVIEWS_FILTER_SELECTOR = 'div[data-testid="featuresFilter"]';

// Polecane w porównaniu: kolumny-kafelki produktów "Polecane" w nagłówku tabeli
// porównywarki (allegro.pl/porownanie). Rozpoznawane po przycisku "Porównaj"
// (addToComparison) - ma go tylko kafelek polecany, nie porównywany produkt.
// Wariant z separatorem ma ten sam kod co bez (separator to klasy na tym <th>).
const MISC_COMPARISON_RECOMMENDED_SELECTOR = 'th:has(button[data-analytics-interaction-label="addToComparison"])';

// Proponowane w wyszukiwarce: karuzela kafelków (zdjęcie + fraza) na górze
// rozwiniętej listy podpowiedzi wyszukiwarki (#suggestions-listbox, data-role="suggester").
// Lista jest doklejana do DOM dopiero po wpisaniu frazy (obserwator niżej to łapie).
const MISC_SEARCH_SUGGESTIONS_SELECTOR = 'div[data-role="suggester"] > div[data-role="carousel-component"]';

// Oferty sponsorowane w listach (kategoria, wyszukiwanie, oferty produktu): <li>
// z linkiem przekierowania reklamowego (/events/clicks) ORAZ etykietą
// "Sponsorowane". Oba znaczniki naraz, żeby nie trafić w oferty promowane
// ("Produkty promowane", zwykłe linki /produkt/...) ani zwykłe.
const MISC_SPONSORED_OFFERS_SELECTOR = 'li:has(> article a[href*="/events/clicks"]):has(button[aria-label^="Sponsorowane"])';

// Reklama przy logowaniu (allegro.pl/logowanie): baner Google w polu pod formularzem,
// slot allegro.advertisement.slot.banner z analytics-groups "loginAd".
const MISC_LOGIN_AD_SELECTOR = 'div[data-prototype-id="allegro.advertisement.slot.banner"][data-analytics-groups*="loginAd"]';

// Asystent Allegro: wysuwany przycisk przy krawędzi okna (otwiera panel czatu).
// Kontener data-box-name="allegro.chatbotAssistant.entrypoint" (1 raz, np. strona produktu).
const MISC_ALLEGRO_ASSISTANT_SELECTOR = 'div[data-box-name="allegro.chatbotAssistant.entrypoint"]';

// Linki nad stopką: kontener listy linków SEO nad stopką (ta sama budowa na
// stronie głównej, kategorii, użytkownika, ofertach produktu i stronie produktu).
// Drugi poziom: w niektórych kategoriach (np. nieruchomości) dodatkowa lista linków SEO
// nad stopką - div[data-box-name="seo-custom-navigation-links"].
// Zastępnik leniwego ładowania górnej stopki (allegro.spinner.metrum-footer) też liczymy:
// po jego ukryciu właściwe elementy mogą się w ogóle nie doładować.
const MISC_FOOTER_PLACEHOLDER_SELECTOR = 'div[data-box-name="allegro.spinner.metrum-footer"]';
const MISC_FOOTER_LINKS_SELECTOR = 'div[data-box-name="metrum-footer-partial-expander"], div[data-box-name="seo-custom-navigation-links"], ' + MISC_FOOTER_PLACEHOLDER_SELECTOR;

// Stopka (ustawienia): kolumny z linkami (f-links, razem z ustawieniami
// wyświetlania i lokalizacji) oraz ikony aplikacji i social media (f-social).
const MISC_FOOTER_COLUMNS_SELECTOR = 'div[data-box-name="f-links"], div[data-box-name="f-social"], ' + MISC_FOOTER_PLACEHOLDER_SELECTOR;

// Reklama pod stopką: slot reklamowy parallax (Google Ad Manager) na końcu
// strony, poza stopką w drzewie DOM (kategorie/listingi, strona produktu).
// Wariant niezalogowanego ma box name "parallax cmuid" - ten sam prototype-id.
// Reklama na górze głównej: baner (Top Header) nad nagłówkiem strony głównej.
// "structure-container" to ogólna nazwa używana ~25 razy na stronie głównej, więc
// identyfikacja po grupie analitycznej miejsca emisji "Top Header" (nie po
// kampanii, która się zmienia).
const MISC_MAIN_TOP_AD_SELECTOR = 'div[data-box-name="structure-container"][data-analytics-groups*="Top%20Header"]';

const MISC_FOOTER_AD_SELECTOR = 'div[data-box-name="parallax"], div[data-box-name="parallax cmuid"], div[data-prototype-id="allegro.advertisement.slot.parallax"]';

function _acvApplyMiscClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_MISC_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Ustawiamy klasy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych - jak w pozostałych content scriptach. Jeśli zapisany
// config jest inny (lub rozszerzenie wyłączone), klasy są korygowane po
// odczycie configu.
_acvApplyMiscClasses(DEFAULT_MISC_SECTIONS);

function normalizeMiscSections(raw) {
    return Object.keys(DEFAULT_MISC_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

// Domyślne sortowanie list. Wartości ?order= wspólne dla kategorii, wyszukiwania
// (/kategoria/*, /listing*) i ofert produktu (/oferty-produktu/*); "m" (trafność)
// to domyślne sortowanie Allegro - adres wtedy NIE zawiera order.
const ACV_SORT_VALUES = ["p", "pd", "d", "dd", "qd", "t", "n"];
const ACV_LAST_LISTING_KEY = "acvLastListingKey";
let acvMiscSortValue = null;

// Dopisuje order=<wybrane> do adresu przy WEJŚCIU na listę (nowa kategoria, nowa
// fraza, nowa oferta produktu). Nie rusza: adresów z order (wybór użytkownika,
// paginacja), zmian na tej samej liście (sortowanie "trafność" usuwa order z
// adresu, więc rozpoznajemy tę samą listę po kluczu ścieżka+fraza zapisanym w
// sessionStorage), odświeżenia i wstecz/dalej. Poza listami klucz jest czyszczony.
function acvApplyDefaultSort(sort) {
    try {
        const url = new URL(location.href);
        const isList = /^\/(kategoria\/|listing|oferty-produktu\/)/.test(url.pathname);
        if (!isList) {
            sessionStorage.removeItem(ACV_LAST_LISTING_KEY);
            return;
        }
        const key = url.pathname + "|" + (url.searchParams.get("string") || "");
        const lastKey = sessionStorage.getItem(ACV_LAST_LISTING_KEY);
        sessionStorage.setItem(ACV_LAST_LISTING_KEY, key);
        if (!sort?.enabled) return;
        acvMiscSortValue = sort.value;
        if (url.searchParams.has("order") || lastKey === key) return;
        const navType = performance.getEntriesByType?.("navigation")?.[0]?.type;
        if (navType && navType !== "navigate") return;
        url.searchParams.set("order", sort.value);
        location.replace(url.toString());
    } catch (_) {
        // brak dostępu do sessionStorage / niepoprawny adres - pomijamy
    }
}

function getMiscConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.misc !== false
            : result?.enabled !== false;
        const storedSort = result?.pageSettings?.miscSort;
        // Domyślne sortowanie zależy tylko od globalnego włącznika wtyczki (nie od
        // tego, czy w "Różne" włączono jakąkolwiek sekcję ukrywania).
        const sort = {
            enabled: result?.enabled !== false && storedSort?.enabled === true,
            value: ACV_SORT_VALUES.includes(storedSort?.value) ? storedSort.value : "p"
        };
        return { enabled, sections: normalizeMiscSections(result?.pageSettings?.miscSections), sort };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_MISC_SECTIONS }, sort: { enabled: false, value: "p" } };

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

// UWAGA: ten skrypt działa na każdej stronie allegro.pl obok innych content
// scriptów (content.js itd.) - nazwy top-level muszą być unikalne (prefiks Misc).
// Raport "zastosowanych" sekcji idzie ze źródłem "misc", żeby background.js
// scalał go z raportem skryptu danej strony, a nie nadpisywał.
let acvMiscLastReported = null;

function reportMiscAppliedSections(sections) {
    const applied = [];
    if (sections.searchSuggestions && document.querySelector(MISC_SEARCH_SUGGESTIONS_SELECTOR)) {
        applied.push("searchSuggestions");
    }
    if (sections.loginAd && document.querySelector(MISC_LOGIN_AD_SELECTOR)) {
        applied.push("loginAd");
    }
    if (sections.sponsoredOffers && document.querySelector(MISC_SPONSORED_OFFERS_SELECTOR)) {
        applied.push("sponsoredOffers");
    }
    if (sections.allegroServices && document.querySelector(MISC_ALLEGRO_SERVICES_SELECTOR)) {
        applied.push("allegroServices");
    }
    if (sections.reviewsFilter && document.querySelector(MISC_REVIEWS_FILTER_SELECTOR)) {
        applied.push("reviewsFilter");
    }
    if (sections.comparisonRecommended && document.querySelector(MISC_COMPARISON_RECOMMENDED_SELECTOR)) {
        applied.push("comparisonRecommended");
    }
    if (sections.allegroAssistant && document.querySelector(MISC_ALLEGRO_ASSISTANT_SELECTOR)) {
        applied.push("allegroAssistant");
    }
    if (sections.footerLinks && document.querySelector(MISC_FOOTER_LINKS_SELECTOR)) {
        applied.push("footerLinks");
    }
    if (sections.footerColumns && document.querySelector(MISC_FOOTER_COLUMNS_SELECTOR)) {
        applied.push("footerColumns");
    }
    if (sections.footerAd && document.querySelector(MISC_FOOTER_AD_SELECTOR)) {
        applied.push("footerAd");
    }
    if (sections.mainTopAd && document.querySelector(MISC_MAIN_TOP_AD_SELECTOR)) {
        applied.push("mainTopAd");
    }
    if (acvMiscSortValue && new URL(location.href).searchParams.get("order") === acvMiscSortValue) {
        applied.push("defaultSort");
    }
    const signature = applied.join(",");
    if (signature === acvMiscLastReported) return;
    acvMiscLastReported = signature;

    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "misc",
            sections: applied
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

function watchMiscChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        setInterval(() => reportMiscAppliedSections(sections), 1000);
        return;
    }

    // Skrypt działa na wszystkich stronach, więc zmiany DOM są zbierane z
    // opóźnieniem (debounce) - tanie sprawdzenie raz na kilkaset ms.
    let timer = null;
    const observer = new MutationObserver(() => {
        if (timer !== null) return;
        timer = setTimeout(() => {
            timer = null;
            reportMiscAppliedSections(sections);
        }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenMiscPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl") {
        return;
    }

    const config = await getMiscConfig();
    acvApplyDefaultSort(config.sort);
    if (!config.enabled) {
        _acvApplyMiscClasses({ searchSuggestions: false, sponsoredOffers: false, loginAd: false, allegroServices: false, reviewsFilter: false, comparisonRecommended: false, allegroAssistant: false, footerLinks: false, footerColumns: false, footerAd: false, mainTopAd: false });
        return;
    }
    _acvApplyMiscClasses(config.sections);

    await whenMiscPageLoaded();
    reportMiscAppliedSections(config.sections);
    watchMiscChanges(config.sections);
})();
