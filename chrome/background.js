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

function isTargetUrl(url) {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.hostname === "allegro.pl" && parsed.pathname.startsWith("/produkt/");
    } catch (_) {
        return false;
    }
}

function getEnabledState() {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.get("enabled")
            .then((result) => result.enabled !== false)
            .catch(() => true);
    }
    return new Promise((resolve) => {
        chrome.storage.local.get("enabled", (result) => {
            resolve(result?.enabled !== false);
        });
    });
}

function setEnabledState(enabled) {
    if (typeof browser !== "undefined" && browser?.storage?.local) {
        return browser.storage.local.set({ enabled });
    }
    return new Promise((resolve) => {
        chrome.storage.local.set({ enabled }, () => resolve());
    });
}

function setActionIcon(enabled, tabId) {
    const actionApi = (typeof browser !== "undefined" && browser?.action) ? browser.action : chrome.action;
    const details = { path: enabled ? ICONS_ENABLED : ICONS_DISABLED };
    if (typeof tabId === "number") details.tabId = tabId;

    if (typeof browser !== "undefined" && browser?.action) {
        return actionApi.setIcon(details);
    }
    return new Promise((resolve) => {
        actionApi.setIcon(details, () => resolve());
    });
}

function setActionTitle(enabled, tabId) {
    const actionApi = (typeof browser !== "undefined" && browser?.action) ? browser.action : chrome.action;
    const details = {
        title: enabled ? "allegro-classic-view: ON" : "allegro-classic-view: OFF"
    };
    if (typeof tabId === "number") details.tabId = tabId;

    if (typeof browser !== "undefined" && browser?.action) {
        return actionApi.setTitle(details);
    }
    return new Promise((resolve) => {
        actionApi.setTitle(details, () => resolve());
    });
}

async function refreshIconForTab(tabId) {
    const enabled = await getEnabledState();
    await setActionIcon(enabled, tabId);
    await setActionTitle(enabled, tabId);
}

async function toggleForTab(tab) {
    const current = await getEnabledState();
    const next = !current;
    await setEnabledState(next);
    await setActionIcon(next);
    await setActionTitle(next);

    if (tab?.id && isTargetUrl(tab.url)) {
        const tabsApi = (typeof browser !== "undefined" && browser?.tabs) ? browser.tabs : chrome.tabs;
        if (typeof browser !== "undefined" && browser?.tabs) {
            await tabsApi.reload(tab.id);
        } else {
            tabsApi.reload(tab.id);
        }
    }
}

const runtimeApi = (typeof browser !== "undefined" && browser?.runtime) ? browser.runtime : chrome.runtime;
const actionApi = (typeof browser !== "undefined" && browser?.action) ? browser.action : chrome.action;
const tabsApi = (typeof browser !== "undefined" && browser?.tabs) ? browser.tabs : chrome.tabs;

runtimeApi.onInstalled.addListener(async () => {
    const enabled = await getEnabledState();
    await setActionIcon(enabled);
    await setActionTitle(enabled);
});

runtimeApi.onStartup?.addListener(async () => {
    const enabled = await getEnabledState();
    await setActionIcon(enabled);
    await setActionTitle(enabled);
});

actionApi.onClicked.addListener((tab) => {
    toggleForTab(tab);
});

tabsApi.onActivated?.addListener((activeInfo) => {
    refreshIconForTab(activeInfo.tabId);
});

tabsApi.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading" || changeInfo.status === "complete") {
        refreshIconForTab(tabId);
    }
});
