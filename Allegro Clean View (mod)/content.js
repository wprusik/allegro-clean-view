// Mapowanie klucza sekcji -> klasy CSS na <html>, używane przez reguły w
// product-page-instant-hide.css do natychmiastowego (od pierwszej klatki
// renderowania) ukrywania sekcji o stabilnych selektorach atrybutowych.
// Tylko sekcje faktycznie mające taki wariant w CSS są tu wymienione -
// reszta (identyfikowana wyłącznie po tekście nagłówka) jest obsługiwana
// przez MutationObserver w removeAds/observeAndRemoveAds poniżej.
const ACV_INSTANT_HIDE_CSS_CLASSES = {
    othersAlsoViewed: "acv-hide-others-also-viewed",
    ourProductSeries: "acv-hide-our-product-series",
    allegroPayCoupons: "acv-hide-allegro-pay-coupons",
    askOnPage: "acv-hide-ask-on-page",
    brandInfo: "acv-hide-brand-info",
    upsellAiSuggestion: "acv-hide-upsell-ai-suggestion",
    productSurvey: "acv-hide-product-survey",
    infiniteFeed: "acv-hide-infinite-feed",
    ads: "acv-hide-ads",
    lokalnieOffers: "acv-hide-lokalnie-offers",
    endedOfferReco: "acv-hide-ended-offer-reco",
    recommendedProducts: "acv-hide-recommended-products",
    // Nie ukrywanie, tylko wyłączenie powiększania obrazu głównego po najechaniu
    // (patrz reguła w product-page-instant-hide.css); sterowane tym samym checkboxem
    // co blokada zmiany obrazu miniaturami (disableGalleryHover, domyślnie wyłączone).
    disableGalleryHover: "acv-disable-gallery-zoom"
};

function _acvApplyInstantHideClasses(sections) {
    if (!document.documentElement) return;
    Object.entries(ACV_INSTANT_HIDE_CSS_CLASSES).forEach(([key, className]) => {
        document.documentElement.classList.toggle(className, sections[key] !== false);
    });
}

// Ustawiamy klasy NATYCHMIAST, synchronicznie, na starcie pliku (przed
// jakimkolwiek await), zgodnie z domyślnymi wartościami sekcji
// (DEFAULT_PRODUCT_SECTIONS niżej) - document.documentElement istnieje już
// w fazie document_start, zanim reszta DOM się zbuduje. Gdyby czekać na
// asynchroniczny odczyt chrome.storage (getProductConfig), CSS zdążyłby
// przegapić pierwszą klatkę renderowania dla większości przypadków (gdzie
// i tak używa się wartości domyślnych - true). Jeśli faktyczny zapisany
// config różni się od domyślnych wartości, klasy są korygowane w IIFE na
// końcu pliku zaraz po odczycie configu.
_acvApplyInstantHideClasses({ disableGalleryHover: false, othersAlsoViewed: true, ourProductSeries: true, allegroPayCoupons: true, askOnPage: true, brandInfo: true, upsellAiSuggestion: true, productSurvey: true, infiniteFeed: true, ads: true, lokalnieOffers: true, endedOfferReco: true, recommendedProducts: true });

function findElementByTagNameAndText(tagName, text) {
    const el = [...document.getElementsByTagName(tagName)]
        .find((candidate) => candidate?.textContent?.startsWith(text));
    return el?.parentElement;
}

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

// Sekcje domyślnie WYŁĄCZONE (zmieniają zachowanie strony, a nie tylko ukrywają
// element) - brak zapisanej wartości oznacza false, a nie true.
const PRODUCT_SECTIONS_OFF_BY_DEFAULT = ["disableGalleryHover"];

function normalizeProductSections(raw) {
    return Object.keys(DEFAULT_PRODUCT_SECTIONS).reduce((acc, key) => {
        acc[key] = PRODUCT_SECTIONS_OFF_BY_DEFAULT.includes(key) ? raw?.[key] === true : raw?.[key] !== false;
        return acc;
    }, {});
}

function getProductConfig() {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get(["pageSettings", "enabled"])
            .then((result) => {
                const sections = normalizeProductSections(result?.pageSettings?.productSections);
                const productEnabled = Object.values(sections).some(Boolean);
                if (result?.pageSettings) {
                    return {
                        enabled: result.enabled !== false && result.pageSettings.product !== false && productEnabled,
                        sections
                    };
                }
                return {
                    enabled: result?.enabled !== false,
                    sections
                };
            })
            .catch(() => ({
                enabled: true,
                sections: {...DEFAULT_PRODUCT_SECTIONS}
            }));
    }

    return new Promise((resolve) => {
        if (typeof chrome === "undefined" || !chrome?.storage?.local) {
            resolve({
                enabled: true,
                sections: {...DEFAULT_PRODUCT_SECTIONS}
            });
            return;
        }
        chrome.storage.local.get(["pageSettings", "enabled"], (result) => {
            const sections = normalizeProductSections(result?.pageSettings?.productSections);
            const productEnabled = Object.values(sections).some(Boolean);
            if (result?.pageSettings) {
                resolve({
                    enabled: result.enabled !== false && result.pageSettings.product !== false && productEnabled,
                    sections
                });
                return;
            }
            resolve({
                enabled: result?.enabled !== false,
                sections
            });
        });
    });
}

function findElementByTitle(title) {
    return findElementByTagNameAndText("h2", title);
}

function replaceContainerContent(title, elements) {
    const targetEl = findElementByTitle(title);
    if (!targetEl) return;
    targetEl.childNodes?.forEach((el) => el?.remove());
    elements.forEach((el) => {
        if (el) targetEl.appendChild(el);
    });
}

async function initializeItemParams() {
    document.querySelector('a[data-analytics-interaction-custom-url="#parametry"]')?.click();
    await new Promise((r) => setTimeout(r, 200));
    const paramsModal = document.querySelector('div[aria-labelledby="Parametry"]');
    if (paramsModal?.parentElement?.parentElement) {
        paramsModal.parentElement.parentElement.hidden = true;
    }
    document.querySelector('a[href="#parametry"]')?.parentElement?.parentElement?.remove();
    await new Promise((r) => setTimeout(r, 500));
    document.querySelector('div[data-box-name="Sidebar Parameters Container"] button[aria-label="Zamknij"]')?.click();
}

function getItemData() {
    const rawJson = [...document.querySelectorAll('script[type="application/json"]')]
        .map((el) => el.textContent || el.innerHTML || "")
        .find((text) =>
            text.includes('"dynamicBottomMargin"') ||
            text.includes('"keyParameters"') ||
            text.includes(':"Stan"')
        );

    if (!rawJson) {
        return null;
    }

    let parsed;
    try {
        parsed = JSON.parse(rawJson);
    } catch (e) {
        console.error("Nie udało się sparsować JSON-a", e);
        return null;
    }

    let items = [];

    if (Array.isArray(parsed.groups)) {
        items = parsed.groups.flatMap((group) => [
            ...(group.firstSubGroup || []),
            ...(group.secondSubGroup || [])
        ]).map((item) => ({
            name: item.name || "",
            value: item.value?.name || "",
            description: item.value?.description || "",
            url: item.value?.url || ""
        }));
    } else {
        if (Array.isArray(parsed.keyParameters)) {
            items.push(...parsed.keyParameters.map((p) => ({
                name: p.name || "",
                value: p.value || "",
                description: "",
                url: ""
            })));
        }

        if (parsed.brand) {
            items.push({
                name: (parsed.brand.label || "Marka").replace(/:$/, ""),
                value: parsed.brand.name || "",
                description: "",
                url: parsed.brand.url || ""
            });
        }

        if (parsed.rating) {
            items.push({
                name: "Ocena",
                value: `${parsed.rating.averageLabel || parsed.rating.ratingValue || ""} (${parsed.rating.countLabel || parsed.rating.ratingCountLabel || ""})`,
                description: "",
                url: ""
            });
        }

        if (parsed.productPopularityLabel?.label) {
            items.push({
                name: "Popularność",
                value: parsed.productPopularityLabel.label,
                description: parsed.productPopularityLabel.tooltipText || "",
                url: ""
            });
        }

        if (parsed.offerName) {
            items.push({
                name: "Nazwa oferty",
                value: parsed.offerName,
                description: "",
                url: ""
            });
        }

        if (parsed.productName) {
            items.push({
                name: "Nazwa produktu",
                value: parsed.productName,
                description: "",
                url: ""
            });
        }
    }

    if (!items.length) {
        return null;
    }

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = ".875rem";
    table.style.lineHeight = "1.45";
    table.style.margin = "12px 0";
    table.style.background = "#fff";

    const appendParamCells = (tr, item, options = {}) => {
        const {rowBg = "#fff"} = options;
        const tdName = document.createElement("td");
        tdName.textContent = item?.name || "";
        tdName.style.border = "none";
        tdName.style.padding = "8px 10px";
        tdName.style.verticalAlign = "top";
        tdName.style.fontWeight = "400";
        tdName.style.color = "#757575";
        tdName.style.width = "25%";
        tdName.style.background = rowBg;


        const tdValue = document.createElement("td");
        tdValue.style.border = "none";
        tdValue.style.padding = "8px 10px";
        tdValue.style.verticalAlign = "top";
        tdValue.style.fontWeight = "400";
        tdValue.style.width = "75%";
        tdValue.style.background = rowBg;


        if (!item) {
            tr.appendChild(tdName);
            tr.appendChild(tdValue);
            return;
        }

        if (item.url) {
            const a = document.createElement("a");
            a.textContent = item.value;
            a.href = item.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.style.color = "#008673";
            a.addEventListener("mouseenter", () => {
                a.style.color = "#136355";
            });
            a.addEventListener("mouseleave", () => {
                a.style.color = "#008673";
            });
            if (item.description) a.title = item.description;
            tdValue.appendChild(a);
        } else {
            const span = document.createElement("span");
            span.textContent = item.value;
            if (item.description) {
                span.title = item.description;
                span.style.cursor = "help";
                span.style.textDecoration = "underline dotted";
            }
            tdValue.appendChild(span);
        }

        tr.appendChild(tdName);
        tr.appendChild(tdValue);
    };

    for (let i = 0; i < items.length; i += 1) {
        const tr = document.createElement("tr");
        const rowIndex = i;
        const rowBg = rowIndex % 2 === 0 ? "#F6F7F8" : "#fff";
        appendParamCells(tr, items[i], {rowBg});
        table.appendChild(tr);
    }

    table.style.fontFamily = "\"Open Sans\", sans-serif";
    return table;
}

function buildHeader(text) {
    const header = document.createElement("h2");
    header.textContent = text;
    header.style.fontFamily = "Calibri, Arial, sans-serif";
    header.style.fontSize = "1.5em";
    header.style.fontWeight = "500";
    return header;
}

async function moveItemParams() {
    await initializeItemParams();

    if (simplyMoveParams()) {
        return;
    }
    const h2 = buildHeader("Parametry");
    let table = getItemData();
    if (!table) {
        table = document.querySelector("div.app-container > table");
        if (table) {
            table.hidden = false;
        }
    }
    replaceContainerContent("Podobne oferty", [h2, table]);
    findElementByTagNameAndText("span", "Sponsorowane")?.parentElement?.remove();
}

function simplyMoveParams() {
    let paramsModal = document.querySelector('div[data-box-name="Parameters Bar Container"]')
    let paramsBar = document.querySelector('div[data-box-name="Product Parameter Bar"]')
    let descriptionBar = document.querySelector('div[data-box-name="Product Description Bar"]')

    if (paramsModal && paramsBar && descriptionBar) {
        paramsBar.replaceChildren(paramsModal)
        setOrderInSameParent(paramsBar, descriptionBar)
        return true
    }
    return false
}

function setOrderInSameParent(el1, el2) {
    if (!el1 || !el2) return;
    const parent = el1.parentNode;
    if (!parent || parent !== el2.parentNode) return;

    if (el1.compareDocumentPosition(el2) & Node.DOCUMENT_POSITION_FOLLOWING) {
        return;
    }
    parent.insertBefore(el1, el2);
}

function moveProductDescription(sections) {
    let el = document.querySelector('div[data-box-name="Sidebar Description"]');
    if (el && sections.proposalsForYou) {
        replaceContainerContent("Propozycje dla Ciebie", [el]);
        document.querySelector('div[data-box-name="Product Description Bar"]')?.remove();
    } else {
        el = document.querySelector('div[itemprop="description"]')
        document.querySelector('div[data-box-name="Product Description Bar"]')?.replaceChildren(el)
    }
}

function removeMovedContainers() {
    document.querySelectorAll('a[name="product-info-content-columns"]')
        .forEach((el) => el.parentElement?.remove());
}

function removeContainersByTitles(titles) {
    const removed = [];
    titles.forEach((title) => {
        const el = findElementByTitle(title);
        if (el) {
            el.remove();
            removed.push(title);
        }
    });
    return removed;
}

// Mapowanie tytułu <h2> (jak w titlesToRemove niżej) -> klucz sekcji z
// DEFAULT_PRODUCT_SECTIONS. Używane wyłącznie do ustalenia, które sekcje
// FAKTYCZNIE coś usunęły (a nie tylko są włączone w configu), żeby popup
// mógł pogrubić właściwe pozycje w podmenu - patrz appliedSections niżej
// i REPORT_APPLIED_SECTIONS w background.js.
const TITLE_TO_SECTION_KEY = {
    'Inni klienci oglądali również': 'othersAlsoViewed',
    'Propozycje z gwarancją najniższej ceny': 'lowestPriceProposals',
    'Zamów zestaw w jednej przesyłce': 'singleShipmentSetOrder',
    'Zamów w jednej przesyłce': 'singleShipmentOrder',
    'Propozycje dla Ciebie': 'proposalsForYou',
    'Odkryj podobne produkty': 'discoverSimilarProducts',
    'Uzupełnij swój zakup': 'completeYourPurchase',
    'Ostatnio przeglądane': 'lastViewed',
    'Oferty zainspirowane Twoimi wyszukiwaniami': 'inspiredBySearches',
    'Opinie o produkcie': 'collapsedReviews',
    'Podobne oferty': 'similarOffers',
    'Co powiesz na...?': 'infiniteFeed'
};

// Klucze sekcji, które removeAds usuwa TRWALE z DOM (przez
// findElementByTitle+.remove() albo przez querySelector+.remove() na
// atrybucie, bez towarzyszącej reguły CSS) - w odróżnieniu od sekcji
// czysto CSS-owych (product-page-instant-hide.css), których element
// pozostaje w DOM (tylko ukryty), więc może być sprawdzony ponownie przy
// każdym przebiegu removeAds. Używane do seedowania applied w removeAds
// (patrz komentarz tam) - patrz też ACV_INSTANT_HIDE_CSS_CLASSES na
// początku pliku dla pełnej listy sekcji CSS-owych.
const TEXT_AND_PERMANENT_SECTION_KEYS = new Set([
    ...Object.values(TITLE_TO_SECTION_KEY),
    'othersAlsoViewed',
    'ourProductSeries'
]);

// Ostatni zbiór faktycznie zastosowanych (usuniętych z DOM) kluczy sekcji.
// Aktualizowany przy każdym przebiegu removeAds, odczytywany przez
// reportAppliedSections po debounce w observeAndRemoveAds.
let acvLastAppliedSections = new Set();

// Czy na tej stronie usunięto już jakąkolwiek reklamę (sekcja ads). Reklamy są usuwane
// z DOM tylko raz, więc przy kolejnych przebiegach removeAds nie ma już czego usuwać -
// bez tej flagi pogrubienie "Reklamy" znikało po pierwszej mutacji DOM.
let acvAdsRemovedOnPage = false;

// Domyślnie rozwija zwinięty panel "Opis" (funkcja "Domyślne rozwijanie
// opisu" / descriptionExpanded). W odróżnieniu od reszty sekcji NIC tu nie
// jest usuwane z DOM - zamiast tego symulujemy kliknięcie w przycisk-nagłówek
// "Opis" (data-analytics-interaction-value="descriptionExpandTop"), żeby
// uruchomić natywną logikę Allegro odpowiedzialną za rozwinięcie panelu
// (zmiana aria-expanded/aria-hidden/inert, ewentualne doładowanie treści,
// animacja). Ręczne ustawianie tych atrybutów z zewnątrz byłoby kruche i
// mogłoby rozjechać się z wewnętrznym stanem Reacta na stronie Allegro.
//
// WAŻNE: samo DOMContentLoaded NIE oznacza jeszcze, że React Allegro
// zakończył hydratację i podpiął handler kliknięcia do przycisku. To jest
// szczególnie widoczne przy zwykłym odświeżeniu strony: jeden zbyt wczesny
// syntetyczny klik może trafić w jeszcze "niezhydratowany" SSR-owy button i
// nic nie zrobić. Przy otwartych DevTools timing ładowania zmienia się na
// tyle, że ten sam kod przypadkiem trafia już po hydratacji.
//
// Dlatego klikamy dopiero po znalezieniu przycisku, a następnie przez krótki
// czas sprawdzamy faktyczny stan panelu. Jeśli Allegro jeszcze nie obsługuje
// zdarzenia, ponawiamy próbę. Nie ustawiamy atrybutów ręcznie i nie klikamy
// ponownie tego samego elementu, dopóki nie zakończy się poprzednia próba.
//
// Referencja do OSTATNIO klikniętego przycisku "Opis" pozostaje przydatna,
// ale nie jest już sama w sobie blokadą kolejnego kliknięcia. Po prostu
// identyfikuje element, dla którego trwa oczekiwanie na odpowiedź Reacta.
let acvLastDescriptionButton = null;
let acvDescriptionUserInteracted = false;
let acvDescriptionExpansionTimer = null;
let acvDescriptionExpansionCheckTimer = null;
let acvDescriptionExpansionInFlight = false;
let acvDescriptionExpansionDeadline = 0;

const ACV_DESCRIPTION_EXPANSION_RETRY_MS = 100;
const ACV_DESCRIPTION_EXPANSION_TIMEOUT_MS = 8000;
const ACV_DESCRIPTION_EXPANSION_CHECK_INTERVAL_MS = 25;
const ACV_DESCRIPTION_EXPANSION_CHECK_TIMEOUT_MS = 1000;

function cancelDescriptionExpansionRetry() {
    if (acvDescriptionExpansionTimer !== null) {
        clearTimeout(acvDescriptionExpansionTimer);
        acvDescriptionExpansionTimer = null;
    }
    if (acvDescriptionExpansionCheckTimer !== null) {
        clearTimeout(acvDescriptionExpansionCheckTimer);
        acvDescriptionExpansionCheckTimer = null;
    }
    acvDescriptionExpansionInFlight = false;
    acvDescriptionExpansionDeadline = 0;
}

document.addEventListener('click', (event) => {
    if (event.isTrusted && event.target?.closest?.('button[data-analytics-interaction-value="descriptionExpandTop"], button[data-analytics-interaction-value="descriptionCollapseTop"], button[data-analytics-interaction-value="descriptionExpandBottom"], button[data-analytics-interaction-value="descriptionCollapseBottom"]')) {
        // Użytkownik ma pierwszeństwo przed automatycznym ustawieniem
        // domyślnego stanu. Anulujemy też ewentualną oczekującą próbę,
        // żeby wtyczka nie "odklikała" świadomej decyzji użytkownika.
        acvDescriptionUserInteracted = true;
        cancelDescriptionExpansionRetry();
    }
}, true);

function getDescriptionTopButton() {
    return document.querySelector(
        'button[data-analytics-interaction-value="descriptionExpandTop"], button[data-analytics-interaction-value="descriptionCollapseTop"]'
    );
}

// Sprawdza rzeczywisty stan sekcji, a nie tylko pojedynczy atrybut buttona.
// Przy przejściu stanu Allegro potrafi przez chwilę aktualizować atrybuty
// w różnych tickach, więc uznajemy panel za rozwinięty, gdy mamy:
//   - przycisk "Collapse" albo
//   - panel "full" z aria-hidden="false" i bez inert.
function isDescriptionExpanded(button = getDescriptionTopButton()) {
    if (!button) return false;

    if (button.getAttribute('data-analytics-interaction-value') === 'descriptionCollapseTop') {
        return true;
    }

    const fullPanel = document.querySelector('[data-description-panel="full"]');
    return fullPanel?.getAttribute('aria-hidden') === 'false' && !fullPanel.hasAttribute('inert');
}

function scheduleDescriptionExpansionRetry(delay = ACV_DESCRIPTION_EXPANSION_RETRY_MS) {
    if (acvDescriptionUserInteracted || acvDescriptionExpansionTimer !== null) {
        return;
    }

    if (!acvDescriptionExpansionDeadline) {
        acvDescriptionExpansionDeadline = Date.now() + ACV_DESCRIPTION_EXPANSION_TIMEOUT_MS;
    }

    if (Date.now() >= acvDescriptionExpansionDeadline) {
        acvDescriptionExpansionDeadline = 0;
        return;
    }

    acvDescriptionExpansionTimer = setTimeout(() => {
        acvDescriptionExpansionTimer = null;
        expandDescriptionIfNeeded();
    }, delay);
}

function dispatchDescriptionExpandInteraction(button) {
    // Sam button.click() powinien wystarczyć po hydratacji, ale zostawiamy
    // tę samą sekwencję zdarzeń wskaźnika, która była używana wcześniej i
    // była pomocna dla natywnej logiki Allegro. Kluczowa zmiana względem
    // poprzedniej wersji to NIE sekwencja zdarzeń, tylko ich timing - teraz
    // po kliknięciu czekamy na faktyczną zmianę stanu i w razie potrzeby
    // ponawiamy próbę.
    const rect = button.getBoundingClientRect();
    const pointOpts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.x + rect.width / 2,
        clientY: rect.y + rect.height / 2
    };

    button.dispatchEvent(new PointerEvent('pointerdown', pointOpts));
    button.dispatchEvent(new MouseEvent('mousedown', pointOpts));
    button.dispatchEvent(new PointerEvent('pointerup', pointOpts));
    button.dispatchEvent(new MouseEvent('mouseup', pointOpts));
    button.dispatchEvent(new MouseEvent('click', pointOpts));
}

function waitForDescriptionExpansion(button) {
    const startedAt = Date.now();

    const check = () => {
        acvDescriptionExpansionCheckTimer = null;

        if (acvDescriptionUserInteracted) {
            cancelDescriptionExpansionRetry();
            return;
        }

        // React może wymienić button/panel na nowe węzły podczas hydratacji
        // lub rerenderu. Wtedy bieżąca próba traci sens i zaczynamy od nowa.
        if (!button.isConnected || isDescriptionExpanded(button)) {
            acvDescriptionExpansionInFlight = false;
            if (isDescriptionExpanded(button)) {
                // expandDescriptionIfNeeded() uruchamia próbę asynchroniczną,
                // więc bieżący przebieg removeAds() mógł jeszcze nie zdążyć
                // oznaczyć descriptionExpanded jako zastosowanego. Aktualizuj
                // ten stan tutaj, gdy faktycznie mamy potwierdzone rozwinięcie.
                acvLastAppliedSections.add('descriptionExpanded');
                reportAppliedSections();
                cancelDescriptionExpansionRetry();
            } else {
                scheduleDescriptionExpansionRetry(0);
            }
            return;
        }

        if (Date.now() - startedAt < ACV_DESCRIPTION_EXPANSION_CHECK_TIMEOUT_MS) {
            acvDescriptionExpansionCheckTimer = setTimeout(check, ACV_DESCRIPTION_EXPANSION_CHECK_INTERVAL_MS);
            return;
        }

        // Upłynął czas na odpowiedź. To typowy przypadek, gdy przycisk był
        // jeszcze przed hydratacją Reacta. Zwolnijmy blokadę i spróbujmy
        // ponownie po krótkiej chwili.
        acvDescriptionExpansionInFlight = false;
        scheduleDescriptionExpansionRetry();
    };

    acvDescriptionExpansionCheckTimer = setTimeout(check, ACV_DESCRIPTION_EXPANSION_CHECK_INTERVAL_MS);
}

// Zwraca true tylko wtedy, gdy panel faktycznie jest rozwinięty. Gdy panel
// jeszcze nie istnieje albo React nie zdążył jeszcze obsłużyć kliknięcia,
// uruchamiamy kontrolowaną serię prób w krótkim oknie po załadowaniu strony.
function expandDescriptionIfNeeded() {
    if (acvDescriptionUserInteracted) {
        return false;
    }

    const button = getDescriptionTopButton();
    if (!button) {
        scheduleDescriptionExpansionRetry();
        return false;
    }

    // Nowy button (np. po rerenderze/lazy-loadzie) dostaje własne okno prób.
    if (button !== acvLastDescriptionButton) {
        acvDescriptionExpansionDeadline = Date.now() + ACV_DESCRIPTION_EXPANSION_TIMEOUT_MS;
        acvDescriptionExpansionInFlight = false;
    }

    if (isDescriptionExpanded(button)) {
        cancelDescriptionExpansionRetry();
        return true;
    }

    if (acvDescriptionExpansionInFlight) {
        return false;
    }

    acvLastDescriptionButton = button;
    acvDescriptionExpansionInFlight = true;
    dispatchDescriptionExpandInteraction(button);
    waitForDescriptionExpansion(button);
    return false;
}

function removeAds(sectionSettings) {
    const sections = normalizeProductSections(sectionSettings);
    // Sekcje tekstowe (TITLE_TO_SECTION_KEY) i inne usuwane trwale z DOM
    // (othersAlsoViewed przez atrybut, ourProductSeries) raz potwierdzone
    // jako zastosowane ZOSTAJĄ zastosowane na stałe dla tej strony -
    // element po .remove() fizycznie znika z DOM, więc żaden kolejny
    // przebieg removeAds nie ma już jak tego ponownie potwierdzić przez
    // findElementByTitle/querySelector. Stąd start od poprzedniego wyniku,
    // nie od pustego zbioru. Sekcje CSS-owe (allegroPayCoupons,
    // askOnPage, brandInfo,
    // upsellAiSuggestion) i descriptionExpanded są SPRAWDZANE NA ŻYWO
    // niżej i same decydują, czy zostać w zbiorze czy nie (ich element
    // wciąż istnieje w DOM, tylko ukryty przez CSS, więc każdy przebieg
    // może go ponownie znaleźć - stąd tamte nie są tu seedowane, żeby np.
    // "O marce" na ofercie bez marki nie zostało błędnie na stałe
    // zapamiętane jako zastosowane).
    const applied = new Set(
        [...acvLastAppliedSections].filter((key) => TEXT_AND_PERMANENT_SECTION_KEYS.has(key))
    );

    if (!isItemParamsVisible()) {
        findElementByTitle('Opinie o produkcie')?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.remove();
    }

    // WYŁĄCZNIE sekcje z włączonym checkboxem - żadnych bezwarunkowych
    // tytułów. "Co powiesz na...?" = infiniteFeed (CSS + ewentualnie
    // tytuł poniżej). Wcześniejszy bezwarunkowy titlesToRemove z tym
    // tytułem usuwał sekcję nawet gdy infiniteFeed było wyłączone
    // (objaw: włączenie samej "Sugestia AI" chowało też "Co powiesz na...?").
    const titlesToRemove = [];
    if (sections.infiniteFeed) titlesToRemove.push('Co powiesz na...?');
    if (sections.collapsedReviews) titlesToRemove.push('Opinie o produkcie');
    if (sections.similarOffers) titlesToRemove.push('Podobne oferty');
    if (sections.othersAlsoViewed) titlesToRemove.push('Inni klienci oglądali również');
    if (sections.lowestPriceProposals) titlesToRemove.push('Propozycje z gwarancją najniższej ceny');
    if (sections.singleShipmentSetOrder) titlesToRemove.push('Zamów zestaw w jednej przesyłce');
    if (sections.singleShipmentOrder) titlesToRemove.push('Zamów w jednej przesyłce');
    if (sections.ourProductSeries) titlesToRemove.push('Nasze serie produktów');
    if (sections.proposalsForYou) titlesToRemove.push('Propozycje dla Ciebie');
    if (sections.discoverSimilarProducts) titlesToRemove.push('Odkryj podobne produkty');
    if (sections.completeYourPurchase) titlesToRemove.push('Uzupełnij swój zakup');
    if (sections.lastViewed) titlesToRemove.push('Ostatnio przeglądane');
    if (sections.inspiredBySearches) titlesToRemove.push('Oferty zainspirowane Twoimi wyszukiwaniami');
    const removedTitles = removeContainersByTitles(titlesToRemove);
    removedTitles.forEach((title) => {
        const key = TITLE_TO_SECTION_KEY[title];
        if (key) applied.add(key);
    });

    // Bloki reklamowe DSS (nie mylić z karuzelami rekomendacji produktów).
    // Sterowane checkboxem "Reklamy (DSS i banerowe)" (ads) - osobnym od
    // "Reklama pod stopką" (sekcja "Różne", slot parallax), bo to inny rodzaj
    // reklamy (Allegro Ads DSS wstawiane w treść strony, a nie zewnętrzny
    // slot Google Ad Manager pod stroną).
    let acvAdsRemoved = false;
    if (sections.ads) {
        document.querySelectorAll('div[data-box-name="template-with-offers"]').forEach((el) => {
            // Tylko gdy wygląda na reklamę (kontener DSS / ads), nie ruszamy
            // przypadkowych template-with-offers bez kontekstu reklamowego.
            if (el.closest('[data-box-name*="ads"], [data-box-name*="dss"]') ||
                el.querySelector('[data-box-name*="ads"], [data-box-name*="dss"]') ||
                /ads|dss|reklama/i.test(el.getAttribute('data-box-name') || '')) {
                el.remove();
                acvAdsRemoved = true;
                return;
            }
            // Fallback: historycznie template-with-offers na ofercie = reklama.
            // Usuwamy tylko bezpośredni kontener o tej nazwie, bez rodzica.
            el.remove();
            acvAdsRemoved = true;
        });
    }
    if (sections.othersAlsoViewed) {
        const el = document.querySelector('div[data-box-name="Container carousel_reco_same_seller"]');
        if (el) {
            el.remove();
            applied.add('othersAlsoViewed');
        }
    }
    if (sections.ourProductSeries) {
        // Prawidłowy atrybut kontenera to "Product series" (nie "Product
        // Series Title" - to była pomyłka w oryginalnym kodzie, przez którą
        // ta sekcja nigdy nie była faktycznie usuwana). Usuwamy najbliższy
        // nadrzędny .opbox-sheet-wrapper, żeby skasować całą sekcję razem
        // z nagłówkiem "Nasze serie produktów" (h3 - nie h2, więc wariant
        // tekstowy w titlesToRemove/findElementByTitle też go nie łapał),
        // a nie tylko wewnętrzny kontener z samymi kafelkami logo, co
        // zostawiłoby osierocony, pusty nagłówek na stronie.
        //
        // Zwykle to CSS (product-page-instant-hide.css) ukrywa tę sekcję
        // pierwszy, zanim JS w ogóle zdąży się uruchomić - element wtedy
        // nadal ISTNIEJE w DOM (tylko display:none), więc poniższy
        // querySelector nadal go znajdzie i .remove() zadziała bez zmian.
        const el = document.querySelector('div[data-box-name="Product series"]')
            ?.closest('.opbox-sheet-wrapper');
        if (el) {
            el.remove();
            applied.add('ourProductSeries');
        }
    }
    // Reklama wideo DSS - ten sam checkbox. CSS ją tylko ukrywa (display:none
    // nie zatrzymuje ładowania/odtwarzania <video>), więc usuwamy z DOM.
    if (sections.ads) {
        document.querySelectorAll('div[data-prototype-id="allegro.ads.dss.video"]').forEach((el) => {
            el.remove();
            acvAdsRemoved = true;
        });
    }
    // Baner DSS po kontenerze (nie po img) - bez tego zostawał sam przycisk
    // "Sponsorowane", gdy grafika nie miała alt="Reklama banerowa".
    if (sections.ads) {
        document.querySelectorAll('div[data-prototype-id="allegro.ads.dss.banner"]').forEach((el) => {
            el.remove();
            acvAdsRemoved = true;
        });
    }
    // Baner Google pod ceną (strony ogłoszeń) - ten sam checkbox. Usuwamy z DOM,
    // żeby nie ładować reklamy (display:none samo tego nie zatrzymuje).
    if (sections.ads) {
        document.querySelectorAll('div[data-prototype-id="allegro.advertisement.slot.underPrice"]').forEach((el) => {
            el.remove();
            acvAdsRemoved = true;
        });
    }
    // Reklamy banerowe - ten sam checkbox co reklamy DSS wyżej.
    // Celujemy w najbliższy kontener reklamy, NIE w 3× parentElement
    // (to mogło kiedyś wyciąć zbyt duży blok layoutu).
    if (sections.ads) {
        document.querySelectorAll('img[alt="Reklama banerowa"]').forEach((el) => {
            const adRoot = el.closest(
                '[data-box-name="banner-container"],' +
                '[data-box-name="allegro.ads.dss.banner"],' +
                '[data-box-name*="ads.dss"],' +
                '.opbox-sheet-wrapper'
            );
            if (adRoot || el.parentElement) {
                (adRoot || el.parentElement).remove();
                acvAdsRemoved = true;
            }
        });
    }
    if (acvAdsRemoved) acvAdsRemovedOnPage = true;
    if (acvAdsRemovedOnPage) {
        applied.add('ads');
    }
    // Ankieta produktu - tylko gdy włączony checkbox productSurvey.
    if (sections.productSurvey) {
        document.querySelectorAll('div[aria-labelledby="P0-0"]').forEach(el => el?.parentElement?.remove());
        document.querySelectorAll('[data-analytics-click-label="showProductSurvey"]').forEach(el => el.remove());
    }

    // Sekcje ukrywane wyłącznie przez CSS (nie mają odpowiadającego usuwania
    // w JS) - "zastosowane" oznacza tu po prostu, że element o danym
    // atrybucie istnieje na stronie (jest ukryty przez CSS niezależnie od
    // tego, kiedy ten kod się wykona).
    if (sections.allegroPayCoupons && document.querySelector('div[data-box-name="allegroPay container"]')) {
        applied.add('allegroPayCoupons');
    }
    if (sections.askOnPage && document.querySelector('div[data-box-name^="allegro.ask.on.page.container"]')) {
        applied.add('askOnPage');
    }
    if (sections.brandInfo && document.querySelector('div[data-box-name="Bars"]')) {
        applied.add('brandInfo');
    }
    if (sections.upsellAiSuggestion && document.querySelector('div[data-box-name="Upsell Container"]')) {
        applied.add('upsellAiSuggestion');
    }
    if (sections.productSurvey && document.querySelector('div[data-box-name="surveyContainer"]')) {
        applied.add('productSurvey');
    }
    // Także sam zastępnik lazy (infinite-feed.lazy.container): ukryty razem z sekcją,
    // więc właściwy wrapper może się w ogóle nie doładować.
    if (sections.infiniteFeed && document.querySelector('div[data-box-name="infinite-feed.wrapper"], div[data-box-name="infinite-feed.lazy.container"]')) {
        applied.add('infiniteFeed');
    }
    // Szukana oferta jest nieaktualna (tylko zakończona oferta): karuzela u góry
    // (Container carousel reco ended) i jej drugi egzemplarz na dole (Container
    // carousel_reco_ended, także wariant -placeholder). Ukrywa wyłącznie CSS.
    // Polecane produkty (karuzela z zakładkami, box tabs_bpg_novelty_container):
    // ukrywa wyłącznie CSS, tu tylko wykrycie elementu na stronie.
    if (sections.disableGalleryHover && window.__acvGalleryHoverDisabled) {
        applied.add('disableGalleryHover');
    }
    if (sections.recommendedProducts && document.querySelector('div[data-box-name="tabs_bpg_novelty_container"]')) {
        applied.add('recommendedProducts');
    }
    if (sections.endedOfferReco && document.querySelector('div[data-box-name="Container carousel reco ended"], div[data-box-name^="Container carousel_reco_ended"]')) {
        applied.add('endedOfferReco');
    }
    if (sections.lokalnieOffers && document.querySelector('div[data-box-name="Lokalnie offers container"]')) {
        applied.add('lokalnieOffers');
    }
    if (sections.descriptionExpanded && expandDescriptionIfNeeded()) {
        applied.add('descriptionExpanded');
    }

    scheduleEmptyOpboxWrappersCleanup();

    // ZASTĄPIENIE, nie dołożenie - applied to pełny, świeży wynik TEGO
    // przebiegu removeAds. Gdyby zamiast tego tylko dokładać klucze do
    // acvLastAppliedSections, raz wykryta sekcja (np. przy wcześniejszym
    // przebiegu MutationObserver, zanim strona w pełni się doładowała)
    // zostałaby oznaczona jako "zastosowana" już na stałe - nawet gdyby
    // faktycznie zniknęła z DOM albo w ogóle nie występowała na tej
    // konkretnej ofercie. Był to realny bug (np. "O marce" pokazywane
    // jako zastosowane na ofertach bez tej sekcji).
    acvLastAppliedSections = applied;
    return applied;
}

// Po usunięciu zawartości sekcji (np. jej wewnętrznego kontenera z
// karuzelą, gdy sekcja nie miała własnego <h2> do złapania przez
// findElementByTitle) zostaje czasem pusty, osierocony
// .opbox-sheet-wrapper z marginesem (margin-top/margin-bottom), co
// widać jako pusty odstęp na stronie. Sprzątamy to generycznie - dla
// KAŻDEJ takiej sekcji, obecnej i przyszłej - zamiast dopisywać kolejne
// selektory ręcznie za każdym razem.
//
// "Pusty" = brak widocznego tekstu I brak żadnego realnego obrazka.
// Allegro zostawia w takich miejscach analityczne piksele-śledzące
// (1x1px, height:1px, position:relative, z-index:-1) - te NIE liczą się
// jako treść, bo są celowo niewidoczne (position:relative + ujemny
// z-index + brak szerokości/tła to standardowy wzorzec pikseli
// analitycznych, nie prawdziwej zawartości).
//
// Kilka przebiegów (do 5) obsługuje zagnieżdżone puste wrappery
// (pusty wrapper w pustym wrapperze) - po usunięciu najgłębszego
// pustego węzła, jego rodzic może stać się pusty dopiero wtedy.
// Osobny, krótszy niż główny debounce (queueMicrotask) timer specyficznie
// dla removeEmptyOpboxWrappers - patrz komentarz przy wywołaniu w
// removeAds. 250ms to kompromis: wystarczająco krótkie, żeby sprzątanie
// wciąż wyglądało na natychmiastowe, wystarczająco długie, żeby Allegro
// zdążyło wstawić <h2>/kafelki do stopniowo renderowanej sekcji zanim
// uznamy jej pusty w danej chwili wrapper za osierocony.
let acvEmptyOpboxCleanupTimer = null;

function scheduleEmptyOpboxWrappersCleanup() {
    if (acvEmptyOpboxCleanupTimer !== null) {
        clearTimeout(acvEmptyOpboxCleanupTimer);
    }
    acvEmptyOpboxCleanupTimer = setTimeout(() => {
        acvEmptyOpboxCleanupTimer = null;
        removeEmptyOpboxWrappers();
    }, 250);
}

function removeEmptyOpboxWrappers() {
    const isAnalyticsPixel = (el) => {
        const style = el.getAttribute('style') || '';
        return /height:\s*1px/.test(style) && /position:\s*relative/.test(style) && /z-index:\s*-1/.test(style);
    };

    for (let pass = 0; pass < 5; pass++) {
        const wrappers = document.querySelectorAll('.opbox-sheet-wrapper');
        let removedAny = false;

        // Wzorzec rozpoznający placeholdery lazy-load Allegro (potwierdzone
        // w praktyce: "soap lazy placeholder", "carousel_lazy_placeholder_2",
        // "infinite-feed.lazy.spinner" itp.) - te są celowo puste do czasu
        // dociągnięcia prawdziwej treści (np. karuzeli "Uzupełnij swój
        // zakup"), więc nie są osieroconymi wrapperami do sprzątania, tylko
        // normalnym stanem przejściowym.
        const lazyPlaceholderPattern = /lazy|placeholder/i;

        wrappers.forEach((wrapper) => {
            // Modal / dialog – treść dogrywana po otwarciu.
            if (wrapper.closest('[role="dialog"]')) return;

            // Placeholder lazy-load - sprawdzamy TYLKO atrybuty na samym
            // wrapperze i jego bezpośrednim dziecku (nie całe poddrzewo -
            // to byłoby znów zbyt szerokie, bo prawie każdy fragment
            // strony ma gdzieś głębiej jakiś data-box-name).
            const directBoxNameHolder = wrapper.matches('[data-box-name], [data-placeholder-for]')
                ? wrapper
                : wrapper.querySelector(':scope > [data-box-name], :scope > * > [data-box-name], :scope [data-placeholder-for]');
            const boxName = directBoxNameHolder?.getAttribute('data-box-name') || '';
            const hasPlaceholderFor = !!wrapper.querySelector('[data-placeholder-for]');
            // class="lazyload" na samym wrapperze lub jego bezpośrednim
            // dziecku - potwierdzony w praktyce znacznik Allegro dla
            // węzła, który AKTYWNIE dociąga zagnieżdżoną treść (np.
            // kolejny poziom karuzeli produktów). Sprawdzamy tylko 1
            // poziom w głąb (nie całe poddrzewo), żeby nie chronić zbyt
            // szeroko - podobnie jak przy data-box-name wyżej.
            const hasLazyloadClass = wrapper.matches('.lazyload')
                || wrapper.querySelector(':scope > .lazyload, :scope > * > .lazyload');
            if (lazyPlaceholderPattern.test(boxName) || hasPlaceholderFor || hasLazyloadClass) return;

            const hasText = (wrapper.textContent || '').trim().length > 0;
            if (hasText) return;

            const hasRealImage = Array.from(wrapper.querySelectorAll('img, picture, svg')).some((img) => {
                const pixelAncestor = img.closest('[style]');
                return !(pixelAncestor && isAnalyticsPixel(pixelAncestor));
            });
            if (hasRealImage) return;

            // Brak tekstu, brak obrazka, brak markerów sekcji – osierocony
            // wrapper po naszym celowym .remove().
            wrapper.remove();
            removedAny = true;
        });

        if (!removedAny) break;
    }
}

// Zamiast odpytywania co 1 sekundę (setInterval), obserwujemy zmiany w
// drzewie DOM i uruchamiamy removeAds() natychmiast po każdej partii zmian.
// Allegro (SPA) dogrywa sekcje asynchronicznie/leniwie przy scrollu, więc
// MutationObserver łapie moment ich pojawienia się dużo szybciej niż stałe
// opóźnienie ~1s, jednocześnie działając dla WSZYSTKICH elementów w
// removeAds - zarówno tych po stałym atrybucie, jak i po tekście nagłówka
// (których nie da się objąć samym CSS, bo CSS nie ma odpowiednika
// :contains()).
//
// Debounce (queueMicrotask + prosty throttle) zapobiega uruchamianiu
// removeAds dziesiątki razy na sekundę przy dużej liczbie mutacji naraz
// (np. przy pierwszym renderze strony) - removeAds i tak przelicza całą
// stronę na nowo za każdym wywołaniem, więc łączenie wielu mutacji w jedno
// wywołanie jest tańsze bez utraty szybkości reakcji odczuwalnej przez
// użytkownika (opóźnienie rzędu pojedynczych milisekund, nieporównywalnie
// mniejsze niż poprzednie 1000ms).
// Wysyła do background.js listę faktycznie zastosowanych (usuniętych z
// DOM) kluczy sekcji dla tej karty - patrz REPORT_APPLIED_SECTIONS w
// background.js. Używane wyłącznie do pogrubienia w popupie; błąd
// wysyłki (np. brak nasłuchującego background workera) jest nieszkodliwy
// i celowo ignorowany.
function reportAppliedSections() {
    const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : (typeof chrome !== "undefined" ? chrome.runtime : null);
    if (!runtimeApi?.sendMessage) return;
    try {
        const result = runtimeApi.sendMessage({
            type: "REPORT_APPLIED_SECTIONS",
            source: "product",
            sections: [...acvLastAppliedSections]
        });
        result?.catch?.(() => {});
    } catch (_) {
        // brak aktywnego listenera / kontekst rozszerzenia unieważniony - ignorujemy
    }
}

function observeAndRemoveAds(sections) {
    if (!document.body || typeof MutationObserver === "undefined") {
        // Zabezpieczenie na wypadek bardzo wczesnego wywołania (nie powinno
        // się zdarzyć, bo restoreOldLook czeka na DOMContentLoaded, ale
        // trzymamy się tej samej ostrożności co reszta kodu).
        setInterval(() => removeAds(sections), 1000);
        return;
    }

    let scheduled = false;
    const runRemoveAds = () => {
        scheduled = false;
        removeAds(sections);
        reportAppliedSections();
    };

    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        // queueMicrotask zamiast setTimeout(0) - odpala się jeszcze szybciej
        // (przed najbliższym repaintem), a i tak łączy w jedno wywołanie
        // wszystkie mutacje z tej samej klatki/tick'a zdarzeń.
        queueMicrotask(runRemoveAds);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function restoreOldLook(sectionSettings) {
    const sections = normalizeProductSections(sectionSettings);
    if (!isItemParamsVisible()) {
        await moveItemParams();
        moveProductDescription(sectionSettings);
        removeMovedContainers();
    }
    removeAds(sections);
    reportAppliedSections();
    observeAndRemoveAds(sections);
}

// Strona oferty z zakończoną sprzedażą (h6 "Sprzedaż zakończona"): pełny
// restoreOldLook (przenoszenie parametrów/opisu, itd.) NIE jest tu uruchamiany -
// strona ma inny układ. Wcześniej nie działał tu więc żaden JS, a tylko CSS
// z product-page-instant-hide.css (stąd sekcje wyszukiwane po tytule h2, np.
// "Propozycje dla Ciebie", nie znikały). Teraz na takiej stronie działa samo
// removeAds/observeAndRemoveAds, ale WYŁĄCZNIE dla kluczy z poniższej listy
// (pozostałe sekcje są tu traktowane jak wyłączone). Kolejne sekcje sprawdzone
// na zakończonej ofercie dopisywać do tej listy.
const ACV_OUTDATED_PAGE_SECTION_KEYS = new Set([
    'discoverSimilarProducts',
    'proposalsForYou',
    'ourProductSeries',
    'lastViewed',
    'lowestPriceProposals',
    'inspiredBySearches',
    // Funkcyjne (nie ukrywają elementu): descriptionExpanded klika przycisk
    // descriptionExpandTop (ten sam kod co na zwykłej ofercie), collapsedReviews
    // usuwa kartę z nagłówkiem "Opinie o produkcie" i histogramem (rodzic h2).
    'descriptionExpanded',
    'collapsedReviews',
    'endedOfferReco',
    // Reklamy (DSS, banerowe, baner pod ceną na ogłoszeniach) - bez przenoszenia układu.
    'ads',
    // Zachowanie galerii (nie ukrywanie): tu tylko znacznik do pogrubienia w popupie.
    'disableGalleryHover',
    // Ukrywane CSS-em; tu tylko wykrycie elementu (pogrubienie w popupie).
    'allegroPayCoupons'
]);

function restoreOutdatedLook(sectionSettings) {
    const sections = normalizeProductSections(sectionSettings);
    Object.keys(sections).forEach((key) => {
        if (!ACV_OUTDATED_PAGE_SECTION_KEYS.has(key)) sections[key] = false;
    });
    removeAds(sections);
    reportAppliedSections();
    observeAndRemoveAds(sections);
}

// ---------------------------------------------------------------------------
// "Kursor nie zmienia obrazów" (klucz disableGalleryHover): na stronie
// produktu najechanie na miniaturę w galerii (widok normalny i otwarta galeria)
// NIE zmienia obrazu głównego; zmienia go dopiero klik w miniaturę, a klik nie
// otwiera już galerii (galerię nadal otwiera klik w obraz główny).
// Ustalone z logu diagnostycznego: zmianę (po ~50 ms) uruchamia pointerover /
// mouseover na miniaturze, a klik w miniaturę w widoku normalnym otwiera galerię
// (w otwartej galerii klik nic nie robi).
// Powiększanie obrazu głównego po najechaniu (zoom 1.5x i przesuwanie przy ruchu
// myszy) wyłącza reguła CSS w product-page-instant-hide.css (klasa
// acv-disable-gallery-zoom z tego samego checkboxa), tylko przy zamkniętej galerii.
// Jak: listenery na window w fazie capture (przed kodem Allegro) zatrzymują
// zdarzenia najechania na miniaturę. Uwaga: React wylicza onMouseEnter przy
// przejściu między elementami z mouseout (relatedTarget = cel), dlatego
// blokujemy też mouseout/pointerout, których relatedTarget leży w miniaturze.
// Klik w miniaturę zatrzymujemy i wysyłamy do niej własne (isTrusted=false)
// zdarzenia pointerover/mouseover bez relatedTarget - kod Allegro traktuje je
// jak najechanie z zewnątrz i sam podmienia obraz. Własnych zdarzeń nie blokujemy.
function acvDisableGalleryHover() {
    if (window.__acvGalleryHoverDisabled) return;
    window.__acvGalleryHoverDisabled = true;

    const GALLERY = 'div[data-box-name="showoffer.gallery"]';
    // Miniatura zdjęcia (img .../s128/...) albo miniatura wideo (aria-label="Wideo" z ikoną
    // play action-common-play-button; uruchamia wideo w obszarze obrazu głównego).
    const isThumbButton = (button) => button?.tagName === "BUTTON" && (
        !!button.querySelector('img[src*="/s128/"]')
        || (button.getAttribute("aria-label") === "Wideo" && !!button.querySelector('img[src*="action-common-play-button"]'))
    );
    const thumbOf = (node) => {
        const button = node?.closest?.("button");
        return button && button.closest(GALLERY) && isThumbButton(button) ? button : null;
    };

    // Najechanie na miniaturę: zdarzenia "over" (cel w miniaturze) i "enter".
    ["pointerover", "mouseover", "pointerenter", "mouseenter"].forEach((type) => {
        window.addEventListener(type, (event) => {
            if (event.isTrusted && thumbOf(event.target)) event.stopImmediatePropagation();
        }, true);
    });
    // Przejście kursora na miniaturę z innego elementu (React liczy z "out").
    ["pointerout", "mouseout"].forEach((type) => {
        window.addEventListener(type, (event) => {
            if (event.isTrusted && thumbOf(event.relatedTarget)) event.stopImmediatePropagation();
        }, true);
    });

    // Klik w miniaturę: bez otwierania galerii, za to wybór obrazu.
    window.addEventListener("click", (event) => {
        if (!event.isTrusted) return;
        const button = thumbOf(event.target);
        if (!button) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        const init = { bubbles: true, cancelable: true, composed: true, view: window, relatedTarget: null, clientX: event.clientX, clientY: event.clientY };
        try {
            button.dispatchEvent(new PointerEvent("pointerover", { ...init, pointerType: "mouse", isPrimary: true }));
        } catch (_) {
            // brak PointerEvent - wystarczy zdarzenie myszy
        }
        button.dispatchEvent(new MouseEvent("mouseover", init));
    }, true);
}

function isOutdatedItemPage() {
    return [...document.querySelectorAll('h6')].filter(el => el.textContent === 'Sprzedaż zakończona').length > 0
}

function isItemParamsVisible() {
    return document.querySelectorAll('div[data-box-name="Container Parameters Card"]').length > 0
}

function _acvWaitForBodyReady() {
    // Przy run_at:"document_start" (wymagane, żeby CSS w
    // product-page-instant-hide.css i klasy na <html> zdążyły zadziałać od
    // pierwszej klatki renderowania) document.body i reszta DOM mogą jeszcze
    // nie istnieć. Cała reszta logiki (przenoszenie parametrów, usuwanie
    // reklam identyfikowanych po tekście) operuje na elementach strony,
    // więc czeka na co najmniej DOMContentLoaded.
    if (document.body && document.readyState !== "loading") {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
}

(async () => {
    if (location.hostname !== "allegro.pl" || (!location.pathname.startsWith("/produkt/") && !location.pathname.startsWith("/oferta/") && !location.pathname.startsWith("/ogloszenie/"))) {
        return;
    }

    const config = await getProductConfig();
    if (!config.enabled) {
        // Rozszerzenie jest globalnie wyłączone - usuwamy klasy CSS
        // ustawione domyślnie na starcie pliku (patrz
        // _acvApplyInstantHideClasses wyżej), żeby nic nie było ukrywane.
        document.documentElement?.classList.remove(...Object.values(ACV_INSTANT_HIDE_CSS_CLASSES));
        return;
    }

    // Korygujemy klasy CSS na <html> zgodnie z RZECZYWISTYM zapisanym
    // configem (na starcie pliku ustawiliśmy je na wartości domyślne -
    // patrz _acvApplyInstantHideClasses wyżej - żeby nie czekać na ten
    // odczyt zanim cokolwiek się wyrenderuje). W typowym przypadku (user
    // nie zmieniał tych dwóch konkretnych ustawień) to no-op.
    _acvApplyInstantHideClasses(normalizeProductSections(config.sections));

    await _acvWaitForBodyReady();

    if (normalizeProductSections(config.sections).disableGalleryHover) {
        acvDisableGalleryHover();
    }

    // Strony ogłoszeń (/ogloszenie/*) mają inny układ niż /produkt/ - tak jak zakończona
    // oferta dostają tylko ograniczony tryb (bez przenoszenia parametrów i opisu).
    if (!isOutdatedItemPage() && !location.pathname.startsWith("/ogloszenie/")) {
        restoreOldLook(config.sections);
    } else {
        restoreOutdatedLook(config.sections);
    }
})();



