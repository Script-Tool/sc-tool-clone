async function scriptSearch(action) {
  try {
    let url = window.location.toString()

    if (url.indexOf('https://consent.youtube.com/m') > -1) {
        try {
            let btnRejectAll = document.querySelectorAll('form').item(1)
            if (btnRejectAll) {
                await userClick(action.pid, 'btnRejectAll', btnRejectAll)
            } else {
                await goToLocation(action.pid,'accounts.google.com')
                await sleep(60000)
            }
            return
        } catch (error) {
            console.log(error);
        }
    }

    if (url.indexOf('https://www.google.com/search?q') > -1) {
      let site = getElementContainsInnerText('cite', action.site_url)
      if (site) {
        await userClick(action.pid, '', site)
      } else {
        await searchKeyword(action)
      }
    } else if (url.indexOf('https://www.google.com/') > -1) {
      let btnRejectAll = getElementContainsInnerText('div', 'Accept all')
      if (btnRejectAll) {
          await userClick(action.pid, 'btnRejectAll', btnRejectAll)
          await sleep(15000)
      }

      await searchKeyword(action)

      await sleep(60000)
    } else if (url.indexOf(action.site_url) > -1) {
      await sleep(3000)
      let randomScroll = randomRanger(3,10)
      await userScroll(action.pid, randomScroll)
      await sleep(10000)
      await reportScript(action)
    } else {
      await reportScript(action, false)
    }
  } catch (error) {
    console.log(error);
  }
}

async function searchKeyword (action) {
  if (action.search_keywords.length) {
    let keyword = action.search_keywords.shift()
    await setActionData(action)

    await goToLocation(action.pid, 'google.com/search?q=' + keyword)
   // await userTypeEnter(action.pid,'input[maxLength="2048"]', keyword)
  } else {
    // handle end script
    await reportScript(action, false)
  }
}
