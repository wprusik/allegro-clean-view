const DEFAULT_PRODUCT_SECTIONS = {
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
};

const PRODUCT_SECTION_CHECKBOXES = {
    othersAlsoViewed: "setting-product-others-also-viewed",
    disableGalleryHover: "setting-product-disable-gallery-hover",
    lowestPriceProposals: "setting-product-lowest-price-proposals",
    singleShipmentOrder: "setting-product-single-shipment-order",
    singleShipmentSetOrder: "setting-product-single-shipment-set-order",
    ourProductSeries: "setting-product-our-product-series",
    proposalsForYou: "setting-product-proposals-for-you",
    discoverSimilarProducts: "setting-product-discover-similar-products",
    completeYourPurchase: "setting-product-complete-your-purchase",
    lastViewed: "setting-product-last-viewed",
    inspiredBySearches: "setting-product-inspired-by-searches",
    allegroPayCoupons: "setting-product-allegro-pay-coupons",
    askOnPage: "setting-product-ask-on-page",
    descriptionExpanded: "setting-product-description-expanded",
    brandInfo: "setting-product-brand-info",
    upsellAiSuggestion: "setting-product-upsell-ai-suggestion",
    productSurvey: "setting-product-survey",
    infiniteFeed: "setting-product-infinite-feed",
    ads: "setting-product-ads",
    lokalnieOffers: "setting-product-lokalnie-offers",
    collapsedReviews: "setting-product-collapsed-reviews",
    similarOffers: "setting-product-similar-offers",
    endedOfferReco: "setting-product-ended-offer-reco",
    recommendedProducts: "setting-product-recommended-products"
};

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

const TRANSACTION_SECTION_CHECKBOXES = {
    ads: "setting-transaction-ads",
    lottery: "setting-transaction-lottery",
    allegroKlik: "setting-transaction-allegro-klik",
    lowestPriceGuarantee: "setting-transaction-lowest-price-guarantee",
    selectedForYou: "setting-transaction-selected-for-you",
    basedOnViewed: "setting-transaction-based-on-viewed",
    basedOnLiked: "setting-transaction-based-on-liked",
    buyRegularly: "setting-transaction-buy-regularly",
    infiniteFeed: "setting-transaction-infinite-feed"
};

const DEFAULT_CART_SECTIONS = {
    addToShipment: true
};

const CART_SECTION_CHECKBOXES = {
    addToShipment: "setting-cart-add-to-shipment"
};

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

const LISTING_SECTION_CHECKBOXES = {
    recommendations: "setting-listing-recommendations",
    articles: "setting-listing-articles",
    sponsoredBelowFilters: "setting-listing-sponsored-below-filters",
    sponsoredPanels: "setting-listing-sponsored-panels",
    aiSuggestions: "setting-listing-ai-suggestions",
    relatedLinks: "setting-listing-related-links",
    similarPhrases: "setting-listing-similar-phrases",
    advice: "setting-listing-advice",
    dealsZone: "setting-listing-deals-zone",
    top10: "setting-listing-top10"
};

const DEFAULT_PRODUCT_OFFERS_SECTIONS = {
    sponsoredBrand: true,
    officialStore: true,
    similarOffers: true
};

const PRODUCT_OFFERS_SECTION_CHECKBOXES = {
    sponsoredBrand: "setting-product-offers-sponsored-brand",
    officialStore: "setting-product-offers-official-store",
    similarOffers: "setting-product-offers-similar-offers"
};

const DEFAULT_FAVORITES_SECTIONS = {
    combineOffersProposal: true,
    inspiredByFavorites: true,
    othersAlsoBuy: true
};

const FAVORITES_SECTION_CHECKBOXES = {
    combineOffersProposal: "setting-favorites-combine-offers-proposal",
    inspiredByFavorites: "setting-favorites-inspired",
    othersAlsoBuy: "setting-favorites-others-buy"
};

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

const MISC_SECTION_CHECKBOXES = {
    searchSuggestions: "setting-misc-search-suggestions",
    sponsoredOffers: "setting-misc-sponsored-offers",
    loginAd: "setting-misc-login-ad",
    allegroServices: "setting-misc-allegro-services",
    reviewsFilter: "setting-misc-reviews-filter",
    comparisonRecommended: "setting-misc-comparison-recommended",
    allegroAssistant: "setting-misc-allegro-assistant",
    footerLinks: "setting-misc-footer-links",
    footerColumns: "setting-misc-footer-columns",
    footerAd: "setting-misc-footer-ad",
    mainTopAd: "setting-misc-main-top-ad"
};

const DEFAULT_MY_PURCHASES_SECTIONS = {
    shortcutTiles: true,
    cashbackBanner: true
};

const MY_PURCHASES_SECTION_CHECKBOXES = {
    shortcutTiles: "setting-my-purchases-shortcut-tiles",
    cashbackBanner: "setting-my-purchases-cashback-banner"
};

function sendMessage(message) {
    if (typeof browser !== "undefined" && browser?.runtime) {
        return browser.runtime.sendMessage(message);
    }

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                reject(new Error(lastError.message));
                return;
            }
            resolve(response);
        });
    });
}

function setDisabled(disabled) {
    document.querySelectorAll('input[type="checkbox"], button, select').forEach((el) => {
        el.disabled = disabled;
    });
}

// Sekcje domyślnie WYŁĄCZONE (zmieniają zachowanie strony, a nie tylko ukrywają
// element) - brak zapisanej wartości oznacza false, a nie true.
const PRODUCT_SECTIONS_OFF_BY_DEFAULT = ["disableGalleryHover"];

function normalizeProductSections(raw) {
    return Object.keys(DEFAULT_PRODUCT_SECTIONS).reduce((acc, key) => {
        acc[key] = PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key) ? raw?.[key] === true : raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeTransactionSections(raw) {
    return Object.keys(DEFAULT_TRANSACTION_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeCartSections(raw) {
    return Object.keys(DEFAULT_CART_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeListingSections(raw) {
    return Object.keys(DEFAULT_LISTING_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeProductOffersSections(raw) {
    return Object.keys(DEFAULT_PRODUCT_OFFERS_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeFavoritesSections(raw) {
    return Object.keys(DEFAULT_FAVORITES_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeMiscSections(raw) {
    return Object.keys(DEFAULT_MISC_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function normalizeMyPurchasesSections(raw) {
    return Object.keys(DEFAULT_MY_PURCHASES_SECTIONS).reduce((acc, key) => {
        acc[key] = raw?.[key] !== false;
        return acc;
    }, {});
}

function syncProductMasterCheckbox(product, sectionCheckboxes) {
    // Sekcje zmieniające zachowanie (domyślnie wyłączone) nie wchodzą w stan
    // głównego checkboxa - nie włączają się razem z całą sekcją.
    const values = Object.entries(sectionCheckboxes)
        .filter(([key]) => !PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key))
        .map(([, checkbox]) => checkbox.checked);
    const enabledCount = values.filter(Boolean).length;

    product.checked = enabledCount === values.length;
    product.indeterminate = enabledCount > 0 && enabledCount < values.length;
}

// Odpowiednik getPageKeyFromPath w background.js - używany tylko do
// podświetlenia (pogrubienia) w popupie, które ustawienie dotyczy
// bieżącej karty. Musi być zgodny z logiką w background.js, żeby
// pogrubiona sekcja faktycznie odpowiadała temu, co zmieni się po
// przeładowaniu tej konkretnej karty.
function getActivePageKey(pathname) {
    if (!pathname) return null;
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

async function getActiveTabInfo() {
    const queryTabs = (typeof browser !== "undefined" && browser?.tabs)
        ? browser.tabs.query({ active: true, currentWindow: true })
        : new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, resolve));

    try {
        const tabs = await queryTabs;
        const tab = tabs?.[0];
        if (!tab?.url) return { tabId: tab?.id ?? null, pathname: null };
        return { tabId: tab.id, pathname: new URL(tab.url).pathname };
    } catch (_) {
        return { tabId: null, pathname: null };
    }
}

function setSectionExpanded(expanded, subsettings, toggleText, toggleArrow, expandedLabel, collapsedLabel) {
    subsettings.classList.toggle("is-collapsed", !expanded);
    toggleArrow.textContent = expanded ? "▴" : "▾";
    toggleText.setAttribute("aria-expanded", String(expanded));
    toggleText.setAttribute("aria-label", expanded ? collapsedLabel : expandedLabel);
}

async function updateSetting(page, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_PAGE_ENABLED", page, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateProductSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_PRODUCT_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateTransactionSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_TRANSACTION_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateCartSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_CART_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateListingSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_LISTING_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateProductOffersSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_PRODUCT_OFFERS_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateFavoritesSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_FAVORITES_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateMiscSortSetting(enabled, value) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_MISC_SORT", enabled, value });
    } finally {
        setDisabled(false);
    }
}

async function updateMiscSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_MISC_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function updateMyPurchasesSectionSetting(section, enabled) {
    setDisabled(true);
    try {
        await sendMessage({ type: "SET_MY_PURCHASES_SECTION_ENABLED", section, enabled });
    } finally {
        setDisabled(false);
    }
}

async function initPopup() {
    const listing = document.getElementById("setting-listing");
    const productOffers = document.getElementById("setting-product-offers");
    const product = document.getElementById("setting-product");
    const transaction = document.getElementById("setting-transaction");
    const cart = document.getElementById("setting-cart");
    const favorites = document.getElementById("setting-favorites");
    const misc = document.getElementById("setting-misc");
    const myPurchases = document.getElementById("setting-my-purchases");
    const toggleExtension = document.getElementById("toggle-extension");
    const toggleListingSections = document.getElementById("toggle-listing-sections");
    const toggleListingSectionsArrow = toggleListingSections.querySelector(".expand-arrow");
    const listingSubsettings = document.getElementById("listing-subsettings");
    const toggleProductOffersSections = document.getElementById("toggle-product-offers-sections");
    const toggleProductOffersSectionsArrow = toggleProductOffersSections.querySelector(".expand-arrow");
    const productOffersSubsettings = document.getElementById("productOffers-subsettings");
    const toggleProductSections = document.getElementById("toggle-product-sections");
    const toggleProductSectionsArrow = toggleProductSections.querySelector(".expand-arrow");
    const productSubsettings = document.getElementById("product-subsettings");
    const toggleTransactionSections = document.getElementById("toggle-transaction-sections");
    const toggleTransactionSectionsArrow = toggleTransactionSections.querySelector(".expand-arrow");
    const transactionSubsettings = document.getElementById("transaction-subsettings");
    const toggleCartSections = document.getElementById("toggle-cart-sections");
    const toggleCartSectionsArrow = toggleCartSections.querySelector(".expand-arrow");
    const cartSubsettings = document.getElementById("cart-subsettings");
    const toggleFavoritesSections = document.getElementById("toggle-favorites-sections");
    const toggleFavoritesSectionsArrow = toggleFavoritesSections.querySelector(".expand-arrow");
    const favoritesSubsettings = document.getElementById("favorites-subsettings");
    const toggleMiscSections = document.getElementById("toggle-misc-sections");
    const toggleMiscSectionsArrow = toggleMiscSections.querySelector(".expand-arrow");
    const miscSubsettings = document.getElementById("misc-subsettings");
    const toggleMyPurchasesSections = document.getElementById("toggle-my-purchases-sections");
    const toggleMyPurchasesSectionsArrow = toggleMyPurchasesSections.querySelector(".expand-arrow");
    const myPurchasesSubsettings = document.getElementById("my-purchases-subsettings");
    const listingSectionCheckboxes = Object.keys(LISTING_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(LISTING_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const productOffersSectionCheckboxes = Object.keys(PRODUCT_OFFERS_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(PRODUCT_OFFERS_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const productSectionCheckboxes = Object.keys(PRODUCT_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(PRODUCT_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const transactionSectionCheckboxes = Object.keys(TRANSACTION_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(TRANSACTION_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const cartSectionCheckboxes = Object.keys(CART_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(CART_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const favoritesSectionCheckboxes = Object.keys(FAVORITES_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(FAVORITES_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const miscSectionCheckboxes = Object.keys(MISC_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(MISC_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});
    const myPurchasesSectionCheckboxes = Object.keys(MY_PURCHASES_SECTION_CHECKBOXES).reduce((acc, key) => {
        acc[key] = document.getElementById(MY_PURCHASES_SECTION_CHECKBOXES[key]);
        return acc;
    }, {});

    // Pogrubienie sekcji odpowiadającej stronie, na której jest obecnie
    // otwarta aktywna karta przeglądarki.
    const { tabId: activeTabId, pathname: activePathname } = await getActiveTabInfo();
    const activePageKey = getActivePageKey(activePathname);
    if (activePageKey) {
        const activeRow = document.querySelector(`.setting-row[data-page="${activePageKey}"]`);
        activeRow?.classList.add("is-active");
    }

    // Pogrubienie pojedynczych pozycji w podmenu, które FAKTYCZNIE coś
    // usunęły z DOM na stronie aktywnej karty (a nie tylko są włączone w
    // configu) - dane raportowane przez content.js/my-purchases-content.js
    // do background.js (REPORT_APPLIED_SECTIONS), patrz komentarz przy
    // appliedSectionsByTab w background.js.
    // Pobiera z background.js aktualną listę zastosowanych sekcji i ustawia
    // pogrubienia (klasa is-applied). Czyści stare, więc działa też "na żywo":
    // wywoływane przy otwarciu popupu oraz za każdym razem, gdy background
    // zgłosi zmianę (APPLIED_SECTIONS_CHANGED) - np. po doładowaniu elementu
    // na stronie albo po przeładowaniu karty przy otwartym popupie.
    async function refreshAppliedSections() {
        if (activeTabId == null) return;
        try {
            const { sections: appliedSections } = await sendMessage({ type: "GET_APPLIED_SECTIONS", tabId: activeTabId }) || {};
            document.querySelectorAll(".setting-row.is-applied").forEach((el) => el.classList.remove("is-applied"));
            const miscSectionKeys = new Set(Object.keys(DEFAULT_MISC_SECTIONS));
            (appliedSections || []).forEach((key) => {
                // Klucze mogą się powtarzać między stronami (np. infiniteFeed),
                // więc szukamy najpierw w podmenu strony aktywnej karty.
                const scope = (activePageKey && document.getElementById(`${activePageKey}-subsettings`)) || document;
                const rowSelector = `.subsettings .setting-row[data-section="${key}"], .setting-row[data-section="${key}"]`;
                // Fallback na cały popup: sekcja "Różne" działa na każdej stronie, więc jej
                // klucz nie leży w podmenu strony aktywnej karty.
                (scope.querySelector(rowSelector) || document.querySelector(rowSelector))?.classList.add("is-applied");
                // Sekcja "Różne": główny wiersz pogrubiamy, gdy ZASTOSOWANA jest choćby
                // jedna pozycja wewnątrz niej (inaczej niż pozostałe sekcje, gdzie główny
                // wiersz pogrubia się tylko gdy to jest strona aktywnej karty).
                if (miscSectionKeys.has(key)) {
                    document.querySelector('.setting-row[data-page="misc"]')?.classList.add("is-applied");
                }
            });
        } catch (_) {
        }
    }
    await refreshAppliedSections();
    (typeof browser !== "undefined" && browser?.runtime ? browser.runtime : chrome.runtime).onMessage.addListener((message) => {
        if (message?.type === "APPLIED_SECTIONS_CHANGED" && message.tabId === activeTabId) {
            refreshAppliedSections();
        }
    });

    let settings = {
        listing: true,
        productOffers: true,
        product: true,
        cart: true,
        transaction: true,
        favorites: true,
        misc: true,
        myPurchases: true,
        listingSections: { ...DEFAULT_LISTING_SECTIONS },
        productOffersSections: { ...DEFAULT_PRODUCT_OFFERS_SECTIONS },
        productSections: { ...DEFAULT_PRODUCT_SECTIONS },
        transactionSections: { ...DEFAULT_TRANSACTION_SECTIONS },
        cartSections: { ...DEFAULT_CART_SECTIONS },
        favoritesSections: { ...DEFAULT_FAVORITES_SECTIONS },
        myPurchasesSections: { ...DEFAULT_MY_PURCHASES_SECTIONS },
        miscSections: { ...DEFAULT_MISC_SECTIONS }
    };
    let extensionEnabled = true;
    try {
        const [settingsResponse, enabledResponse] = await Promise.all([
            sendMessage({ type: "GET_SETTINGS" }),
            sendMessage({ type: "GET_ENABLED" })
        ]);
        settings = settingsResponse?.settings || settings;
        extensionEnabled = enabledResponse?.enabled !== false;
    } catch (_) {
    }

    const listingSections = normalizeListingSections(settings.listingSections);
    const productOffersSections = normalizeProductOffersSections(settings.productOffersSections);
    const productSections = normalizeProductSections(settings.productSections);
    const transactionSections = normalizeTransactionSections(settings.transactionSections);
    const cartSections = normalizeCartSections(settings.cartSections);
    const favoritesSections = normalizeFavoritesSections(settings.favoritesSections);
    const miscSections = normalizeMiscSections(settings.miscSections);
    const myPurchasesSections = normalizeMyPurchasesSections(settings.myPurchasesSections);


    Object.keys(listingSectionCheckboxes).forEach((key) => {
        listingSectionCheckboxes[key].checked = listingSections[key];
    });
    syncProductMasterCheckbox(listing, listingSectionCheckboxes);

    Object.keys(productOffersSectionCheckboxes).forEach((key) => {
        productOffersSectionCheckboxes[key].checked = productOffersSections[key];
    });
    syncProductMasterCheckbox(productOffers, productOffersSectionCheckboxes);

    Object.keys(productSectionCheckboxes).forEach((key) => {
        productSectionCheckboxes[key].checked = productSections[key];
    });
    syncProductMasterCheckbox(product, productSectionCheckboxes);

    Object.keys(transactionSectionCheckboxes).forEach((key) => {
        transactionSectionCheckboxes[key].checked = transactionSections[key];
    });
    syncProductMasterCheckbox(transaction, transactionSectionCheckboxes);

    Object.keys(cartSectionCheckboxes).forEach((key) => {
        cartSectionCheckboxes[key].checked = cartSections[key];
    });
    syncProductMasterCheckbox(cart, cartSectionCheckboxes);

    Object.keys(favoritesSectionCheckboxes).forEach((key) => {
        favoritesSectionCheckboxes[key].checked = favoritesSections[key];
    });
    syncProductMasterCheckbox(favorites, favoritesSectionCheckboxes);

    Object.keys(miscSectionCheckboxes).forEach((key) => {
        miscSectionCheckboxes[key].checked = miscSections[key];
    });
    // Domyślne sortowanie (osobny klucz miscSort, poza listą sekcji ukrywania).
    const miscSortCheckbox = document.getElementById("setting-misc-sort");
    const miscSortSelect = document.getElementById("setting-misc-sort-select");
    const miscSortButton = document.getElementById("setting-misc-sort-button");
    const miscSortList = miscSortSelect.querySelector(".acv-select-list");
    // Własna lista wyboru (zamiast <select>), żeby zamknięta nie poszerzała popupu.
    const setMiscSortValue = (value) => {
        const options = [...miscSortList.querySelectorAll("li")];
        const chosen = options.find((li) => li.dataset.value === value);
        if (!chosen) return false;
        options.forEach((li) => {
            li.classList.toggle("is-selected", li === chosen);
            li.setAttribute("aria-selected", String(li === chosen));
        });
        miscSortSelect.dataset.value = value;
        miscSortSelect.querySelector(".acv-select-label").textContent = chosen.textContent;
        return true;
    };
    const closeMiscSortList = () => {
        miscSortList.hidden = true;
        miscSortButton.setAttribute("aria-expanded", "false");
    };
    miscSortCheckbox.checked = settings.miscSort?.enabled === true;
    setMiscSortValue(settings.miscSort?.value) || setMiscSortValue("p");
    syncProductMasterCheckbox(misc, miscSectionCheckboxes);

    Object.keys(myPurchasesSectionCheckboxes).forEach((key) => {
        myPurchasesSectionCheckboxes[key].checked = myPurchasesSections[key];
    });
    syncProductMasterCheckbox(myPurchases, myPurchasesSectionCheckboxes);

    setSectionExpanded(false, listingSubsettings, toggleListingSections, toggleListingSectionsArrow, "Rozwiń ustawienia Kategorie i wyszukiwanie", "Zwiń ustawienia Kategorie i wyszukiwanie");
    setSectionExpanded(false, productOffersSubsettings, toggleProductOffersSections, toggleProductOffersSectionsArrow, "Rozwiń ustawienia Oferty produktu", "Zwiń ustawienia Oferty produktu");
    setSectionExpanded(false, productSubsettings, toggleProductSections, toggleProductSectionsArrow, "Rozwiń ustawienia strony produktu", "Zwiń ustawienia strony produktu");
    setSectionExpanded(false, transactionSubsettings, toggleTransactionSections, toggleTransactionSectionsArrow, "Rozwiń ustawienia Transakcja", "Zwiń ustawienia Transakcja");
    setSectionExpanded(false, cartSubsettings, toggleCartSections, toggleCartSectionsArrow, "Rozwiń ustawienia Koszyk", "Zwiń ustawienia Koszyk");
    setSectionExpanded(false, favoritesSubsettings, toggleFavoritesSections, toggleFavoritesSectionsArrow, "Rozwiń ustawienia Ulubione", "Zwiń ustawienia Ulubione");
    setSectionExpanded(false, miscSubsettings, toggleMiscSections, toggleMiscSectionsArrow, "Rozwiń ustawienia Różne", "Zwiń ustawienia Różne");
    setSectionExpanded(false, myPurchasesSubsettings, toggleMyPurchasesSections, toggleMyPurchasesSectionsArrow, "Rozwiń ustawienia Moje zakupy", "Zwiń ustawienia Moje zakupy");

    document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        el.disabled = !extensionEnabled;
    });

    toggleExtension.textContent = extensionEnabled ? "Wyłącz wtyczkę" : "Włącz wtyczkę";
    toggleExtension.classList.toggle("is-disabled", !extensionEnabled);

    const toggleListingSectionsHandler = () => {
        const expanded = listingSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, listingSubsettings, toggleListingSections, toggleListingSectionsArrow, "Rozwiń ustawienia Kategorie i wyszukiwanie", "Zwiń ustawienia Kategorie i wyszukiwanie");
    };
    toggleListingSections.addEventListener("click", toggleListingSectionsHandler);
    toggleListingSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleListingSectionsHandler();
        }
    });

    const toggleProductOffersSectionsHandler = () => {
        const expanded = productOffersSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, productOffersSubsettings, toggleProductOffersSections, toggleProductOffersSectionsArrow, "Rozwiń ustawienia Oferty produktu", "Zwiń ustawienia Oferty produktu");
    };
    toggleProductOffersSections.addEventListener("click", toggleProductOffersSectionsHandler);
    toggleProductOffersSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleProductOffersSectionsHandler();
        }
    });

    const toggleProductSectionsHandler = () => {
        const expanded = productSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, productSubsettings, toggleProductSections, toggleProductSectionsArrow, "Rozwiń ustawienia strony produktu", "Zwiń ustawienia strony produktu");
    };
    toggleProductSections.addEventListener("click", toggleProductSectionsHandler);
    toggleProductSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleProductSectionsHandler();
        }
    });

    const toggleTransactionSectionsHandler = () => {
        const expanded = transactionSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, transactionSubsettings, toggleTransactionSections, toggleTransactionSectionsArrow, "Rozwiń ustawienia Transakcja", "Zwiń ustawienia Transakcja");
    };
    toggleTransactionSections.addEventListener("click", toggleTransactionSectionsHandler);
    toggleTransactionSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleTransactionSectionsHandler();
        }
    });

    const toggleCartSectionsHandler = () => {
        const expanded = cartSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, cartSubsettings, toggleCartSections, toggleCartSectionsArrow, "Rozwiń ustawienia Koszyk", "Zwiń ustawienia Koszyk");
    };
    toggleCartSections.addEventListener("click", toggleCartSectionsHandler);
    toggleCartSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleCartSectionsHandler();
        }
    });

    const toggleFavoritesSectionsHandler = () => {
        const expanded = favoritesSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, favoritesSubsettings, toggleFavoritesSections, toggleFavoritesSectionsArrow, "Rozwiń ustawienia Ulubione", "Zwiń ustawienia Ulubione");
    };
    toggleFavoritesSections.addEventListener("click", toggleFavoritesSectionsHandler);
    toggleFavoritesSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleFavoritesSectionsHandler();
        }
    });

    const toggleMiscSectionsHandler = () => {
        const expanded = miscSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, miscSubsettings, toggleMiscSections, toggleMiscSectionsArrow, "Rozwiń ustawienia Różne", "Zwiń ustawienia Różne");
    };
    toggleMiscSections.addEventListener("click", toggleMiscSectionsHandler);
    toggleMiscSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMiscSectionsHandler();
        }
    });

    const toggleMyPurchasesSectionsHandler = () => {
        const expanded = myPurchasesSubsettings.classList.contains("is-collapsed");
        setSectionExpanded(expanded, myPurchasesSubsettings, toggleMyPurchasesSections, toggleMyPurchasesSectionsArrow, "Rozwiń ustawienia Moje zakupy", "Zwiń ustawienia Moje zakupy");
    };
    toggleMyPurchasesSections.addEventListener("click", toggleMyPurchasesSectionsHandler);
    toggleMyPurchasesSections.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMyPurchasesSectionsHandler();
        }
    });

    listing.addEventListener("change", async () => {
        await updateSetting("listing", listing.checked);
        Object.values(listingSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = listing.checked;
        });
        listing.indeterminate = false;
    });

    productOffers.addEventListener("change", async () => {
        await updateSetting("productOffers", productOffers.checked);
        Object.values(productOffersSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = productOffers.checked;
        });
        productOffers.indeterminate = false;
    });

    product.addEventListener("change", async () => {
        await updateSetting("product", product.checked);
        Object.entries(productSectionCheckboxes).forEach(([key, checkbox]) => {
            checkbox.checked = PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key) ? false : product.checked;
        });
        product.indeterminate = false;
    });

    misc.addEventListener("change", async () => {
        await updateSetting("misc", misc.checked);
        Object.values(miscSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = misc.checked;
        });
        misc.indeterminate = false;
    });

    myPurchases.addEventListener("change", async () => {
        await updateSetting("myPurchases", myPurchases.checked);
        Object.values(myPurchasesSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = myPurchases.checked;
        });
        myPurchases.indeterminate = false;
    });

    transaction.addEventListener("change", async () => {
        await updateSetting("transaction", transaction.checked);
        Object.values(transactionSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = transaction.checked;
        });
        transaction.indeterminate = false;
    });
    cart.addEventListener("change", async () => {
        await updateSetting("cart", cart.checked);
        Object.values(cartSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = cart.checked;
        });
        cart.indeterminate = false;
    });
    favorites.addEventListener("change", async () => {
        await updateSetting("favorites", favorites.checked);
        Object.values(favoritesSectionCheckboxes).forEach((checkbox) => {
            checkbox.checked = favorites.checked;
        });
        favorites.indeterminate = false;
    });

    Object.keys(listingSectionCheckboxes).forEach((key) => {
        const checkbox = listingSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateListingSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(listing, listingSectionCheckboxes);
        });
    });

    Object.keys(productOffersSectionCheckboxes).forEach((key) => {
        const checkbox = productOffersSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateProductOffersSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(productOffers, productOffersSectionCheckboxes);
        });
    });

    Object.keys(productSectionCheckboxes).forEach((key) => {
        const checkbox = productSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateProductSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(product, productSectionCheckboxes);
        });
    });

    Object.keys(transactionSectionCheckboxes).forEach((key) => {
        const checkbox = transactionSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateTransactionSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(transaction, transactionSectionCheckboxes);
        });
    });

    Object.keys(cartSectionCheckboxes).forEach((key) => {
        const checkbox = cartSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateCartSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(cart, cartSectionCheckboxes);
        });
    });

    Object.keys(favoritesSectionCheckboxes).forEach((key) => {
        const checkbox = favoritesSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateFavoritesSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(favorites, favoritesSectionCheckboxes);
        });
    });

    Object.keys(miscSectionCheckboxes).forEach((key) => {
        const checkbox = miscSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateMiscSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(misc, miscSectionCheckboxes);
        });
    });

    const saveMiscSort = () => updateMiscSortSetting(miscSortCheckbox.checked, miscSortSelect.dataset.value);
    miscSortCheckbox.addEventListener("change", saveMiscSort);
    miscSortButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = miscSortList.hidden;
        miscSortList.hidden = !willOpen;
        miscSortButton.setAttribute("aria-expanded", String(willOpen));
    });
    miscSortList.addEventListener("click", async (event) => {
        const li = event.target.closest("li");
        if (!li) return;
        setMiscSortValue(li.dataset.value);
        closeMiscSortList();
        await saveMiscSort();
    });
    document.addEventListener("click", closeMiscSortList);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMiscSortList();
    });

    Object.keys(myPurchasesSectionCheckboxes).forEach((key) => {
        const checkbox = myPurchasesSectionCheckboxes[key];
        checkbox.addEventListener("change", async () => {
            await updateMyPurchasesSectionSetting(key, checkbox.checked);
            syncProductMasterCheckbox(myPurchases, myPurchasesSectionCheckboxes);
        });
    });

    toggleExtension.addEventListener("click", async () => {
        setDisabled(true);
        try {
            extensionEnabled = !extensionEnabled;
            await sendMessage({ type: "SET_ENABLED", enabled: extensionEnabled });
            toggleExtension.textContent = extensionEnabled ? "Wyłącz wtyczkę" : "Włącz wtyczkę";
            toggleExtension.classList.toggle("is-disabled", !extensionEnabled);
        } finally {
            setDisabled(false);
            if (!extensionEnabled) {
                document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
                    el.disabled = true;
                });
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", initPopup);
