// background.js

const DESIRED_VERSION = '132.0.6834.83'; // Thay đổi version ở đây

// Chặn và sửa đổi headers
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === 'user-agent') {
                const originalUA = details.requestHeaders[i].value;
                details.requestHeaders[i].value = originalUA.replace(
                    /Chrome\/[\d.]+/g,
                    `Chrome/${DESIRED_VERSION}`
                );
                break;
            }
        }
        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
);

// Chặn và sửa đổi response headers
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        for (let i = 0; i < details.responseHeaders.length; i++) {
            if (details.responseHeaders[i].name.toLowerCase() === 'sec-ch-ua') {
                details.responseHeaders[i].value = details.responseHeaders[i].value.replace(
                    /Chrome\/[\d.]+/g,
                    `Chrome/${DESIRED_VERSION}`
                );
            }
        }
        return { responseHeaders: details.responseHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);

// 22
const CHROME_VERSIONS = [
    "132.0.6834.84",
    "132.0.6834.83",
    "131.0.6778.266",
    "131.0.6778.265",
    "131.0.6778.264",
    "131.0.6778.206",
    "131.0.6778.205",
    "131.0.6778.204",
    "131.0.6778.141",
    "131.0.6778.140",
    "131.0.6778.139",
    "131.0.6778.110",
    "131.0.6778.87",
    "131.0.6778.109",
    "131.0.6778.108",
    "131.0.6778.86",
    "131.0.6778.85",
    "131.0.6778.71",
    "131.0.6778.70",
    "131.0.6778.69",
    "130.0.6723.119",
    "131.0.6778.33",
    "130.0.6723.118",
    "130.0.6723.117",
    "130.0.6723.116",
    "130.0.6723.92",
    "130.0.6723.91",
    "130.0.6723.71",
    "130.0.6723.70",
    "129.0.6668.103",
    "128.0.6613.139"
];

// Get random Chrome version
const getRandomVersion = () => {
    const randomIndex = Math.floor(Math.random() * CHROME_VERSIONS.length);
    return CHROME_VERSIONS[randomIndex];
};

// Constants
const DESIRED_VERSION = getRandomVersion();

// Chặn và sửa đổi request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        let uaHeader = details.requestHeaders.find(h => h.name.toLowerCase() === 'user-agent');
        if (uaHeader) {
            uaHeader.value = uaHeader.value.replace(/Chrome\/[\d.]+/g, `Chrome/${DESIRED_VERSION}`);
        }

        let uaClientHeader = details.requestHeaders.find(h => h.name.toLowerCase() === 'sec-ch-ua');
        if (uaClientHeader) {
            uaClientHeader.value = `"Not A(Brand";v="99", "Google Chrome";v="${DESIRED_VERSION}", "Chromium";v="${DESIRED_VERSION}"`;
        }
        
        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);

// Khởi tạo extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed with Chrome version:', DESIRED_VERSION);
});


// 3
// Available Chrome versions - Latest stable versions for Windows
const CHROME_VERSIONS = [
    "132.0.6834.84",
    "132.0.6834.83",
    "131.0.6778.266",
    "131.0.6778.265",
    "131.0.6778.264",
    "131.0.6778.206",
    "131.0.6778.205",
    "131.0.6778.204",
    "131.0.6778.141",
    "131.0.6778.140",
    "131.0.6778.139",
    "131.0.6778.110",
    "131.0.6778.87",
    "131.0.6778.109",
    "131.0.6778.108",
    "131.0.6778.86",
    "131.0.6778.85",
    "131.0.6778.71",
    "131.0.6778.70",
    "131.0.6778.69",
    "130.0.6723.119",
    "131.0.6778.33",
    "130.0.6723.118",
    "130.0.6723.117",
    "130.0.6723.116",
    "130.0.6723.92",
    "130.0.6723.91",
    "130.0.6723.71",
    "130.0.6723.70",
    "129.0.6668.103",
    "128.0.6613.139",
];

// Get random Chrome version
const getRandomVersion = () => {
    const randomIndex = Math.floor(Math.random() * CHROME_VERSIONS.length);
    return CHROME_VERSIONS[randomIndex];
};

// Constants
const DESIRED_VERSION = getRandomVersion(); // Thay đổi version ở đây

// Chặn và sửa đổi headers
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === 'user-agent') {
                const originalUA = details.requestHeaders[i].value;
                details.requestHeaders[i].value = originalUA.replace(
                    /Chrome\/[\d.]+/g,
                    `Chrome/${DESIRED_VERSION}`
                );
                break;
            }
        }
        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
);

// Chặn và sửa đổi response headers
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        for (let i = 0; i < details.responseHeaders.length; i++) {
            if (details.responseHeaders[i].name.toLowerCase() === 'sec-ch-ua') {
                details.responseHeaders[i].value = details.responseHeaders[i].value.replace(
                    /Chrome\/[\d.]+/g,
                    `Chrome/${DESIRED_VERSION}`
                );
            }
        }
        return { responseHeaders: details.responseHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);




//new
// Get random Chrome version
const getRandomVersion = () => {
    const randomIndex = Math.floor(Math.random() * CHROME_VERSIONS.length);
    return CHROME_VERSIONS[randomIndex];
};
// Lấy version từ storage hoặc tạo mới
const getChromeVersion = (callback) => {
    chrome.storage.local.get(['chromeVersion', 'lastUpdate'], (result) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const today8AM = new Date(today.getTime()).setHours(8, 0, 0);
        const today9AM = new Date(today.getTime()).setHours(9, 0, 0);
        
        const lastUpdate = result.lastUpdate ? new Date(result.lastUpdate) : null;
        const lastUpdateDate = lastUpdate ? new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()) : null;
        const isNewDay = !lastUpdateDate || lastUpdateDate < today;

        // Nếu chưa có version hoặc cần cập nhật
        if (!result.chromeVersion || (true)) {
            const newVersion = getRandomVersion();
            chrome.storage.local.set({
                chromeVersion: newVersion,
                lastUpdate: now.getTime()
            });
            callback(newVersion);
        } else {
            callback(result.chromeVersion);
        }
    });
};

// Browser config với version mặc định
const BROWSER_CONFIG = {
    version: getRandomVersion(), // Version mặc định
    platform: "Windows",
    platformVersion: "11.0.0",
    architecture: "x86_64",
    bitness: "64",
    language: "en-US,en;q=0.9"
};

// Cập nhật version khi khởi động
getChromeVersion((version) => {
    BROWSER_CONFIG.version = version;
});


// Generate headers configuration
const generateHeaders =   () => {
      // Đảm bảo có version từ storage;
    return({
    "user-agent": `Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${BROWSER_CONFIG.version} Safari/537.36`,
    "sec-ch-ua": `"Not A(Brand";v="99", "Google Chrome";v="${BROWSER_CONFIG.version}", "Chromium";v="${BROWSER_CONFIG.version}"`,
    "sec-ch-ua-platform": `"${BROWSER_CONFIG.platform}"`,
    "sec-ch-ua-platform-version": `"${BROWSER_CONFIG.platformVersion}"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-arch": `"${BROWSER_CONFIG.architecture}"`,
    "sec-ch-ua-bitness": `"${BROWSER_CONFIG.bitness}"`,
    "accept-language": BROWSER_CONFIG.language,
    "sec-ch-ua-full-version": `"${BROWSER_CONFIG.version}"`,
    "sec-ch-ua-full-version-list": `"Not A(Brand";v="99.0.0.0", "Google Chrome";v="${BROWSER_CONFIG.version}", "Chromium";v="${BROWSER_CONFIG.version}"`,
})};



// Request handler utilities
const requestHandlers = {
    // Modify request headers
    modifyHeaders: (details) => {
        const headers = details.requestHeaders || [];
        const customHeaders = generateHeaders();

        // Remove existing headers we want to replace
        const filteredHeaders = headers.filter(
            (header) =>
                !Object.keys(customHeaders).includes(header.name.toLowerCase())
        );

        // Add new headers
        Object.entries(customHeaders).forEach(([name, value]) => {
            filteredHeaders.push({ name, value });
        });

        return { requestHeaders: filteredHeaders };
    },

    // Clean response headers
    cleanResponseHeaders: (details) => ({
        responseHeaders: details.responseHeaders.filter(
            (header) => header.name.toLowerCase() !== "content-security-policy"
        ),
    }),
};

// Register listeners
const registerListeners = () => {
    // Request headers modification
    chrome.webRequest.onBeforeSendHeaders.addListener(
        requestHandlers.modifyHeaders,
        { urls: ["<all_urls>"] },
        ["blocking", "requestHeaders", "extraHeaders"]
    );

    // Response headers cleaning
    // chrome.webRequest.onHeadersReceived.addListener(
    //     requestHandlers.cleanResponseHeaders,
    //     { urls: ["<all_urls>"] },
    //     ["blocking", "responseHeaders", "extraHeaders"]
    // );
};

// Initialize
registerListeners();