// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";

let URL = "http://{url_server_host}";
let REPORT_URL = "http://localhost:2000";
let RE_SET_USER_AGENT = null;
// Function to fetch Chrome versions from API
async function fetchChangeChromeVersionStatus() {
  try {
      const response = await fetch(`${REPORT_URL}/change-chrome-version`);
      const data = await response.json();
      return data.change_chrome_version;
  } catch (error) {
      console.error('Error fetching Chrome versions:', error);
      // Fallback versions in case API fails
      return false
  }
}

const listVersion = [
  "134.0.6998.165",
  "133.0.6943.53",
  "132.0.6834.159",
  "131.0.6778.264",
  "130.0.6723.116",
  "129.0.6668.100",
  "128.0.6613.137",
  "127.0.6533.119",
  "126.0.6478.182",
  "125.0.6422.141",
  "124.0.6367.207",
  "123.0.6312.122",
  "122.0.6261.128",
  "121.0.6167.184",
  "120.0.6099.224",
  "119.0.6045.199",
  "118.0.5993.117",
  "117.0.5938.149",
  "116.0.5845.187",
  "116.0.5845.179",
  "115.0.5790.170",
  "114.0.5735.198",
  "113.0.5672.126",
  "112.0.5615.165",
  "111.0.5563.146",
  "110.0.5481.177"
];

function generateNewVersion() {
  // Chọn ngẫu nhiên một version từ list
  const randomIndex = Math.floor(Math.random() * listVersion.length);
  const baseVersion = listVersion[randomIndex];
  
  // Tách version thành các phần
  const parts = baseVersion.split('.');
  
  // Lấy các thành phần từ version gốc
  const major = parts[0];
  const minor = parts[1]; // Thường là 0 cho các phiên bản stable
  
  // Theo quy tắc của Google Chromium, revision thường là số trong khoảng từ 5000-7000
  // Có xu hướng tăng dần theo thời gian và theo major version
  // Tạo một revision hợp lý dựa trên major version
  // Phân tích revision từ các ví dụ để duy trì sự nhất quán
  const baseRevision = parseInt(parts[2]);
  
  // Chọn một số tăng nhẹ so với revision gốc, trong khoảng 1-50
  // const revisionIncrement = Math.floor(Math.random() * 50) + 1;
  // const newRevision = baseRevision + revisionIncrement;
  
  // Tạo số patch mới trong khoảng 1-300 (các bản patch thường không vượt quá con số này)
  const newPatch =  Math.floor(Math.random() * 999) + 1;
  
  // Ghép version mới
  return `${major}.${minor}.${baseRevision}.${newPatch}`;
}

// Sử dụng


// Initialize Chrome version
async function initializeChromeVersion() {
    const DESIRED_VERSION = generateNewVersion();
    console.log('New version:', DESIRED_VERSION);
    
    // Set up request header modification
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

    // Log initialized version
    console.log('Chrome version initialized:', DESIRED_VERSION);
}

// Initialize on extension installation
chrome.runtime.onInstalled.addListener(async () => {
  const change = await fetchChangeChromeVersionStatus();
  if (change) initializeChromeVersion();
});

// handle msg from tab or background
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.tab) {
    if (request.type == "GET") {
      let param = new URLSearchParams(request.data).toString();
      fetch(URL + request.url + "?" + param)
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch((error) => sendResponse({ err: error }));
      return true;
    }
    if (request.type == "COMMENT") {
      let param = new URLSearchParams(request.data).toString();
      fetch(request.url + "?" + param)
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch((error) => sendResponse({ err: error }));
      return true;
    } else if (request.type == "POST") {
      fetch(URL + request.url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request.data),
      })
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch((error) => sendResponse({ err: error }));
      return true;
    } else if (request.type == "CLEAR_BROWSER_DATA") {
      clearBrowserData().then((rs) => {
        sendResponse(rs);
      });
      return true;
    } else if (request.type == "SET_USER_AGENT") {
      // trong code
      RE_SET_USER_AGENT = request.user_agent;
    } else if (request.type == "CLOSE_ADS_TAB") {
      closeAdsTabs();
    } else if (request.type == "GET_TOTAL_TABS") {
      getTotalTabs().then((rs) => {
        sendResponse(rs);
      });
      return true;
    } else if (request.type == "CLOSE_OLD_TABS") {
      closeOldTabs();
    } else if (request.type == "CLOSE_UNACTIVE_TABS") {
      closeUnactiveTabs();
    } else {
      if (request.data.stop && request.data.stop != "false") {
        closeBrowser();
      }
      let param = new URLSearchParams(request.data).toString();
      fetch(REPORT_URL + request.url + "?" + param)
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch((error) => sendResponse({ err: error }));
      return true;
    }
  }
});

function clearBrowserData() {
  return new Promise((res, rej) => {
    chrome.browsingData.remove(
      {
        //"since": 1000
      },
      {
        appcache: false,
        cache: true,
        cacheStorage: false,
        cookies: false,
        downloads: true,
        fileSystems: false,
        formData: false,
        history: true,
        indexedDB: false,
        localStorage: false,
        passwords: false,
        serviceWorkers: false,
        webSQL: false,
      },
      function () {
        res(true);
      }
    );
  });
}

// function closeBrowser(){
//     chrome.storage.sync.set({action: {}});
//     chrome.tabs.query({}, function (tabs) {
//         for (var i = 0; i < tabs.length; i++) {
//             chrome.tabs.remove(tabs[i].id);
//         }
//     });
// }
function closeBrowser() {
  chrome.storage.sync.set({ action: {} }, function () {
    chrome.windows.getAll({ populate: true }, function (windows) {
      windows.forEach(function (window) {
        chrome.windows.remove(window.id);
      });
    });
  });
}

function closeOldTabs() {
  chrome.tabs.query({}, function (tabs) {
    for (var i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].active) {
        if (tabs[i].url.indexOf("localhost") == -1) {
          chrome.tabs.remove(tabs[i].id);
          closeOldTabs();
          break;
        }
      } else {
        chrome.tabs.remove(tabs[i].id);
      }
    }
  });
}

function closeUnactiveTabs() {
  chrome.tabs.query({}, function (tabs) {
    for (var i = tabs.length - 1; i >= 0; i--) {
      if (!tabs[i].active) {
        chrome.tabs.remove(tabs[i].id);
      }
    }
  });
}

function closeAdsTabs() {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (i > 0) {
        chrome.tabs.remove(tabs[i].id);
      }
    }
  });
}

function getTotalTabs() {
  return new Promise((res, rej) => {
    chrome.tabs.query({}, function (tabs) {
      res(tabs.length);
    });
  });
}

// trong code
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (RE_SET_USER_AGENT) {
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === "User-Agent") {
          details.requestHeaders[i].value = RE_SET_USER_AGENT;
          break;
        }
      }
    }

    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

// var CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36';
// chrome.webRequest.onBeforeSendHeaders.addListener(
//     function(details) {
//         for (var i = 0; i < details.requestHeaders.length; ++i) {
//             if (details.requestHeaders[i].name === 'User-Agent') {
//                 details.requestHeaders[i].value = CHROME_USER_AGENT;
//                 break;
//             }
//         }
//         return {requestHeaders: details.requestHeaders};
//     }, {urls: ['<all_urls>']}, ['blocking', 'requestHeaders']);

// check report time
setInterval((_) => {
  chrome.storage.sync.get("action", function (data) {
    try {
      if (Date.now() - data.action.lastReport > 5 * 60 * 1000) {
        let report = {
          pid: data.action.pid,
          id: data.action.id,
          status: 0,
          stop: true,
          msg: "TIMEOUT",
        };
        let param = new URLSearchParams(report).toString();
        fetch(REPORT_URL + request.url + "?" + param).catch((error) =>
          console.log("error", error)
        );
        closeBrowser();
      }
    } catch (e) {}
  });
}, 60000);

chrome.webRequest.onAuthRequired.addListener(
  function (details, callbackFn) {
    chrome.storage.sync.get("action", function (data) {
      callbackFn({
        authCredentials: {
          username: data.action.proxy_username,
          password: data.action.proxy_password,
        },
      });
    });
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);
