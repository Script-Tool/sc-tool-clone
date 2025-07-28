const SKIP_ADS_PERCENT = 0.55; //0.7  //0.85
const LIKE_PERCENT = 0.01;
const COMMENT_PERCENT = 0.0015;
const VIEW_SUB_PERCENT = 0; //0.002
const SEARCH_SKIP = 0;
const CHANNEL_VIDEO_WATCH = 0;

async function userWatch(action) {
  try {
    let url = window.location.toString();

    if (url.includes(action.directLink)) {
      await goToLocation(
        action.pid,
        "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
      );
    }

    if (url.indexOf("support.google.com/accounts/answer/40039") > -1) {
      await updateActionStatus(
        action.pid,
        "login",
        LOGIN_STATUS.ERROR,
        "support.google.com/accounts/answer/40039"
      );
      return;
    }

    if (url.indexOf("https://consent.youtube.com/m") > -1) {
      try {
        let btnRejectAll = document.querySelectorAll("form").item(1);
        if (btnRejectAll) {
          await userClick(action.pid, "btnRejectAll", btnRejectAll);
        } else {
          await goToLocation(action.pid, "accounts.google.com");
          await sleep(60000);
        }
        return;
      } catch (error) {
        console.log(error);
      }
    }

    if (
      url.indexOf("https://accounts.google.com/signin/v2/identifier") > -1 ||
      url.indexOf("https://accounts.google.com/ServiceLogin") > -1 ||
      url.indexOf("accounts.google.com/v3/signin/identifier") > -1
    ) {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "NOT_LOGIN"
      );
    } else if (url.indexOf("youtube.com/account") > -1) {
      await handleUsersSelection(action);
      return;
    } else if (url.indexOf("google.com/search?q=") > -1) {
      await sleep(2000);
      await userClick(action.pid, "#search div h3");
    } else if (
      url == "https://www.youtube.com/" ||
      url == "https://www.youtube.com/feed/trending" ||
      url == "https://m.youtube.com/"
    ) {
      await processHomePage(action);
    }  else if (url.indexOf("https://www.youtube.com/results") > -1) {
      await processSearchPage(action);
    } else if (
      url.indexOf("https://www.youtube.com/watch") > -1 ||
      url.indexOf("https://m.youtube.com/watch") > -1
    ) {
      await processWatchPage(action);
    } else if (url.indexOf("m.youtube.com/playlist?list=") > -1) {
      if (document.querySelector(".shuffle-button")) {
        await userClick(action.pid, ".shuffle-button");
      } else if (document.querySelector(".playlist-play-all-button")) {
        await userClick(action.pid, ".playlist-play-all-button");
      }

      await sleep(15000);
    } else if (url.indexOf("https://www.youtube.com/playlist?list=") > -1) {
      await processPlaylistPage(action);
    } else if (
      url.indexOf("youtube.com/@") > -1 ||
      url.indexOf("https://www.youtube.com/channel/") > -1 ||
      url.indexOf("https://www.youtube.com/user/") > -1 ||
      url.indexOf("https://www.youtube.com/c/") > -1
    ) {
      if (action.create_channel) {
        action.filter = undefined;
        await setActionData(action);
        await sleep(3000);
        await userClick(action.pid, "#container a#logo");
      } else {
        await processWatchChannelPage(action);
      }
    } else if (url.indexOf("https://myaccount.google.com/") == 0) {
      await goToLocation(action.pid, "youtube.com//");
    } else if (
      url.indexOf("https://accounts.google.com/signin/v2/identifier") > -1 ||
      url.indexOf("https://accounts.google.com/ServiceLogin") > -1
    ) {
      throw "NOT_LOGIN";
    } else if (
      window.location.toString().indexOf("youtube.com/oops") > -1 &&
      document.querySelector("#alerts")
    ) {
      throw new Error(
        "NOT_LOGIN_" +
          document.querySelector("#alerts .yt-alert-message").textContent
      );
    } else if (url.indexOf("https://consent.youtube.com") > -1) {
      await updateActionStatus(action.pid, action.id, 0, "consent.youtube.com");
    }
  } catch (e) {
    if (e.toString() == "NOT_LOGIN") action.retry = true;
    if (
      action.retry ||
      window.location.toString().indexOf("https://www.youtube.com/watch") > -1
    ) {
      await updateActionStatus(action.pid, action.id, 0, e.toString());
    } else if (e.toString() == "SEARCH_SKIP") {
      action.retry = undefined;
      action.filter = action.filter ? action.filter - 1 : undefined;
      await setActionData(action);
      await goToLocation(action.pid, "youtube.com//");
      await sleep(2000);
    } else if (e.toString() == "VIDEO_NOT_FOUND") {
      action.searchList = action.searchList.filter(
        (x) => x.trim() != action.video
      );
      if (action.searchList.length == 0) {
        await updateActionStatus(action.pid, action.id, 0, e.toString());
        return;
      }
      action.retry = false;
      action.video =
        action.searchList[randomRanger(0, action.searchList.length - 1)].trim();
      action.filter = undefined;
      await setActionData(action);
      await goToLocation(action.pid, "youtube.com//");
      await sleep(2000);
    } else {
      action.retry = true;
      action.filter = undefined;
      await setActionData(action);
      await goToLocation(action.pid, "youtube.com//");
      await sleep(2000);
    }
  }
}

async function processHomePage(action) {
  await checkLogin(action);

  const choices = [
    action.playlist_url,
    action.keyword,
    action.playlist_url + " " + action.channel_title,
    action.channel_title + " " + action.keyword,
    action.keyword + " " + action.channel_title,
    // Thêm các lựa chọn khác vào đây
  ];
  const randomIndex = Math.floor(Math.random() * choices.length);
  const keyWordSearch = choices[randomIndex];

  if ((action.channel_position == -1 || action.fisrtStart) && !isNonUser) {
    await goToLocation(
      action.pid,
      "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
    );
    return;
  }

  if (isNonUser) {
    getPlaylistData(action);
    await setActionData(action);
  }

  if (action.view_playlist) {
    await goToLocation(
      action.pid,
      "https://www.youtube.com/playlist?list=" + action.playlist_url
    );
    return;
  }

  const inputSearch = document.querySelector("input[name='search_query']");
  if (action.search) {
    await userTypeEnter(action.pid, "input[name='search_query']", keyWordSearch, inputSearch);
    await sleep(20000);
    let url = window.location.toString();
    if (
      url == "https://www.youtube.com/" ||
      url == "https://www.youtube.com/feed/trending" ||
      url == "https://m.youtube.com/"
    ) {
      await userTypeEnter(
        action.pid,
        "input[name='search_query']",
        keyWordSearch,
        inputSearch
      );
    }
    return;
  } else if (action.page) {
    await goToLocation(action.pid, "https://www.youtube.com/channel/" + action.channel_id);
  }

  async function randomGotoChannelPage() {
    let ids = action.suggest_channel_ids.split(",");
    if (ids.length) {
      let channelId = ids[randomRanger(0, ids.length - 1)];
      // handle channel id
      await goToLocation(action.pid, "https://www.youtube.com/" + channelId);
    }
  }

  if (action.suggest) {
    reportLive(action.pid);
    if (action.suggest_channel_ids) {
      await randomGotoChannelPage();
    } else {
      if (action.preview == "home") {
        await userScroll(action.pid, randomRanger(5, 15));
        await sleep(randomRanger(1000, 5000));
        await userClickRandomVideo(action.pid);
      } else if (action.preview == "search") {
        await userTypeEnter(
          action.pid,
          "input[name='search_query']",
          keyWordSearch,
          inputSearch
        );
        await sleep(20000);
        let url = window.location.toString();
        if (
          url == "https://www.youtube.com/" ||
          url == "https://www.youtube.com/feed/trending" ||
          url == "https://m.youtube.com/"
        ) {
          await userTypeEnter(
            action.pid,
            "input[name='search_query']",
            keyWordSearch,
            inputSearch
          );
        }
      }
    }
    return;
  }

  //////////
  if (action.direct) {
    if (action.url_type == "video") {
      await goToLocation(
        action.pid,
        "https://www.youtube.com/watch?v=" + action.playlist_url
      );
      return;
    }
  }

  if (action.preview == "home") {
    await userScroll(action.pid, randomRanger(5, 15));
    await sleep(randomRanger(1000, 5000));
    await userClickRandomVideo(action.pid);
  } else if (action.preview == "search") {
    await userTypeEnter(action.pid, "input[name='search_query']", keyWordSearch, inputSearch);
  } else if (action.home) {
    await processBrowserFeature(action);
  } else if (action.suggest_videos) {
    await userTypeEnter(
      action.pid,
      "input[name='search_query']",
      action.suggest_videos,
      inputSearch
    );
  } else {
    await userTypeEnter(action.pid, "input[name='search_query']", keyWordSearch, inputSearch);
  }

  await sleep(3000);
}

async function preWatchingVideo(action) {
  let url = window.location.toString();
  if (!action.watch_time) {
    let videoTime;
    await skipAds(false, action);

    function loadVideoTime() {
      videoTime = document
        .querySelector(".ytp-time-duration")
        .textContent.split(":");
      videoTime =
        videoTime.length == 2
          ? videoTime[0] * 60 + videoTime[1] * 1
          : videoTime[0] * 60 * 60 + videoTime[1] * 60 + videoTime[2] * 1;
      if (action.url_type == "playlist" && videoTime > 3600) {
        videoTime = 3600;
      }
      videoTime = videoTime * 1000;
    }
    loadVideoTime();
    let countGetVideoTime = 0;
    // get video time
    while (videoTime < 31 && countGetVideoTime < 5) {
      countGetVideoTime++;
      await skipAds(false, action);
      loadVideoTime();
      await sleep(1000);
    }

    if (action.viewed_ads) {
      action.watch_time = randomRanger(
        action.watching_time_start_ads,
        action.watching_time_end_ads
      );
    } else {
      action.watch_time = action.watching_time_non_ads;
    }
  } else {
    await skipAds(false, action);
    action.watch_time = action.origin_watch_time
      ? Number(action.origin_watch_time)
      : Number(action.watch_time); // 
  }

  if (url.indexOf(action.playlist_url) == -1) {
    action.origin_watch_time = action.watch_time;
    await setActionData(action);
    action.watch_time = randomRanger(5000, 15000);

    await skipAds(false, action);
    await userScroll(action.pid, 0);
    let randomSleep = randomRanger(0, 3);
    for (let i = 0; i < randomSleep; i++) {
      await sleep(1000);
      await userScroll(action.pid, 0);
    }
    if (action.home) {
      if (Math.random() < 0.5) {
        await userClick(action.pid, "#container a#logo");
      } else {
        await goToLocation(action.pid, "youtube.com//");
      }
      return;
    }
    if (action.suggest) {
      let scroll = randomRanger(3, 5);
      for (let i = 0; i < scroll; i++) {
        await userScroll(action.pid, 10);
        let video = document.querySelector(
          'ytd-watch-next-secondary-results-renderer .ytd-compact-video-renderer a#thumbnail[href*="' +
            action.playlist_url +
            '"]'
        );
        if (video) {
          await userClick(action.pid, action.playlist_url, video);
          await sleep(100000);
          return;
        }
      }

      if (action.other_videos.length >= CHANNEL_VIDEO_WATCH) {
        action.after_video = false;
        await setActionData(action);
        let randomNext = randomRanger(1, 4);
        let nextSelector = `ytd-watch-next-secondary-results-renderer > #items .ytd-watch-next-secondary-results-renderer:nth-child(${randomNext})`;
        let next = document.querySelector(nextSelector);
        for (let i = 1; i <= 4; i++) {
          nextSelector = `ytd-watch-next-secondary-results-renderer > #items .ytd-watch-next-secondary-results-renderer:nth-child(${i})`;
          next = document.querySelector(nextSelector);
          if (next) {
            break;
          }
        }
        next.insertAdjacentHTML(
          "beforebegin",
          '<ytd-compact-video-renderer class="style-scope ytd-watch-next-secondary-results-renderer" lockup="" thumbnail-width="168">  <div id="dismissable" class="style-scope ytd-compact-video-renderer"> <ytd-thumbnail use-hovered-property="" class="style-scope ytd-compact-video-renderer">  <a id="thumbnail" class="yt-simple-endpoint inline-block style-scope ytd-thumbnail" aria-hidden="true" tabindex="-1" rel="nofollow" href="/watch?v=abcabcabcde"> <yt-img-shadow class="style-scope ytd-thumbnail no-transition" loaded="" style="background-color: transparent;"><img id="img" class="style-scope yt-img-shadow" alt="" width="168" src="https://i.ytimg.com/vi/dpGYmYC3p0I/hqdefault.jpg?sqp=-oaymwEYCKgBEF5IVfKriqkDCwgBFQAAiEIYAXAB&amp;rs=AOn4CLDAbX4Gl4f75wtg594Ix2Hla7Epxw"></yt-img-shadow>  <div id="overlays" class="style-scope ytd-thumbnail"><ytd-thumbnail-overlay-time-status-renderer class="style-scope ytd-thumbnail" overlay-style="DEFAULT"><yt-icon class="style-scope ytd-thumbnail-overlay-time-status-renderer" disable-upgrade="" hidden=""></yt-icon><span class="style-scope ytd-thumbnail-overlay-time-status-renderer" aria-label="1 hour, 14 minutes"> 1:14:08 </span></ytd-thumbnail-overlay-time-status-renderer><ytd-thumbnail-overlay-now-playing-renderer class="style-scope ytd-thumbnail">  <span class="style-scope ytd-thumbnail-overlay-now-playing-renderer">Now playing</span> </ytd-thumbnail-overlay-now-playing-renderer></div> <div id="mouseover-overlay" class="style-scope ytd-thumbnail"></div> <div id="hover-overlays" class="style-scope ytd-thumbnail"></div> </a> </ytd-thumbnail> <div class="details style-scope ytd-compact-video-renderer"> <div class="metadata style-scope ytd-compact-video-renderer"> <a class="yt-simple-endpoint style-scope ytd-compact-video-renderer" rel="nofollow" href="/watch?v=abcabcabcde"> <h3 class="style-scope ytd-compact-video-renderer"> <ytd-badge-supported-renderer class="style-scope ytd-compact-video-renderer" disable-upgrade="" hidden=""> </ytd-badge-supported-renderer> <span id="video-title" class="style-scope ytd-compact-video-renderer" aria-label="ABC Song |ABC Songs Plus More Nursery Rhymes! |Alphabet Collection and Baby Songs from Dave and Ava by Dave and Ava - Nursery Rhymes and Baby Songs 3 years ago 1 hour, 14 minutes 22,960,714 views" title="ABC Song |ABC Songs Plus More Nursery Rhymes! |Alphabet Collection and Baby Songs from Dave and Ava"> ABC Song |ABC Songs Plus More Nursery Rhymes! |Alphabet Collection and Baby Songs from Dave and Ava </span> </h3> <div class="secondary-metadata style-scope ytd-compact-video-renderer"> <ytd-video-meta-block class="compact style-scope ytd-compact-video-renderer" no-endpoints="">    <div id="metadata" class="style-scope ytd-video-meta-block"> <div id="byline-container" class="style-scope ytd-video-meta-block"> <ytd-channel-name id="channel-name" class="style-scope ytd-video-meta-block">  <div id="container" class="style-scope ytd-channel-name"> <div id="text-container" class="style-scope ytd-channel-name"> <yt-formatted-string id="text" title="" class="style-scope ytd-channel-name" ellipsis-truncate="">Dave and Ava - Nursery Rhymes and Baby Songs</yt-formatted-string> </div> <paper-tooltip offset="10" class="style-scope ytd-channel-name" role="tooltip" tabindex="-1">  <div id="tooltip" class="hidden style-scope paper-tooltip"> Dave and Ava - Nursery Rhymes and Baby Songs </div> </paper-tooltip> </div> <ytd-badge-supported-renderer class="style-scope ytd-channel-name">   <div class="badge badge-style-type-verified style-scope ytd-badge-supported-renderer"> <yt-icon class="style-scope ytd-badge-supported-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10 S17.52,2,12,2z M9.92,17.93l-4.95-4.95l2.05-2.05l2.9,2.9l7.35-7.35l2.05,2.05L9.92,17.93z" class="style-scope yt-icon"></path> </g></svg>   </yt-icon> <span class="style-scope ytd-badge-supported-renderer"></span> <paper-tooltip position="top" class="style-scope ytd-badge-supported-renderer" role="tooltip" tabindex="-1">  <div id="tooltip" class="hidden style-scope paper-tooltip"> Verified </div> </paper-tooltip></div> <dom-repeat id="repeat" as="badge" class="style-scope ytd-badge-supported-renderer"><template is="dom-repeat"></template></dom-repeat> </ytd-badge-supported-renderer> </ytd-channel-name> <div id="separator" class="style-scope ytd-video-meta-block">•</div> </div> <div id="metadata-line" class="style-scope ytd-video-meta-block">  <span class="style-scope ytd-video-meta-block">22M views</span>  <span class="style-scope ytd-video-meta-block">3 years ago</span> <dom-repeat strip-whitespace="" class="style-scope ytd-video-meta-block"><template is="dom-repeat"></template></dom-repeat> </div> </div> <div id="additional-metadata-line" class="style-scope ytd-video-meta-block"> <dom-repeat class="style-scope ytd-video-meta-block"><template is="dom-repeat"></template></dom-repeat> </div>  </ytd-video-meta-block> <ytd-badge-supported-renderer class="badges style-scope ytd-compact-video-renderer" disable-upgrade="" hidden=""> </ytd-badge-supported-renderer> </div> </a> <div id="buttons" class="style-scope ytd-compact-video-renderer"></div> </div> <div id="menu" class="style-scope ytd-compact-video-renderer"><ytd-menu-renderer class="style-scope ytd-compact-video-renderer">  <div id="top-level-buttons" class="style-scope ytd-menu-renderer"></div> <yt-icon-button id="button" class="dropdown-trigger style-scope ytd-menu-renderer" hidden="">   <button id="button" class="style-scope yt-icon-button">  <yt-icon class="style-scope ytd-menu-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"> <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" class="style-scope yt-icon"></path> </g></svg>   </yt-icon>  </button>  </yt-icon-button> </ytd-menu-renderer></div> <div id="queue-button" class="style-scope ytd-compact-video-renderer"></div> </div> </div> <div id="dismissed" class="style-scope ytd-compact-video-renderer"></div> </ytd-compact-video-renderer>'
        );
        next.previousElementSibling.querySelector("a").href =
          action.url_type == "video"
            ? "/watch?v=" + action.playlist_url
            : "/watch?v=" +
              (await getFirstVideo(action.playlist_url)).data +
              "&list=" +
              action.playlist_url;
        await userClick(action.pid, `${nextSelector} a#thumbnail`);
        await sleep(100000);
        return;
      } else {
        action.other_videos.push({});
        action.after_video = true;
        await setActionData(action);
      }
      return;
    }
  }

  action.preview = undefined;
  action.suggest_search = false;
  action.suggest_videos = false;
  await setActionData(action);

  if (action.url_type == "playlist") {
    await viewAds(action, true);
    let randomVideoModeBtn = document.querySelector(
      '#top-level-buttons-computed yt-button-shape .yt-spec-button-shape-next path[d="M21,13h1v5L3.93,18.03l2.62,2.62l-0.71,0.71L1.99,17.5l3.85-3.85l0.71,0.71l-2.67,2.67L21,17V13z M3,7l17.12-0.03 l-2.67,2.67l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71l2.62,2.62L2,6v5h1V7z"]'
    );
    if (randomVideoModeBtn) {
      await userClick(action.pid, "", randomVideoModeBtn);
    }

    let loopModeBtn = document.querySelector(
      '#top-level-buttons-computed yt-button-shape .yt-spec-button-shape-next path[d="M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z"]'
    );
    if (loopModeBtn) {
      await userClick(action.pid, "", loopModeBtn);
    }

    action.playlist_index =
      action.playlist_index == undefined
        ? action.total_times + randomRanger(0, 1)
        : action.playlist_index;
    action.playlist_index = action.playlist_index - 1;
    await setActionData(action);
  }

  if (!action.react) {
    let commentKeyword = getCommentKeyword(action.playlist_url, action.video);
    action.react = await getReact(commentKeyword, action.watch_time * 0.9);
  }
  await setActionData(action);

  return true;
}

async function watchingVideo(action) {
  action.data_reported = document.querySelector(".view-count").innerText;
  await setActionData(action);
  let url = window.location.toString();
  let interval = 10000;

  for (let i = 0; i < action.watch_time; ) {
    let currentUrl = window.location.toString();
    // check current url
    if (
      !action.after_video &&
      (currentUrl.indexOf(action.playlist_url) < 0 || currentUrl != url)
    ) {
      if (action.url_type == "playlist") {
        action.playlist_index = 1;
        action.viewed_ads = false;
        await setActionData(action);
        await goToLocation(
          action.pid,
          "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
        );
        return;
      } else {
        await reportScript(action, false);
      }
      return;
    }

    // trick ads
    await viewAds(action);
    await skipAds(true, action);

    if (i == 0 && url.indexOf("&t=") > -1) {
      await sendKey(action.pid, "0");
    }

    await clickPlayIfPause(action.pid);

    if (i % 60000 == 0) {
      reportLive(action.pid);
      if (Math.random() < 0.3) {
        let randomScroll = randomRanger(2, 5);
        await userScroll(action.pid, randomScroll);
        await sleep(1000);
        await userScroll(action.pid, -randomScroll);
      }
    }

    if (
      action.is_sub &&
      i > action.sub_time &&
      i <= action.sub_time + interval
    ) {
      if (!document.querySelector("#notification-preference-toggle-button")) {
        let subBtn = document.querySelector("#subscribe-button-shape");
        await userClick(action.pid, "#subscribe-button-shape", subBtn);
        action.is_sub = false;
        await setActionData(action);
      }
    }

    if (
      action.is_like &&
      i > action.like_time &&
      i <= action.like_time + interval
    ) {
      await LikeOrDisLikeYoutubeVideo(action.pid, true);
      action.is_like = false;
      await setActionData(action);
    }

    if (
      action.is_comment &&
      i > action.comment_time &&
      i <= action.comment_time + interval
    ) {
      await CommentYoutubeVideo(action.pid, action.comment);
      action.is_comment = false;
      await setActionData(action);
    }

    await sleep(interval);

    await updateActionStatus(
      action.pid,
      action.id,
      1,
      action.playlist_url + "_" + i,
      false
    );
    action.lastRequest = Date.now();
    await setActionData(action);

    i += interval;
  }

  return true;
}

async function afterWatchingVideo(action, finishVideo) {
  let url = window.location.toString();
  if (action.url_type == "playlist") {
    await updateWatchedVideo(action.viewed_ads, action.pid);

    if (
      action.viewed_ads ||
      Math.abs(action.playlist_index - 1) > action.total_times_next_video ||
      url.indexOf(action.playlist_url) < 0
    ) {
      action._total_loop_find_ads += 1;
      await setActionData(action);

      if (Number(action.total_loop_find_ads) <= action._total_loop_find_ads) {
        await reportScript(action);
        return;
      }

      action.playlist_index = 1;
      action.viewed_ads = false;
      await getNewPlaylistData(action);
      await setActionData(action);

      if (isNonUser) {
        getPlaylistData(action);
        await setActionData(action);
        await goToLocation(
          action.pid,
          "https://www.youtube.com/playlist?list=" + action.playlist_url
        );
      } else {
        await goToLocation(
          action.pid,
          "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
        );
      }

      return;
    } else {
      action.viewed_ads = false;
      await setActionData(action);
      await nextVideo(action.pid);
      return;
    }
  }

  if (action.suggest) {
    if (action.after_video) {
      action.after_video = false;
      action.after = true;
      await setActionData(action);
      await userClickRandomVideo(action.pid);
      return;
    }
  }
  await updateWatchedVideo(action.viewed_ads, action.pid);

  let currentUrl = window.location.toString();
  if (currentUrl.indexOf(action.playlist_url) > -1) {
    await reportScript(action);
  } else {
    await reportScript(action, false);
  }
}

async function viewAds(action, onlyVideoType = false) {
  if (action.viewed_ads || !action.is_view_ads) {
    return;
  }

  let adsTypes = [
    ".ytp-ad-visit-advertiser-button",
    ".ytp-ad-player-overlay-flyout-cta",
  ];
  let isChecked = false;
  for await (let adsSelector of adsTypes) {
    let adsElement = document.querySelector(adsSelector);
    if (adsElement) {
      action.viewed_ads = true;
      await setActionData(action);
      return;
    }
  }
  return isChecked;
}

async function skipAds(watchingCheck, action = {}) {
  if (!watchingCheck) await sleep(2000);

  if (
    document.querySelector(".ytp-ad-skip-ad-slot") ||
    document.querySelector(".ytp-preview-ad")
  ) {
    while (
      document.querySelector(".ytp-ad-skip-ad-slot") ||
      document.querySelector(".ytp-preview-ad")
    ) {
      let adTimeCurrent = getTimeFromText(
        document.querySelector(".ytp-time-display .ytp-time-current")
          .textContent
      );
      let adTimeDuration = getTimeFromText(
        document.querySelector(".ytp-time-display .ytp-time-duration")
          .textContent
      );

      let adWatchTime;
      if (Math.random() < SKIP_ADS_PERCENT) {
        // skip ad
        if (adTimeDuration <= 30) {
          adWatchTime = getWatchAdTime(adTimeCurrent, 1, 10);
        } else {
          adWatchTime = getWatchAdTime(adTimeCurrent, 1, 28);
        }
      } else {
        // watch ad
        if (adTimeDuration <= 30) {
          adWatchTime = getWatchAdTime(adTimeCurrent, 12, adTimeDuration);
        } else {
          if (Math.random() < 0.1) {
            adWatchTime = getWatchAdTime(
              adTimeCurrent,
              0.9 * adTimeDuration,
              adTimeDuration
            );
          } else if (Math.random() < 0.4) {
            adWatchTime = getWatchAdTime(
              adTimeCurrent,
              Math.max(30, adTimeDuration * 0.5),
              adTimeDuration * 0.9
            );
          } else {
            adWatchTime = getWatchAdTime(
              adTimeCurrent,
              30,
              Math.max(30, adTimeDuration * 0.5)
            );
          }
        }
      }
      await sleep(adWatchTime * 1000);

      let buttonSkipAd;
      let attempts = 0;
      const maxAttempts = 20;
      while (attempts < maxAttempts) {
        buttonSkipAd =
          document.querySelector("button.ytp-ad-skip-button") ||
          document.querySelector(".ytp-ad-skip-button-modern");

        if (buttonSkipAd && buttonSkipAd.getBoundingClientRect().x) {
          break;
        }

        attempts++;
        await sleep(1000);
      }

      action.viewed_ads = true;
      await setActionData(action);

      if (buttonSkipAd) await userClick(action.pid, "", buttonSkipAd);
      await sleep(2000);
    }
  }
}

async function processBrowserFeature(action) {
  if (action.home) {
    await sleep(3000);
    let scroll = randomRanger(3, 7);
    for (let i = 0; i < scroll; i++) {
      await userScroll(action.pid, 10);
      let video = document.querySelector(
        'ytd-browse[page-subtype="home"] a#thumbnail[href*="' +
          action.playlist_url +
          '"]'
      );
      if (video) {
        await userClick(action.pid, action.playlist_url, video);
        return;
      }
    }
    if (action.other_videos.length >= CHANNEL_VIDEO_WATCH) {
      action.home = false;
      await setActionData(action);
      await userTypeEnter(
        action.pid,
        "input[name='search_query']",
        action.video
      );
    } else {
      if (action.channel_videos.length) {
        let otherVideo = document.querySelector(
          `${action.channel_videos
            .map(
              (x) =>
                `ytd-browse[page-subtype="home"] a#thumbnail[href*="${x}"]${action.other_videos
                  .map((v) => `:not([href*="${v}"])`)
                  .join("")}`
            )
            .join(",")}`
        );
        if (otherVideo) {
          action.other_videos.push(
            otherVideo.href.split("v=")[1].split("&")[0]
          );
          await setActionData(action);
          await userClick(action.pid, otherVideo.href, otherVideo);
          return;
        }
      }

      // find channel link
      if (action.channel_url) {
        let channel = document.querySelector(
          `ytd-browse[page-subtype="home"] a#avatar-link[href="${action.channel_url}"]`
        );
        if (channel) {
          await userClick(action.pid, action.channel_url, channel);
        } else {
          await goToLocation(action.pid, action.channel_url);
        }
      } else {
        await userTypeEnter(
          action.pid,
          "input[name='search_query']",
          action.video
        );
      }
    }
  }
}

async function processPlaylistPage(action) {
  if (document.querySelector(".shuffle-button")) {
    if (document.querySelectorAll(".shuffle-button").length > 1) {
      if (!elementInViewport(".shuffle-button")) {
        let btn = document.querySelectorAll(".shuffle-button").item(1);
        await userClick(action.pid, ".shuffle-button 1", btn);
      } else {
        await userClick(action.pid, ".shuffle-button");
      }
    } else {
      await userClick(action.pid, ".shuffle-button");
    }
  } else {
    let playBtn = document.querySelector(
      '#button > yt-icon > svg > g > path[d="M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z"]'
    );
    if (playBtn) {
      await userClick(action.pid, "", playBtn);
    } else {
      await userClick(
        action.pid,
        "ytd-playlist-sidebar-primary-info-renderer #thumbnail.ytd-playlist-thumbnail"
      );
    }
  }
}

async function processSearchPage(action) {
  let url = window.location.toString();

  if (action.preview == "search") {
    await userScroll(action.pid, randomRanger(20, 50));
    await sleep(randomRanger(1000, 5000));
    await userClickRandomVideo(action.pid);
    return;
  }

  let suggestWatchSearch = await processSearchSuggest(action);
  if (suggestWatchSearch) return;


  let videoSelector =
    'ytd-two-column-search-results-renderer .ytd-section-list-renderer a#thumbnail[href*="' +
    action.playlist_url +
    '"]';
  let element;

  if (!action.filter || url.indexOf("253D%253D") > -1) {
    let randomScroll = randomRanger(3, 5);
    while (randomScroll > 0 && !element) {
      await userScroll(action.pid, 10);
      await sleep(1000);
      randomScroll -= 1;
      element = document.querySelector(videoSelector);
    }
  }

  if (element) {
    if (Math.random() < SEARCH_SKIP) throw "SEARCH_SKIP";
    if (action.suggest_search) {
      let otherVideos = document.querySelectorAll(
        'ytd-two-column-search-results-renderer .ytd-section-list-renderer a#thumbnail:not([href*="' +
          action.playlist_url +
          '"])'
      );
      if (otherVideos.length > 0) {
        let videoId = otherVideos[randomRanger(0, otherVideos.length - 1)].href;
        videoId = videoId.substr(videoId.indexOf("?v=") + 3, 11);
        videoSelector =
          'ytd-two-column-search-results-renderer .ytd-section-list-renderer a#thumbnail[href*="' +
          videoId +
          '"]';
      }
    } else if (action.page || action.suggest || action.home) {
      let channelLink =
        element.parentElement.nextElementSibling.querySelector(
          "#channel-info > a"
        );
      action.channel_url = channelLink.href;
      action.filter = action.filter ? action.filter - 1 : undefined;
      await setActionData(action);
      await userClick(
        action.pid,
        action.playlist_url + " channel-info",
        channelLink,
        "",
        5
      );
    } else {
      await userClick(action.pid, videoSelector);
    }
    await sleep(3000);
  } else if (action.url_type == "video") {
    await goToLocation(
      action.pid,
      "https://www.youtube.com/watch?v=" + action?.playlist_url
    );
    return;
  } else if (action.url_type == "playlist") {
    let filter = action.filter ? action.filter + 1 : 1;
    if (filter > 2) {
      await updateActionStatus(action.pid, action.id, 0, "playlist not found");
      return;
    } else {
      action.filter = filter;
      await setActionData(action);
    }

    await userScrollTo(action.pid, "#filter-menu a > #button");
    await sleep(1000);
    await userClick(action.pid, "#filter-menu a > #button");
    await sleep(2000);

    if (filter == 1) {
      // playlist
      await userClick(action.pid, 'a#endpoint[href*="EgIQAw%253D%253D"]');
    }
    if (filter == 2) {
      // today
      await userClick(action.pid, 'a#endpoint[href*="CAISAhAD"]');
    }
  } else {
    throw "unknown url_type";
  }
}

async function processWatchChannelPage(action, videoID = "") {
  let url = window.location.toString();
  if (url.indexOf("/videos") > -1) {
    if (action.page) {
      // process videos page
      let i = 50;
      
      while (
        i > 0 &&
        !document.querySelector(`a[href="/watch?v=${action.playlist_url}"]`)
      ) {
        await userScroll(action.pid, 5);
        await sleep(1000);
        i--;
      }
      let video = document.querySelector(`a[href="/watch?v=${action.playlist_url}"]`)
      console.log("video", video)
      if (video) {
        await userClick(
          action.pid,
          `a[href="/watch?v=${action.playlist_url}"]`,
          video
        );
        await sleep(2000);
      } else {
        throw "video in page not found";
      }
    } else {
      if (videoID) {
        let video = document.querySelector(
          '#contents ytd-rich-grid-row ytd-rich-item-renderer a#thumbnail[href*="' +
            videoID +
            '"]'
        );
        if (video) {
          await userClick(action.pid, "video", video);
        }
        return;
      }
      // watch other video for suggest or browser feature
      if (!Array.isArray(action.other_videos)) {
        action.other_videos = [];
      }
      //let watched_videos = action.other_videos.map(x => `:not([href*="${x}"])`).join("")
      let videos = [
        ...document.querySelectorAll(
          `ytd-two-column-browse-results-renderer .ytd-rich-item-renderer a#thumbnail.inline-block`
        ),
      ];
      let video;
      if (videos.length) {
        video = videos[randomRanger(0, Math.min(videos.length - 1, 15))];
        await setActionData(action);
      } else {
        video = document.querySelector(
          'ytd-two-column-browse-results-renderer[page-subtype="channels"] .ytd-section-list-renderer a#thumbnail[href*="' +
            action.playlist_url +
            '"]'
        );
      }
      await userClick(action.pid, "video", video);
      await sleep(2000);
    }
  } else {
    // click videos tab
    let videoTab = document
      .querySelectorAll("#tabsContent .tab-content")
      .item(1);
    if (videoTab) {
      await userClick(action.pid, "#tabsContent .tab-content", videoTab);
    } else if (
      document.querySelector(
        '#title-text > a.yt-simple-endpoint[href*="/videos?"]'
      )
    ) {
      await userClick(
        action.pid,
        '#title-text > a.yt-simple-endpoint[href*="/videos?"]'
      );
    } else {
      throw "no videos link";
    }
  }
}

async function processSearchSuggest(action) {
  let url = window.location.toString();
  if (action.suggest_videos) {
    // get public days
    try {
      action.public_days =
        action.public_days == undefined
          ? action.url_type == "video"
            ? (await getPublicDays(action.playlist_url)).data
            : 7
          : action.public_days;
      await setActionData(action);
    } catch (e) {
      console.log("getPublicDays err:", e);
    }

    // check public days
    if (action.public_days <= 1 / 24 && url.indexOf("253D%253D") < 0) {
      // filter by hour
      await userClick(action.pid, "#filter-menu a > #button");
      await sleep(2000);
      await userClick(action.pid, 'a#endpoint[href*="EgIIAQ%253D%253D"]');
    } else if (
      action.public_days <= 1 / 24 &&
      Array.from(
        document.querySelectorAll(
          "ytd-two-column-search-results-renderer .ytd-section-list-renderer a#thumbnail"
        )
      ).length < 20
    ) {
      // filter by hour by not enough results
      action.public_days = 1;
      await setActionData(action);
      await userClick(action.pid, "#search-icon-legacy");
    } else if (action.public_days <= 1 && url.indexOf("253D%253D") < 0) {
      // filter by day
      await userClick(action.pid, "#filter-menu a > #button");
      await sleep(2000);
      await userClick(action.pid, 'a#endpoint[href*="EgIIAg%253D%253D"]');
    } else if (action.public_days <= 7 && url.indexOf("253D%253D") < 0) {
      // filter by week
      await userClick(action.pid, "#filter-menu a > #button");
      await sleep(2000);
      await userClick(action.pid, 'a#endpoint[href*="EgIIAw%253D%253D"]');
    } else if (action.public_days <= 30 && url.indexOf("253D%253D") < 0) {
      // filter by month
      await userClick(action.pid, "#filter-menu a > #button");
      await sleep(2000);
      await userClick(action.pid, 'a#endpoint[href*="EgIIBA%253D%253D"]');
    } else {
      let randomScroll;
      if (
        action.url_type == "video" &&
        (action.public_days == undefined || action.public_days > 1)
      ) {
        randomScroll = randomRanger(0, 9);
      } else {
        randomScroll = randomRanger(0, 4);
      }
      if (randomScroll > 0) {
        await userScroll(action.pid, randomScroll * 5);
      }
      await sleep(randomRanger(1000, 5000));
      await userClickRandomVideo(action.pid);
    }
    return true;
  }
}

async function processWatchPage(action) {
  await preWatchingVideo(action);
  let finishVideo = await watchingVideo(action);
  await afterWatchingVideo(action, finishVideo);
}

async function getReact(keyword, totalTime) {
  let like = false;
  let dislike = false;
  let sub = false;
  let comment;
  if (
    Math.random() <
    (action.like_percent ? action.like_percent / 1000 : LIKE_PERCENT)
  ) {
    if (Math.random() < 0.95) {
      like = true;
    } else {
      dislike = true;
    }
  }

  let commentPercent = action.like_percent
    ? action.like_percent / 1000
    : document.querySelector("#chatframe")
    ? COMMENT_PERCENT * 10
    : COMMENT_PERCENT;

  if (Math.random() < commentPercent) {
    comment = await getComment(keyword);
    comment = comment.data;
  }

  if (Math.random() < VIEW_SUB_PERCENT) {
    sub = true;
  }

  let likeTime = like || dislike ? randomRanger(10000, totalTime) : 0;
  let commentTime = comment ? randomRanger(10000, totalTime) : 0;
  let subTime = sub ? randomRanger(10000, totalTime) : 0;

  let react = {
    like: like,
    dislike: dislike,
    comment: comment,
    like_time: likeTime,
    comment_time: commentTime,
    sub: sub,
    sub_time: subTime,
  };

  return react;
}

async function LikeOrDisLikeYoutubeVideo(pid, isLike) {
  try {
    const likeBtn = document.querySelectorAll(".ytLikeButtonViewModelHost")[0] || document.querySelectorAll(".YtLikeButtonViewModelHost")[0];
    const dislikeBtn = document.querySelectorAll(
      ".ytDislikeButtonViewModelHost"
    )[0] || document.querySelectorAll(
      ".YtDislikeButtonViewModelHost"
    )[0];
    let index;
    if (isLike) {
      index = 0;
    } else {
      index = 1;
    }
    let btnClick = isLike ? likeBtn : dislikeBtn;
    if (btnClick) {
      await userClick(action.pid, "btnClick", btnClick);
    }
  } catch (e) {
    console.log("LikeOrDisLikeYoutubeVideo pid: ", pid, " err: ", e);
  }
}

async function CommentYoutubeVideo(pid, msg = "") {
  try {
    if (!msg) {
      let commentRs = await getComment();
      msg = commentRs && commentRs.comment;
    }

    if (!msg) return;
    await sleep(2000);

    await userScroll(pid, 10);

    if (!document.querySelector("#placeholder-area")) {
      console.log("error", "NO COMMENT SECTION");
      return;
    }

    await userClick(pid, "#placeholder-area");
    await sleep(randomRanger(1000, 2000));

    await userType(pid, "#contenteditable-textarea", msg);
    await sleep(randomRanger(1000, 2000));

    await userClick(pid, "#submit-button.ytd-commentbox");
    await sleep(randomRanger(1000, 2000));
    await userScroll(pid, -5);
    await updateWatchedVideo(false, action.pid);
  } catch (e) {
    console.log("error", "CommentYoutubeVideo", pid);
  }
}

async function clickPlayIfPause(pid) {
  let btnPlay = document.querySelector(
    '.ytp-play-button path[d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z"]'
  );
  if (btnPlay) {
    await userClick(pid, "button.ytp-play-button");
  }
}

function getCommentKeyword(videoId, keyword) {
  return keyword
    .split(" ")
    .filter((x) => x != videoId)
    .slice(0, randomRanger(3, 5))
    .join(" ");
}

function getTimeFromText(str) {
  try {
    let time = str.split(":");
    return time[0] * 60 + time[1] * 1;
  } catch (e) {
    return 0;
  }
}

function getWatchAdTime(currentTime, minTime, maxTime) {
  minTime = Math.round(minTime);
  maxTime = Math.round(maxTime);
  let adWatchTime = randomRanger(minTime, maxTime) - currentTime;
  return adWatchTime > 0 ? adWatchTime : 0;
}

function removeSuggest() {
  try {
    if (action.remove_suggest) {
      let element = document.querySelector("#columns #secondary #related");
      if (element) {
        element.parentNode.removeChild(element);
      }
    }
  } catch (e) {
    console.log("error", "removeSuggest", e);
  }
}


function randomString() {
  return Math.random().toString(36).substring(2);
}
