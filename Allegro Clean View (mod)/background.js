const ICONS_ENABLED = {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png"
};

const ICONS_DISABLED = {
    16: "icons/icon-gray-16.png",
    32: "icons/icon-gray-32.png",
    48: "icons/icon-gray-48.png",
    128: "icons/icon-gray-128.png"
};

const DEFAULT_SETTINGS = {
    product: true,
    listing: true,
    productOffers: true,
    cart: true,
    transaction: true,
    favorites: true,
    misc: true,
    myPurchases: true,
    listingSections: {
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
    },
    productOffersSections: {
        sponsoredBrand: true,
        officialStore: true,
        similarOffers: true
    },
    productSections: {
        disableGalleryHover: false,
        othersAlsoViewed: true,
        lowestPriceProposals: true,
        singleShipmentOrder: true,
        singleShipmentSetOrder: true,
        ourProductSeries: true,
        proposalsForYou: true,
        discoverSimilarProducts: true,
        completeYourPurchase: true,
        lastViewed: true,
        inspiredBySearches: true,
        allegroPayCoupons: true,
        askOnPage: true,
        descriptionExpanded: true,
        brandInfo: true,
        upsellAiSuggestion: true,
        productSurvey: true,
        infiniteFeed: true,
        ads: true,
        lokalnieOffers: true,
        collapsedReviews: true,
        similarOffers: true,
        endedOfferReco: true,
        recommendedProducts: true
    },
    transactionSections: {
        ads: true,
        lottery: true,
        allegroKlik: true,
        lowestPriceGuarantee: true,
        selectedForYou: true,
        basedOnViewed: true,
        basedOnLiked: true,
        buyRegularly: true,
        infiniteFeed: true
    },
    cartSections: {
        addToShipment: true
    },
    favoritesSections: {
        combineOffersProposal: true,
        inspiredByFavorites: true,
        othersAlsoBuy: true
    },
    miscSections: {
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
    },
    // Domyślne sortowanie list (kategorie, wyszukiwanie, oferty produktu) - patrz misc-content.js.
    miscSort: {
        enabled: false,
        value: "p"
    },
    myPurchasesSections: {
        shortcutTiles: true,
        cashbackBanner: true
    }
};

const DEFAULT_GLOBAL_ENABLED = true;

// Efemeryczna (tylko w pamięci service workera, nie w chrome.storage) mapa
// tabId -> tablica kluczy sekcji faktycznie usuniętych z DOM przez content
// skrypty (content.js / my-purchases-content.js). Służy WYŁĄCZNIE do
// pogrubienia w popupie pozycji podmenu, które realnie coś usunęły na
// bieżącej stronie (w odróżnieniu od samego ustawienia w configu, które
// mówi tylko co POWINNO być usuwane). Czyszczona przy zamknięciu karty.
const appliedSectionsByTab = new Map();

// Zastosowane sekcje (do pogrubienia w popupie) przeżywają uśpienie service workera
// MV3 (po ok. 30 s bezczynności proces tła jest zatrzymywany, a zmienne w pamięci
// znikają - wtedy pogrubienia zanikały). Kopia w storage.session (czyszczona dopiero
// po zamknięciu przeglądarki); Map zostaje jako cache. Wszystkie zapisy idą przez
// mutateAppliedSections, żeby najpierw wczytać zapisany stan i go nie nadpisać.
const APPLIED_SESSION_KEY = "acvAppliedSectionsByTab";
const appliedSessionStorage = (typeof browser !== "undefined" && browser?.storage?.session)
    ? browser.storage.session
    : (typeof chrome !== "undefined" ? chrome.storage?.session : null);
let appliedSectionsLoading = null;

function loadAppliedSections() {
    if (!appliedSectionsLoading) {
        appliedSectionsLoading = (async () => {
            try {
                const result = await appliedSessionStorage?.get(APPLIED_SESSION_KEY);
                Object.entries(result?.[APPLIED_SESSION_KEY] || {}).forEach(([key, value]) => {
                    const tabId = Number(key);
                    if (!appliedSectionsByTab.has(tabId)) appliedSectionsByTab.set(tabId, value);
                });
            } catch (_) {
                // brak storage.session - zostaje sam cache w pamięci
            }
        })();
    }
    return appliedSectionsLoading;
}

async function mutateAppliedSections(mutate) {
    await loadAppliedSections();
    mutate();
    try {
        await appliedSessionStorage?.set({ [APPLIED_SESSION_KEY]: Object.fromEntries(appliedSectionsByTab) });
    } catch (_) {
        // zapis się nie udał - zostaje cache w pamięci
    }
}

// Powiadamia otwarty popup, że lista zastosowanych sekcji tej karty się
// zmieniła (pogrubienia "na żywo"). Gdy popup jest zamknięty, nie ma odbiorcy
// i sendMessage zgłasza błąd - ignorujemy go.
function notifyAppliedSectionsChanged(tabId) {
    try {
        const api = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : chrome.runtime;
        const result = api.sendMessage({ type: "APPLIED_SECTIONS_CHANGED", tabId });
        if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (_) {
    }
}

function getPageKeyFromPath(pathname) {
    if (pathname.startsWith("/kategoria/") || pathname === "/listing" || pathname.startsWith("/listing/")) {
        return "listing";
    }
    if (pathname.startsWith("/oferty-produktu/")) {
        return "productOffers";
    }
    if (pathname.startsWith("/produkt/") || pathname.startsWith("/oferta/") || pathname.startsWith("/ogloszenie/")) {
        return "product";
    }
    if (pathname.startsWith("/transakcja/dziekujemy")) {
        return "transaction";
    }
    if (pathname === "/koszyk") {
        return "cart";
    }
    if (pathname === "/moje-allegro/zakupy/obserwowane/ulubione") {
        return "favorites";
    }
    if (pathname.startsWith("/moje-allegro/zakupy/")) {
        return "myPurchases";
    }
    return null;
}

function getPageKeyFromUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== "allegro.pl") {
            return null;
        }
        return getPageKeyFromPath(parsed.pathname);
    } catch (_) {
        return null;
    }
}

// Sekcja "Różne" działa na całym allegro.pl (nie tylko na stronach z getPageKeyFromUrl),
// więc po jej zmianie odświeżamy każdą kartę z allegro.pl.
function isAllegroUrl(url) {
    try {
        return new URL(url).hostname === "allegro.pl";
    } catch (_) {
        return false;
    }
}

function isTargetUrl(url) {
    return getPageKeyFromUrl(url) !== null;
}

function normalizeSettings(raw) {
    const hasStoredProductSections = raw && typeof raw.productSections === "object";
    let productSections = normalizeProductSections(raw?.productSections);
    if (!hasStoredProductSections && raw?.product === false) {
        productSections = mapProductSections(false);
    }
    const hasAnyProductSectionEnabled = Object.values(productSections).some(Boolean);

    const hasStoredListingSections = raw && typeof raw.listingSections === "object";
    let listingSections = normalizeListingSections(raw?.listingSections);
    if (!hasStoredListingSections && raw?.listing === false) {
        listingSections = mapListingSections(false);
    }
    const hasAnyListingSectionEnabled = Object.values(listingSections).some(Boolean);

    const hasStoredProductOffersSections = raw && typeof raw.productOffersSections === "object";
    let productOffersSections = normalizeProductOffersSections(raw?.productOffersSections);
    if (!hasStoredProductOffersSections && raw?.productOffers === false) {
        productOffersSections = mapProductOffersSections(false);
    }
    const hasAnyProductOffersSectionEnabled = Object.values(productOffersSections).some(Boolean);

    const hasStoredTransactionSections = raw && typeof raw.transactionSections === "object";
    let transactionSections = normalizeTransactionSections(raw?.transactionSections);
    if (!hasStoredTransactionSections && raw?.transaction === false) {
        transactionSections = mapTransactionSections(false);
    }
    const hasAnyTransactionSectionEnabled = Object.values(transactionSections).some(Boolean);

    const hasStoredCartSections = raw && typeof raw.cartSections === "object";
    let cartSections = normalizeCartSections(raw?.cartSections);
    if (!hasStoredCartSections && raw?.cart === false) {
        cartSections = mapCartSections(false);
    }
    const hasAnyCartSectionEnabled = Object.values(cartSections).some(Boolean);

    const hasStoredFavoritesSections = raw && typeof raw.favoritesSections === "object";
    let favoritesSections = normalizeFavoritesSections(raw?.favoritesSections);
    if (!hasStoredFavoritesSections && raw?.favorites === false) {
        favoritesSections = mapFavoritesSections(false);
    }
    const hasAnyFavoritesSectionEnabled = Object.values(favoritesSections).some(Boolean);

    const hasStoredMiscSections = raw && typeof raw.miscSections === "object";
    let miscSections = normalizeMiscSections(raw?.miscSections);
    if (!hasStoredMiscSections && raw?.misc === false) {
        miscSections = mapMiscSections(false);
    }
    const hasAnyMiscSectionEnabled = Object.values(miscSections).some(Boolean);

    const hasStoredMyPurchasesSections = raw && typeof raw.myPurchasesSections === "object";
    let myPurchasesSections = normalizeMyPurchasesSections(raw?.myPurchasesSections);
    if (!hasStoredMyPurchasesSections && raw?.myPurchases === false) {
        myPurchasesSections = mapMyPurchasesSections(false);
    }
    const hasAnyMyPurchasesSectionEnabled = Object.values(myPurchasesSections).some(Boolean);

    return {
        listing: raw?.listing !== false && hasAnyListingSectionEnabled,
        productOffers: raw?.productOffers !== false && hasAnyProductOffersSectionEnabled,
        product: raw?.product !== false && hasAnyProductSectionEnabled,
        cart: raw?.cart !== false && hasAnyCartSectionEnabled,
        transaction: raw?.transaction !== false && hasAnyTransactionSectionEnabled,
        favorites: raw?.favorites !== false && hasAnyFavoritesSectionEnabled,
        misc: raw?.misc !== false && hasAnyMiscSectionEnabled,
        myPurchases: raw?.myPurchases !== false && hasAnyMyPurchasesSectionEnabled,
        productSections,
        listingSections,
        productOffersSections,
        cartSections,
        transactionSections,
        favoritesSections,
        myPurchasesSections,
        miscSections,
        miscSort: normalizeMiscSort(raw?.miscSort)
    };
}

function mapProductSections(value) {
    return Object.keys(DEFAULT_SETTINGS.productSections).reduce((acc, key) => {
        // Sekcje domyślnie wyłączone (zmieniające zachowanie) zawsze zostają wyłączone
        // przy przełączaniu całej sekcji "Strona produktu" - włącza się je tylko ręcznie.
        acc[key] = PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key) ? false : Boolean(value);
        return acc;
    }, {});
}

// Sekcje domyślnie WYŁĄCZONE (zmieniają zachowanie strony, a nie tylko ukrywają
// element) - brak zapisanej wartości oznacza false, a nie true.
const PRODUCT_SECTIONS_OFF_BY_DEFAULT = ["disableGalleryHover"];

function normalizeProductSections(raw) {
    const defaults = DEFAULT_SETTINGS.productSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key) ? raw?.[key] === true : raw?.[key] !== false;
        return acc;
    }, {});
}

function mapListingSections(value) {
    return Object.keys(DEFAULT_SETTINGS.listingSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeListingSections(raw) {
    const defaults = DEFAULT_SETTINGS.listingSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function mapProductOffersSections(value) {
    return Object.keys(DEFAULT_SETTINGS.productOffersSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeProductOffersSections(raw) {
    const defaults = DEFAULT_SETTINGS.productOffersSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function mapTransactionSections(value) {
    return Object.keys(DEFAULT_SETTINGS.transactionSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeTransactionSections(raw) {
    const defaults = DEFAULT_SETTINGS.transactionSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function mapCartSections(value) {
    return Object.keys(DEFAULT_SETTINGS.cartSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeCartSections(raw) {
    const defaults = DEFAULT_SETTINGS.cartSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function mapFavoritesSections(value) {
    return Object.keys(DEFAULT_SETTINGS.favoritesSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeFavoritesSections(raw) {
    const defaults = DEFAULT_SETTINGS.favoritesSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function mapMiscSections(value) {
    return Object.keys(DEFAULT_SETTINGS.miscSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeMiscSections(raw) {
    const defaults = DEFAULT_SETTINGS.miscSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

// Wartości ?order= wspólne dla kategorii, wyszukiwania i ofert produktu
// (bez "m" = trafność, to domyślne sortowanie Allegro).
const MISC_SORT_VALUES = ["p", "pd", "d", "dd", "qd", "t", "n"];

function normalizeMiscSort(raw) {
    return {
        enabled: raw?.enabled === true,
        value: MISC_SORT_VALUES.includes(raw?.value) ? raw.value : "p"
    };
}

function mapMyPurchasesSections(value) {
    return Object.keys(DEFAULT_SETTINGS.myPurchasesSections).reduce((acc, key) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
}

function normalizeMyPurchasesSections(raw) {
    const defaults = DEFAULT_SETTINGS.myPurchasesSections;
    return Object.keys(defaults).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function getSettings() {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get(["pageSettings", "enabled"])
            .then((result) => {
                if (result?.pageSettings) {
                    return normalizeSettings(result.pageSettings);
                }
                if (result?.enabled === false) {
                    return { listing: false, misc: false, productOffers: false, product: false, cart: false, transaction: false, favorites: false, myPurchases: false };
                }
                return { ...DEFAULT_SETTINGS };
            })
            .catch(() => ({ ...DEFAULT_SETTINGS }));
    }

    return new Promise((resolve) => {
        chrome.storage.local.get(["pageSettings", "enabled"], (result) => {
            if (result?.pageSettings) {
                resolve(normalizeSettings(result.pageSettings));
                return;
            }
            if (result?.enabled === false) {
                resolve({ listing: false, misc: false, productOffers: false, product: false, cart: false, transaction: false, favorites: false, myPurchases: false });
                return;
            }
            resolve({ ...DEFAULT_SETTINGS });
        });
    });
}

function setSettings(settings) {
    const normalized = normalizeSettings(settings);
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.set({ pageSettings: normalized });
    }

    return new Promise((resolve) => {
        chrome.storage.local.set({ pageSettings: normalized }, () => resolve());
    });
}

function getGlobalEnabled() {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get(["enabled"])
            .then((result) => result?.enabled !== false)
            .catch(() => DEFAULT_GLOBAL_ENABLED);
    }

    return new Promise((resolve) => {
        chrome.storage.local.get(["enabled"], (result) => {
            resolve(result?.enabled !== false);
        });
    });
}

function setGlobalEnabled(enabled) {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.set({ enabled: Boolean(enabled) });
    }

    return new Promise((resolve) => {
        chrome.storage.local.set({ enabled: Boolean(enabled) }, () => resolve());
    });
}

async function isEnabledForUrl(url, tabId) {
    if (!isAllegroUrl(url)) return false;
    const globalEnabled = await getGlobalEnabled();
    if (!globalEnabled) return false;
    const settings = await getSettings();
    const pageKey = getPageKeyFromUrl(url);
    if (pageKey) return settings[pageKey] !== false;

    // Strona bez własnej sekcji (np. strona główna, /uzytkownik/*, ale też strony,
    // na których nic nie ma do ukrycia): działa tu tylko sekcja "Różne", więc ikona
    // jest ON wyłącznie wtedy, gdy "Różne" faktycznie coś na tej stronie zastosowała
    // (raport źródła "misc" z misc-content.js, patrz REPORT_APPLIED_SECTIONS).
    if (settings.misc === false || typeof tabId !== "number") return false;
    await loadAppliedSections();
    const stored = appliedSectionsByTab.get(tabId);
    return Array.isArray(stored?.misc) && stored.misc.length > 0;
}

function setActionIcon(enabled, tabId) {
    const actionApi = (typeof browser !== "undefined" && browser?.action) ? browser.action : chrome.action;
    const details = { path: enabled ? ICONS_ENABLED : ICONS_DISABLED };
    if (typeof tabId === "number") details.tabId = tabId;

    if (typeof browser !== "undefined" && browser?.action) {
        return actionApi.setIcon(details);
    }
    return new Promise((resolve) => {
        actionApi.setIcon(details, () => {
            void chrome.runtime.lastError; // odczytujemy błąd, żeby nie trafił do konsoli jako "Unchecked runtime.lastError" (np. gdy karta o tabId już nie istnieje)
            resolve();
        });
    });
}

function setActionTitle(enabled, tabId) {
    const actionApi = (typeof browser !== "undefined" && browser?.action) ? browser.action : chrome.action;
    const details = {
        title: enabled ? "Allegro Clean View (mod): ON" : "Allegro Clean View (mod): OFF"
    };
    if (typeof tabId === "number") details.tabId = tabId;

    if (typeof browser !== "undefined" && browser?.action) {
        return actionApi.setTitle(details);
    }
    return new Promise((resolve) => {
        actionApi.setTitle(details, () => {
            void chrome.runtime.lastError; // j.w. - karta mogła już nie istnieć
            resolve();
        });
    });
}

async function refreshIconForTab(tabId) {
    const tabsApi = (typeof browser !== "undefined" && browser?.tabs) ? browser.tabs : chrome.tabs;
    let tab = null;
    if (typeof browser !== "undefined" && browser?.tabs) {
        tab = await tabsApi.get(tabId).catch(() => null);
    } else {
        tab = await new Promise((resolve) => tabsApi.get(tabId, (value) => {
            void chrome.runtime.lastError; // tabId mógł już nie istnieć (np. karta zamknięta)
            resolve(value || null);
        }));
    }

    const enabled = await isEnabledForUrl(tab?.url, tabId);
    await setActionIcon(enabled, tabId);
    await setActionTitle(enabled, tabId);
}

function getActiveTab() {
    if (typeof browser !== "undefined" && browser?.tabs) {
        return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs?.[0] || null);
    }

    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs?.[0] || null));
    });
}

function reloadTab(tabId) {
    if (typeof browser !== "undefined" && browser?.tabs) {
        return browser.tabs.reload(tabId);
    }
    return new Promise((resolve) => {
        chrome.tabs.reload(tabId, () => {
            void chrome.runtime.lastError; // karta mogła zostać zamknięta/zmienić id zanim reload dotarł - to nieszkodliwe, tylko odczytujemy błąd żeby Chrome nie logował "Unchecked runtime.lastError: No tab with id: ..."
            resolve();
        });
    });
}

async function applyPageSetting(pageKey, enabled) {
    const settings = await getSettings();
    settings[pageKey] = enabled;
    if (pageKey === "listing") {
        settings.listingSections = mapListingSections(enabled);
    }
    if (pageKey === "productOffers") {
        settings.productOffersSections = mapProductOffersSections(enabled);
    }
    if (pageKey === "product") {
        settings.productSections = mapProductSections(enabled);
    }
    if (pageKey === "transaction") {
        settings.transactionSections = mapTransactionSections(enabled);
    }
    if (pageKey === "cart") {
        settings.cartSections = mapCartSections(enabled);
    }
    if (pageKey === "favorites") {
        settings.favoritesSections = mapFavoritesSections(enabled);
    }
    if (pageKey === "misc") {
        settings.miscSections = mapMiscSections(enabled);
    }
    if (pageKey === "myPurchases") {
        settings.myPurchasesSections = mapMyPurchasesSections(enabled);
    }
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && (pageKey === "misc" ? isAllegroUrl(activeTab.url) : getPageKeyFromUrl(activeTab.url) === pageKey)) {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyProductSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.productSections = normalizeProductSections(settings.productSections);
    settings.productSections[sectionKey] = enabled;
    settings.product = Object.values(settings.productSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "product") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyTransactionSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.transactionSections = normalizeTransactionSections(settings.transactionSections);
    settings.transactionSections[sectionKey] = enabled;
    settings.transaction = Object.values(settings.transactionSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "transaction") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyListingSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.listingSections = normalizeListingSections(settings.listingSections);
    settings.listingSections[sectionKey] = enabled;
    settings.listing = Object.values(settings.listingSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "listing") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyProductOffersSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.productOffersSections = normalizeProductOffersSections(settings.productOffersSections);
    settings.productOffersSections[sectionKey] = enabled;
    settings.productOffers = Object.values(settings.productOffersSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "productOffers") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyCartSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.cartSections = normalizeCartSections(settings.cartSections);
    settings.cartSections[sectionKey] = enabled;
    settings.cart = Object.values(settings.cartSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "cart") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyFavoritesSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.favoritesSections = normalizeFavoritesSections(settings.favoritesSections);
    settings.favoritesSections[sectionKey] = enabled;
    settings.favorites = Object.values(settings.favoritesSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "favorites") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

// Domyślne sortowanie działa dopiero przy kolejnym wejściu na listę, więc
// nie przeładowujemy aktywnej karty.
async function applyMiscSortSetting(enabled, value) {
    const settings = await getSettings();
    settings.miscSort = normalizeMiscSort({ enabled, value });
    await setSettings(settings);
}

// Sekcja "Różne" nie ma własnej strony (działa na całym allegro.pl), więc
// odświeżamy aktywną kartę, jeśli jest na allegro.pl.
async function applyMiscSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.miscSections = normalizeMiscSections(settings.miscSections);
    settings.miscSections[sectionKey] = enabled;
    settings.misc = Object.values(settings.miscSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && isAllegroUrl(activeTab.url)) {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyMyPurchasesSectionSetting(sectionKey, enabled) {
    const settings = await getSettings();
    settings.myPurchasesSections = normalizeMyPurchasesSections(settings.myPurchasesSections);
    settings.myPurchasesSections[sectionKey] = enabled;
    settings.myPurchases = Object.values(settings.myPurchasesSections).some(Boolean);
    await setSettings(settings);

    const activeTab = await getActiveTab();
    if (activeTab?.id && getPageKeyFromUrl(activeTab.url) === "myPurchases") {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
}

async function applyEnabledState(enabled) {
    await setGlobalEnabled(enabled);
    const activeTab = await getActiveTab();
    if (activeTab?.id && isTargetUrl(activeTab.url)) {
        await reloadTab(activeTab.id);
    }
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    } else {
        await setActionIcon(enabled);
        await setActionTitle(enabled);
    }
}

const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : chrome.runtime;
const tabsApi = (typeof browser !== "undefined" && browser?.tabs) ? browser.tabs : chrome.tabs;

runtimeApi.onInstalled.addListener(async () => {
    const settings = await getSettings();
    await setSettings(settings);
    const globalEnabled = await getGlobalEnabled();
    await setGlobalEnabled(globalEnabled);
    const activeTab = await getActiveTab();
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
        return;
    }
    await setActionIcon(globalEnabled);
    await setActionTitle(globalEnabled);
});

runtimeApi.onStartup?.addListener(async () => {
    const activeTab = await getActiveTab();
    if (activeTab?.id) {
        await refreshIconForTab(activeTab.id);
    }
});

runtimeApi.onMessage?.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return;

    if (message.type === "GET_SETTINGS") {
        getSettings()
            .then((settings) => sendResponse({ settings }))
            .catch(() => sendResponse({ settings: { ...DEFAULT_SETTINGS } }));
        return true;
    }

    if (message.type === "SET_PAGE_ENABLED") {
        const pageKey = message.page;
        if (!["listing", "productOffers", "product", "cart", "transaction", "favorites", "myPurchases", "misc"].includes(pageKey)) {
            sendResponse({ ok: false, error: "INVALID_PAGE" });
            return;
        }
        applyPageSetting(pageKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_LISTING_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.listingSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyListingSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_PRODUCT_OFFERS_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.productOffersSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyProductOffersSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_PRODUCT_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.productSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyProductSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_TRANSACTION_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.transactionSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyTransactionSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_CART_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.cartSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyCartSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_FAVORITES_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.favoritesSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyFavoritesSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_MISC_SORT") {
        applyMiscSortSetting(message.enabled === true, message.value)
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_MISC_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.miscSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyMiscSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "SET_MY_PURCHASES_SECTION_ENABLED") {
        const sectionKey = message.section;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS.myPurchasesSections, sectionKey)) {
            sendResponse({ ok: false, error: "INVALID_SECTION" });
            return;
        }
        applyMyPurchasesSectionSetting(sectionKey, Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }

    if (message.type === "REPORT_APPLIED_SECTIONS") {
        const tabId = _sender?.tab?.id;
        if (typeof tabId === "number" && Array.isArray(message.sections)) {
            // Raporty z różnych skryptów tej samej karty (np. content.js i
            // misc-content.js) są przechowywane osobno wg źródła i scalane
            // przy odczycie. Brak "source" = skrypt strony ("main").
            const source = typeof message.source === "string" ? message.source : "main";
            mutateAppliedSections(() => {
                const prev = appliedSectionsByTab.get(tabId);
                const bySource = (prev && !Array.isArray(prev)) ? prev : {};
                appliedSectionsByTab.set(tabId, { ...bySource, [source]: message.sections });
            }).then(() => {
                notifyAppliedSectionsChanged(tabId);
                // Raport "Różne" może przełączyć ikonę na stronie bez własnej sekcji.
                if (source === "misc") refreshIconForTab(tabId);
            });
        }
        return;
    }

    if (message.type === "GET_APPLIED_SECTIONS") {
        const tabId = message.tabId;
        loadAppliedSections().then(() => {
            const stored = appliedSectionsByTab.get(tabId);
            const merged = (stored && !Array.isArray(stored)) ? [...new Set(Object.values(stored).flat())] : (stored || []);
            sendResponse({ sections: merged });
        });
        return true;
    }

    if (message.type === "GET_ENABLED") {
        getGlobalEnabled()
            .then((enabled) => sendResponse({ enabled }))
            .catch(() => sendResponse({ enabled: DEFAULT_GLOBAL_ENABLED }));
        return true;
    }

    if (message.type === "SET_ENABLED") {
        applyEnabledState(Boolean(message.enabled))
            .then(() => sendResponse({ ok: true }))
            .catch((error) => sendResponse({ ok: false, error: String(error) }));
        return true;
    }
});

tabsApi.onActivated?.addListener((activeInfo) => {
    refreshIconForTab(activeInfo.tabId);
});

tabsApi.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
        // Nowe ładowanie strony (w tym SPA-nawigacja Allegro) - stare dane
        // o zastosowanych sekcjach są nieaktualne, content skrypt zaraz
        // zgłosi nowe.
        mutateAppliedSections(() => appliedSectionsByTab.delete(tabId))
            .then(() => notifyAppliedSectionsChanged(tabId));
    }
    if (changeInfo.status === "loading" || changeInfo.status === "complete") {
        refreshIconForTab(tabId);
    }
});

tabsApi.onRemoved?.addListener((tabId) => {
    mutateAppliedSections(() => appliedSectionsByTab.delete(tabId));
});
