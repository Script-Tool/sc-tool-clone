/**
 * Thực hiện đánh gái sao google map
 * @param {*} action
 * @returns
 */
async function scriptMap(action) {
  try {
    let url = window.location.toString();

    if (url.includes(action.directLink)) {
      await goToLocation(action.pid, action.seach_data);
      return;
    }

    if (url.indexOf("google.com/maps/place") > -1) {
      if (
        document.querySelector('a[href*="ServiceLogin"]') ||
        document.querySelector('a[aria-label="Sign in"]')
      ) {
        await updateActionStatus(
          action.pid,
          action.id,
          false,
          "Chưa Login"
        );
      }
      await sleep(5000);
      await setActionData(action);
      let btnSelector =
        'img[src="//www.gstatic.com/images/icons/material/system_gm/1x/rate_review_gm_blue_18dp.png"]';
      await waitForSelector(btnSelector);

      let reviewBtn = document.querySelector(btnSelector);

      if (reviewBtn) {
        reviewBtn.scrollIntoViewIfNeeded();
        let pos = getElementPosition(reviewBtn);
        await updateUserInput(
          action.pid,
          "CLICK",
          pos.x + 30,
          pos.y,
          0,
          0,
          "",
          reviewBtn
        );
        await waitForSelector(
          'iframe[name="goog-reviews-write-widget"]',
          30000
        );

        let iframe = document.querySelector(
          'iframe[name="goog-reviews-write-widget"]'
        );

        // Thực hiện đánh giá sao
        if (iframe) {
          await sleep(5000);
          if (iframe.contentWindow.document.querySelector("textarea").value) {
            await reportScript(action, false);
          }

          // click buttun ! off noti
          const buttonElement = iframe.contentWindow.document.querySelector(
            "button.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-INsAgc"
          );
          const notiPopup = iframe.contentWindow.document.querySelector(
            'div.VfPpkd-z59Tgd[aria-hidden="true"]'
          );
          if (buttonElement && !notiPopup)
            await userClick(action.pid, "buttonElement", buttonElement, iframe);

          let comment =
            action.comments[randomRanger(0, action.comments.length - 1)];
          if (!comment) {
            let commentRs = await getComment();
            comment = commentRs && commentRs.comment;
          }
          await userTypeEnter(action.pid, "textarea", comment, "", iframe);

          let starRating = getRating(action) - 1;

          // click start

          let star =
            iframe.contentWindow.document
              .querySelectorAll('div[role="radiogroup"] div')
              .item(starRating) ||
            iframe.contentWindow.document
              .querySelectorAll('div[role="radio"]')
              .item(starRating);
          await userClick(action.pid, "", star, iframe);

          await sleep(3000);
          // comment

          let btns = iframe.contentWindow.document.querySelectorAll(
            "div[data-is-touch-wrapper] button"
          );

          await sleep(3000);
          let postBtn = btns.item(3);
          await userClick(action.pid, "", postBtn, iframe);
          await sleep(9000);
          await reportScript(action);
        }
      } else {
        return false;
      }
    } else if (url.indexOf("google.com/maps/@") > -1) {
      await goToLocation(action.pid, action.seach_data);
      return;
    } else {
      await reportScript(action, false);
    }
  } catch (error) {
    console.log("err", error);
    await reportScript(action, false);
  }
}

function getRating(action) {
  let star5 = Number(action["5_star_percent"]) || 0;
  let star4 = Number(action["4_star_percent"]) || 0;
  let star3 = Number(action["3_star_percent"]) || 0;
  let rateRd = randomRanger(0, star5 + star4 + star3);
  let rate = 5;
  if (rateRd <= star3) {
    rate = 3;
  } else if (rateRd <= star3 + star4) {
    rate = 4;
  }

  return rate;
}
