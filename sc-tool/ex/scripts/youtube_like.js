async function youtubeLike(action) {
  try {
    let url = window.location.toString()

    if (url.includes(action.directLink)) {
      await goToLocation(action.pid, 'youtube.com/channel_switcher?next=%2Faccount&feature=settings')
    }

    if (url.indexOf('support.google.com/accounts/answer/40039') > -1) {
      await updateActionStatus(action.pid, 'login', LOGIN_STATUS.ERROR, 'support.google.com/accounts/answer/40039')
      return
    }

    if (url.includes('accounts.google.com/v3/signin/identifier')) {
      await updateActionStatus(action.pid, 'login', LOGIN_STATUS.ERROR, 'accounts.google.com/v3/signin/identifier')
      return
    }


    if (url.includes('support.google.com/accounts/answer/40039') ||
      url.includes('accounts.google.com/v3/signin/productaccess/landing') ||
      url.includes('accounts.google.com/v3/signin/identifier')
    ) {
      await reportScript(action, 'ERROR_TYPE_1')
      return
    }

    if (url.includes('accounts.google.com/InteractiveLogin/signinchooser')) {
      // renew profile
      await resetProfile(action)
    }
    else if (url.indexOf('/videos') > -1) {
      await processWatchChannelPageLike(action)
    } if (url.indexOf('youtube.com/account') > -1) {
      await handleUsersSelection(action)
      return
    }
    else if (url.indexOf('google.com/search?q=') > -1) {
      await sleep(2000)
      await userClick(action.pid, '#search div h3')
    }
    else if (url == 'https://www.youtube.com/' || url == 'https://www.youtube.com/feed/trending') {
      await processHomePageLike(action)
    } else if (url.indexOf('youtube.com/feed/history') > -1) {
      await goToLocation(action.pid, 'https://www.youtube.com//')
      await sleep(60000)
    } else if (url.indexOf('https://www.youtube.com/results') > -1) {
      await processSearchPageLike(action)
    }
    else if (url.indexOf('https://www.youtube.com/watch') > -1 || url.indexOf('youtube.com/shorts') > -1) {
      await processWatchPageLike(action)
    }
    else if (url.indexOf('https://www.youtube.com/playlist?list=') > -1) {
      await processPlaylistPageLike(action)
    }
    else if (
      url.indexOf('youtube.com/@') > -1 ||
      url.indexOf('https://www.youtube.com/channel/') > -1 ||
      url.indexOf('https://www.youtube.com/user/') > -1 ||
      url.indexOf('https://www.youtube.com/c/') > -1
    ) {
      await processWatchChannelPageLike(action)
    }
    else if (url.indexOf('https://www.youtube.com/create_channel') == 0) {
      await createChannelLike(action)
    }
    else if (url.indexOf('https://myaccount.google.com/') == 0) {
      await goToLocation(action.pid, 'youtube.com//')
    }
    else if (url.indexOf('https://accounts.google.com/signin/v2/identifier') > -1 || url.indexOf('https://accounts.google.com/ServiceLogin') > -1) {
      throw 'NOT_LOGIN'
    }
    else if (window.location.toString().indexOf('youtube.com/oops') > -1 && document.querySelector('#alerts')) {
      throw new Error('NOT_LOGIN_' + document.querySelector('#alerts .yt-alert-message').textContent)
    }
    else if (url.indexOf('https://consent.youtube.com') > -1) {
      await updateActionStatus(action.pid, action.id, 0, 'consent.youtube.com')
    }
  }
  catch (e) {
    await reportScript(action, false)
  }
}

async function processHomePageLike(action) {
  await checkLogin(action)

  if (action.video_name) {
    if (action.channel_title) {
      action.video_name += ' ' + action.channel_title
    }
    await userTypeEnter(action.pid, "input[name='search_query']", action.video_name)
    return
  }

  if (action.video_id) {
    await goToLocation(action.pid, 'https://www.youtube.com/watch?v=' + action.video_id)
    return
  }

  if (action.channel_id) {
    await goToLocation(action.pid, 'https://www.youtube.com/' + action.channel_id + '/videos')
    return
  }

  await sleep(3000)
}

async function processPlaylistPageLike(action) {
  let playBtn = document.querySelector('#button > yt-icon > svg > g > path[d="M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z"]')
  if (playBtn) {
    await userClick(action.pid, '', playBtn)
  } else {
    await userClick(action.pid, 'ytd-playlist-sidebar-primary-info-renderer #thumbnail.ytd-playlist-thumbnail')
  }
}

async function processSearchPageLike(action, preventGoToChannel = false) {

  if (action.preview == "search") {
    await userScroll(action.pid, randomRanger(20, 50))
    await sleep(randomRanger(1000, 5000))
    await userClickRandomVideo(action.pid)
    return
  }

  let videoSelector = 'ytd-two-column-search-results-renderer .ytd-section-list-renderer a#thumbnail[href*="' + action.video_id + '"]'
  let element

  let randomScroll = randomRanger(3, 5)
  while (randomScroll > 0 && !element) {
    await userScroll(action.pid, 10)
    await sleep(1000)
    randomScroll -= 1
    element = document.querySelector(videoSelector)
  }

  if (element) {
    await userClick(action.pid, videoSelector)
    await sleep(3000)
  }
  else {
    let channel = getElementContainsInnerText('a', action.channel_title, '', 'contains')
    if (channel) {
      await userClick(action.pid, 'channel', channel)
    } else if (!preventGoToChannel) {
      if (action.channel_id) {
        await goToLocation(action.pid, 'https://www.youtube.com/' + action.channel_id + '/videos')
        return
      }
    }
  }
}



async function processWatchChannelPageLike(action) {
  let url = window.location.toString()

  if (url.indexOf('/videos') > -1 || url.indexOf('/shorts') > -1) {

    let video
    let randomScroll = randomRanger(3, 5)
    while (randomScroll > 0 && !video) {
      if (url.indexOf('/shorts') > -1) {
        video = document.querySelector('ytd-rich-grid-slim-media ytd-thumbnail a#thumbnail[href*="' + action.video_id + '"]')
      } else {
        video = document.querySelector('#content ytd-rich-grid-media ytd-thumbnail a#thumbnail[href*="' + action.video_id + '"]')
      }

      if (video) {
        break
      }
      await userScroll(action.pid, 10)
      await sleep(1000)
      randomScroll -= 1

    }

    await setActionData(action)
    if (video) {
      await userClick(action.pid, 'video', video)
      await sleep(2000)

    } else if (action.video_id) {
      await goToLocation(action.pid, 'https://www.youtube.com/watch?v=' + action.video_id)
      return
    }
  } else if (document.querySelector('#title-text > a.yt-simple-endpoint[href*="/videos?"]')) {
    // click videos tab
    await userClick(action.pid, '#title-text > a.yt-simple-endpoint[href*="/videos?"]')
  }
}

// xử lý nhấn nút like
async function handleLikeYoutube(action, endScript = true) {
  let url = window.location.toString()
  let likeBtn = document.querySelector("#top-level-buttons-computed like-button-view-model")

  action.data_reported = likeBtn.children[0].children[0].children[0]?.innerText
  if (likeBtn.children[0].children[0].children[0].getAttribute("aria-pressed") == "true") {
    // đã like
    await reportScript(action, false)
    return
  }

  if (url.indexOf('/shorts') > -1) {
    likeBtn = document.querySelector("ytd-toggle-button-renderer yt-button-shape")
  } 
  if (likeBtn) {
    await userClick(action.pid, 'likeBtn', likeBtn)
    await sleep(3000)
    if (endScript) {
      await reportScript(action)
    }
  } else {
    await reportScript(action, false)
  }
}

function loadVideoTime() {
  videoTime = document.querySelector('.ytp-time-duration').textContent.split(':')
  videoTime = videoTime.length == 2 ? videoTime[0] * 60 + videoTime[1] * 1 : videoTime[0] * 60 * 60 + videoTime[1] * 60 + videoTime[2] * 1
  return videoTime * 1000
}

async function processWatchPageLike(action) {
  let url = window.location.toString()
  await updateWatchedVideo(false, action.pid)

  await sleep(7000)
  await skipAds(true, action)

  let videoTime = loadVideoTime()
  if (!videoTime) {
    videoTime = 9999999
  }

  if (Number(action.watch_time) && videoTime > action.watch_time) {
    await sleep(Number(action.watch_time))
  }

  if (url.indexOf('youtube.com/shorts') > -1) {
    await sleep(3000)
    await handleLikeYoutube(action, false)
    action.subscribed = true
    await setActionData(action)
    await userClick(action.pid, '#channel-container #channel-info #avatar')
    await sleep(5000)
    await reportScript(action, false)
  } else {
    await sleep(5000)
    await handleLikeYoutube(action)
  }
}

async function createChannelLike(action) {
  await sleep(5000)
  for (let i = 0; i < 5; i++) {
    if (document.querySelector('button.create-channel-submit')) break
    await sleep(2000)
  }
  let firstName = document.querySelector('#create-channel-first-name')
  if (!firstName.value) {
    await userType(action.pid, '#create-channel-first-name', randomString(), firstName)
  }
  let lastName = document.querySelector('#create-channel-last-name')
  if (!lastName.value) {
    await userType(action.pid, '#create-channel-last-name', randomString(), lastName)
  }
  await userClick(action.pid, 'button.create-channel-submit')
}

function randomString() {
  return Math.random().toString(36).substring(2);
}