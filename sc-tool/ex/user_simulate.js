// Generate random string
async function makeName(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// Get element helper
function getElement(selector, element, iframe) {
  return (
    element ||
    (iframe
      ? iframe.contentWindow.document.querySelector(selector)
      : document.querySelector(selector))
  );
}

// Common user input wrapper
async function executeUserAction(
  pid,
  action,
  selector,
  str = "",
  element,
  iframe,
  xPlus = 0,
  yPlus = 0
) {
  const el = getElement(selector, element, iframe);
  if (!el) {
    console.log("error", selector, "not found");
    return null;
  }

  el.scrollIntoViewIfNeeded();
  const pos = getElementPosition(el, iframe);

  await updateUserInput(
    pid,
    action,
    pos.x + xPlus,
    pos.y + yPlus,
    scrollX,
    scrollY,
    str,
    selector
  );

  return { x: pos.x + xPlus, y: pos.y + yPlus };
}

async function userLog(pid, ...params) {
  await updateUserInput(pid, "LOG", 0, 0, 0, 0, JSON.stringify(params), "LOG");
}

// Typing functions
async function userType(pid, selector, str, element, iframe) {
  return executeUserAction(pid, "TYPE", selector, str, element, iframe);
}

async function userTypeChar(pid, selector, str, element, iframe) {
  return executeUserAction(pid, "TYPE_CHAR", selector, str, element, iframe);
}

async function userTypeEnter(pid, selector, str, element, iframe) {
  try {
    return await executeUserAction(
      pid,
      "TYPE_ENTER",
      selector,
      str,
      element,
      iframe
    );
  } catch (e) {
    console.log(e);
  }
}

async function userOnlyTypeEnter(pid, selector, str, element, iframe) {
  try {
    return await executeUserAction(
      pid,
      "ONLY_TYPE_ENTER",
      selector,
      str,
      element,
      iframe
    );
  } catch (e) {
    console.log(e);
  }
}

// Click function
async function userClick(pid, selector, element, iframe, xPlus = 0, yPlus = 0) {
  await sleep(1000);
  return executeUserAction(
    pid,
    "CLICK",
    selector,
    "",
    element,
    iframe,
    xPlus,
    yPlus
  );
}

// Scroll to element
async function userScrollTo(pid, selector, element) {
  const el = element || document.querySelector(selector);
  if (!el) {
    console.log("error", selector, "not found");
    return;
  }

  const menuBarHeight = window.outerHeight - window.innerHeight;
  const x = window.screenX + window.innerWidth * 0.5;
  const y = window.screenY + menuBarHeight + window.innerHeight * 0.5;

  let pos = el.getBoundingClientRect();
  function isVisible() {
    return (
      pos.x > 0 &&
      pos.x < window.innerWidth - pos.width &&
      pos.y > 0 &&
      pos.y < window.innerHeight - pos.height
    );
  }

  if (isVisible()) return;

  for (let i = 0; i < 20 && !isVisible(); i++) {
    await updateUserInput(
      pid,
      "SCROLL",
      x,
      y,
      0,
      0,
      pos.y < 0 ? -5 : 5,
      selector
    );
    pos = el.getBoundingClientRect();
  }
}

// Click all elements
async function userClickAll(pid, selector) {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    const pos = getElementPosition(el);
    await updateUserInput(
      pid,
      "CLICK",
      pos.x,
      pos.y,
      scrollX,
      scrollY,
      "",
      selector
    );
  }
}

// Scroll functions
function getRandomPosition(percentage = 50) {
  return (randomRanger(40, 60) * percentage) / 100;
}

async function userScroll(pid, n) {
  const menuBarHeight = window.outerHeight - window.innerHeight;
  const x = window.screenX + window.innerWidth * getRandomPosition();
  const y =
    window.screenY + menuBarHeight + window.innerHeight * getRandomPosition();
  await updateUserInput(pid, "SCROLL", x, y, 0, 0, n);
}

async function userScrollBy(pid, n, element) {
  if (typeof element === "string") {
    element = document.querySelector(element);
  }

  if (!element) {
    console.error("Element not found");
    return;
  }

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width * getRandomPosition();
  const y = rect.top + rect.height * getRandomPosition();

  element.scrollBy({ top: n, behavior: "smooth" });
  await updateUserInput(pid, "SCROLL", x, y, 0, 0, 0);
}

async function userScrollMobile(pid, n) {
  const x = window.screenX + windowWide / 2;
  const y = window.screenY + mobileMenuBarHeight + window.innerHeight / 2;
  await updateUserInput(pid, "SCROLL", x, y, 0, 0, n);
}

// Video click functions
function getVisibleVideos(selector, filterFn = () => true) {
  const videos = document.querySelectorAll(selector);
  return Array.from(videos).filter(filterFn);
}

async function userClickRandomVideo(pid) {
  const visibles = getVisibleVideos(
    '#content a#thumbnail[href*="watch"]:not([href*="list="])',
    (x) => {
      const rect = x.getBoundingClientRect();
      return (
        rect.x > 0 && rect.y > 100 && rect.y < window.innerHeight - rect.height
      );
    }
  );

  if (!visibles.length) throw "no random video";

  const random = visibles[randomRanger(0, visibles.length - 1)];
  const pos = getElementPosition(random);
  await updateUserInput(
    pid,
    "CLICK",
    pos.x,
    pos.y,
    pos.scrollX,
    pos.scrollY,
    "",
    "random video"
  );
}

async function userClickRandomVideoMobile(pid) {
  const visibles = getVisibleVideos(
    'ytm-browse a.large-media-item-thumbnail-container[href*="watch"]:not([href*="list="])'
  );

  if (!visibles.length) throw "no random video";

  const random = visibles[randomRanger(0, visibles.length - 1)];
  await userClick(pid, "random video mobile", random);
}

async function userClickRandomVideoMobileCompact(pid) {
  const visibles = getVisibleVideos(
    'ytm-search a.compact-media-item-image[href*="watch"]:not([href*="list="])'
  );

  if (!visibles.length) throw "no random video";

  const random = visibles[randomRanger(0, visibles.length - 1)];
  await userClick(pid, "random video compact", random);
}

// Utility functions
async function goToLocation(pid, url) {
  return updateUserInput(pid, "GO_ADDRESS", 0, 0, 0, 0, url);
}

async function sendKey(pid, key) {
  return updateUserInput(pid, "SEND_KEY", 0, 0, 0, 0, key);
}

async function screenshot(pid) {
  return updateUserInput(pid, "SCREENSHOT");
}

async function userSelect(pid, n) {
  return updateUserInput(pid, "SELECT_OPTION", 0, 0, 0, 0, n);
}

async function userSelectAvatar(pid, gender) {
  return updateUserInput(pid, "SELECT_AVATAR", 0, 0, 0, 0, gender);
}

async function userPasteImage(pid, selector, element, iframe, image_name) {
  const el =
    element ||
    (iframe
      ? iframe.contentWindow.document.querySelector(selector)
      : document.querySelector(selector));
  el.scrollIntoViewIfNeeded();
  const pos = getElementPosition(el, iframe);
  return updateUserInput(
    pid,
    "PASTE_IMAGE",
    pos.x,
    pos.y,
    scrollX,
    scrollY,
    image_name,
    selector
  );
}

async function userDragRecapcha(pid, selector, element, toX, iframe) {
  const el =
    element ||
    (iframe
      ? iframe.contentWindow.document.querySelector(selector)
      : document.querySelector(selector));
  el.scrollIntoViewIfNeeded();
  const pos = getElementPosition(el, iframe);
  return updateUserInput(pid, "DRAG", pos.x, pos.y, toX, pos.y, "", selector);
}

async function nextVideo(pid) {
  if (IS_MOBILE) {
    await userClick(
      pid,
      'ytm-playlist-controls c3-icon path[d="M5,18l10-6L5,6V18L5,18z M19,6h-2v12h2V6z"]'
    );
  } else {
    await updateUserInput(pid, "NEXT_VIDEO");
  }
}

async function switchMobile(action) {
  action.windowWide = 1920;
  action.mobileMenuBarHeight = 138;

  await updateUserInput(action.pid, "OPEN_DEV", window.screenX, window.screenY);
  await sleep(3000);

  if (action.availWidth && action.userAgent) {
    [action.availHeight, action.availWidth] = [
      action.availWidth,
      action.availHeight,
    ];
    action.zoom =
      576 > action.availHeight ? 1 : (576 / action.availHeight).toFixed(2);

    if (576 / action.availHeight > 2) {
      action.zoom = 1;
      action.availWidth *= 2;
      action.availHeight *= 2;
    }

    await setActionData(action);

    const actionType =
      navigator.maxTouchPoints < 1 || navigator.maxTouchPoints == 10
        ? "OPEN_MOBILE_CUSTOM"
        : window.outerHeight != action.availHeight ||
          window.outerWidth != action.availWidth
        ? "REOPEN_MOBILE_CUSTOM"
        : "SELECT_MOBILE_CUSTOM";

    if (actionType !== "SELECT_MOBILE_CUSTOM") {
      await updateUserInput(
        action.pid,
        actionType,
        action.availWidth,
        action.availHeight,
        0,
        0,
        action.userAgent
      );
    } else {
      await updateUserInput(action.pid, actionType);
    }
  } else {
    action.zoom = [0.68, 0.75, 0.63, 0.45, 0.5, 0.42, 0.8, 0.88, 0.5, 0.5][
      action.pid % 10
    ];
    await setActionData(action);

    const actionType =
      navigator.maxTouchPoints < 1 || navigator.maxTouchPoints == 10
        ? "OPEN_MOBILE"
        : "SELECT_MOBILE";
    await updateUserInput(action.pid, actionType);
  }

  await sleep(1000);
  await updateUserInput(action.pid, "SHOW_PAGE");
}
