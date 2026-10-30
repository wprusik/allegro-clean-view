const DEFAULT_LISTING_SECTIONS = {
    recommendations: true,
    articles: true,
    sponsoredBelowFilters: true,
    sponsoredPanels: true,
    aiSuggestions: true,
    relatedLinks: true,
    similarPhrases: true,
    advice: true,
    dealsZone: true,
    top10: true
};

// Klasy na <html> sterujące wczesnym CSS (listing-instant-hide.css).
const ACV_LISTING_CSS_CLASSES = {
    recommendations: "acv-hide-listing-recommendations",
    articles: "acv-hide-listing-articles",
    sponsoredBelowFilters: "acv-hide-listing-sponsored-below-filters",
    sponsoredPanels: "acv-hide-listing-sponsored-panels",
    aiSuggestions: "acv-hide-listing-ai-suggestions",
    relatedLinks: "acv-hide-listing-related-links",
    similarPhrases: "acv-hide-listing-similar-phrases",
    advice: "acv-hide-listing-advice",
    dealsZone: "acv-hide-listing-deals-zone",
    top10: "acv-hide-listing-top10"
};

// Ten sam zestaw selektorów co w listing-instant-hide.css - służy tylko do
// wykrycia, czy element faktycznie jest na stronie (pogrubienie pozycji w popupie).
const LISTING_RECOMMENDATIONS_SELECTOR = [
    'div[data-box-name="rekomendacje"]',
    'div[data-box-name="smartweek-listing-2021-reco-container"]'
].join(", ");

// Artykuły ("Nie możesz się zdecydować?"): panel z kafelkami artykułów.
const LISTING_ARTICLES_SELECTOR = 'div[data-box-name="articles"]';

// Sponsorowane pod filtrami: lewa kolumna pod filtrami - reklamowe oferty
// (sponsored_offers_ppc_ads) i druga reklama przewijana razem ze stroną (DSS).
const LISTING_SPONSORED_BELOW_FILTERS_SELECTOR = 'div[data-box-name="seoLazyBelowFilters"]';

// Panele sponsorowane: baner DSS + szablon reklamowy marki, nad listą ofert
// (premium.with.dfp) i pod listą ofert (ads.dss.listing.bottom.container) -
// te same kontenery co "Marka sponsorowana" w sekcji "Oferty produktu".
// Linki powiązane/podobne: ta sama budowa na obu stronach (h5 + lista linków w
// opbox-sheet), różni się tylko data-box-name - "Powiązane kategorie" na
// kategorii, "Podobne wyszukiwania" w wyszukiwaniu.
// Podobne frazy: linijka "Podobne: ..." pod tytułem strony, tylko na wynikach
// wyszukiwania (nie istnieje na kategorii).
// Porady: długi tekst SEO (rozwijany przyciskiem "więcej"/"mniej") na dole
// strony kategorii. Nie istnieje na wynikach wyszukiwania.
// Strefa okazji: kafelek-karuzela wstawiany między oferty na liście
// (<li> bez własnego data-box-name, zagnieżdżony w kontenerze listy ofert).
// Identyfikacja po jedynym na stronie linku do "/strefaokazji/dzial/", bo
// klasy elementu mają losowy hash i brak stabilnej nazwy boxa.
const LISTING_DEALS_ZONE_SELECTOR = 'li:has(> div > p > a[href*="/strefaokazji/dzial/"])';

const LISTING_TOP10_SELECTOR = 'div[data-box-name="Ranking Wrapper"]';
const LISTING_ADVICE_SELECTOR = 'div[data-box-name="seo text container"]';

const LISTING_SIMILAR_PHRASES_SELECTOR = 'div[data-box-name="didYouMean"]';

const LISTING_RELATED_LINKS_SELECTOR = [
    'div[data-box-name="kategorie komplementarne kontener"]',
    'div[data-box-name="podobne wyszukiwania kontener"]'
].join(", ");

const LISTING_AI_SUGGESTIONS_SELECTOR = 'div[data-box-name="allegro.aifred.assistant.topListing"]';

const LISTING_SPONSORED_PANELS_SELECTOR = [
    'div[data-box-name="premium.with.dfp"]',
    'div[data-box-name="ads.dss.listing.bottom.container"]'
].join(", ");

function _acvApplyListingClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_LISTING_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

function isListingPath() {
    const path = location.pathname;
    return path.startsWith("/kategoria/") || path === "/listing" || path.startsWith("/listing/");
}

// Ustawiamy klasy NATYCHMIAST (document_start, przed jakimkolwiek await) wg
// wartości domyślnych - jak w pozostałych content scriptach. Jeśli zapisany
// config jest inny (lub rozszerzenie/strona wyłączone), klasy są korygowane
// po odczycie configu. Skrypt jest dopasowany w manifeście tylko do tych stron.
if (location.hostname === "allegro.pl" && isListingPath()) {
    _acvApplyListingClasses(DEFAULT_LISTING_SECTIONS);
}

function normalizeListingSections(raw) {
    return Object.keys(DEFAULT_LISTING_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getListingConfig() {
    const build = (result) => {
        const enabled = result?.pageSettings
            ? result.enabled !== false && result.pageSettings.listing !== false
            : result?.enabled !== false;
        return { enabled, sections: normalizeListingSections(result?.pageSettings?.listingSections) };
    };
    const fallback = { enabled: true, sections: { ...DEFAULT_LISTING_SECTIONS } };

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

// UWAGA: ten skrypt działa obok misc-content.js na tych samych stronach (wspólny
// zakres globalny) - nazwy top-level muszą być unikalne (prefiks Listing).
let acvListingLastReported = null;

function reportListingAppliedSections(sections) {
    const applied = [];
    if (sections.recommendations && document.querySelector(LISTING_RECOMMENDATIONS_SELECTOR)) {
        applied.push("recommendations");
    }
    if (sections.articles && document.querySelector(LISTING_ARTICLES_SELECTOR)) {
        applied.push("articles");
    }
    if (sections.sponsoredBelowFilters && document.querySelector(LISTING_SPONSORED_BELOW_FILTERS_SELECTOR)) {
        applied.push("sponsoredBelowFilters");
    }
    if (sections.sponsoredPanels && document.querySelector(LISTING_SPONSORED_PANELS_SELECTOR)) {
        applied.push("sponsoredPanels");
    }
    if (sections.aiSuggestions && document.querySelector(LISTING_AI_SUGGESTIONS_SELECTOR)) {
        applied.push("aiSuggestions");
    }
    if (sections.relatedLinks && document.querySelector(LISTING_RELATED_LINKS_SELECTOR)) {
        applied.push("relatedLinks");
    }
    if (sections.similarPhrases && document.querySelector(LISTING_SIMILAR_PHRASES_SELECTOR)) {
        applied.push("similarPhrases");
    }
    if (sections.advice && document.querySelector(LISTING_ADVICE_SELECTOR)) {
        applied.push("advice");
    }
    if (sections.dealsZone && document.querySelector(LISTING_DEALS_ZONE_SELECTOR)) {
        applied.push("dealsZone");
    }
    if (sections.top10 && document.querySelector(LISTING_TOP10_SELECTOR)) {
        applied.push("top10");
    }
    const signature = applied.join(",");
    if (signature === acvListingLastReported) return;
    acvListingLastReported = signature;

    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "listing",
            sections: applied
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak listenera / unieważniony kontekst rozszerzenia - ignorujemy
    }
}

function watchListingChanges(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        setInterval(() => reportListingAppliedSections(sections), 1000);
        return;
    }

    // Debounce: strony list ofert często zmieniają DOM (doczytywanie, filtry).
    let timer = null;
    const observer = new MutationObserver(() => {
        if (timer !== null) return;
        timer = setTimeout(() => {
            timer = null;
            reportListingAppliedSections(sections);
        }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function whenListingPageLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

(async () => {
    if (location.hostname !== "allegro.pl" || !isListingPath()) {
        return;
    }

    const config = await getListingConfig();
    if (!config.enabled) {
        _acvApplyListingClasses({ recommendations: false, articles: false, sponsoredBelowFilters: false, sponsoredPanels: false, aiSuggestions: false, relatedLinks: false, similarPhrases: false, advice: false, dealsZone: false, top10: false });
        return;
    }
    _acvApplyListingClasses(config.sections);

    await whenListingPageLoaded();
    reportListingAppliedSections(config.sections);
    watchListingChanges(config.sections);
})();
