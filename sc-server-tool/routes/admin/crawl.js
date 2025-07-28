const express = require('express');
var router = express.Router();
const fs = require('fs');
const ytdl = {}//require('ytdl-core');
const TikTokScraper = {} // require('tiktok-scraper');
//const fetch = require("node-fetch");
var router = express.Router();

router.post('/crawl-video-from-link', async function (req, res) {
  let folderVideo = './video-crawl'
  if (!fs.existsSync(folderVideo)) {
    fs.mkdirSync(folderVideo)
  }

  try {
    let data = req.body
    if (data.link) {
      if (data.link.indexOf('youtube.com') > -1) {
        ytdl(data.link).pipe(fs.createWriteStream(folderVideo + '/video.mp4'));

      } else if (data.link.indexOf('tiktok.com') > -1) {
        const headers = {
          "User-Agent": "BOB",
          "Referer": "https://www.tiktok.com/",
          "Cookie": "tt_webid_v2=BOB"
        }
      
        const videoMeta = await TikTokScraper.getVideoMeta(data.link, headers);
        const url = videoMeta.collector[0].videoUrl
        // fetch(url, { headers: videoMeta.headers }).then(res =>
        //   new Promise((resolve, reject) => {
        //     const dest = fs.createWriteStream(folderVideo+ "/tmp.mp4");
        //     res.body.pipe(dest);
        //     res.body.on("end", () => resolve("it worked"));
        //     dest.on("error", reject);
        //   })
        // )
        // .then(x => console.log(x));
      }
    }

    res.send({ success: true })
  }
  catch (e) {
    console.log('error', 'create video err: ', e)
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)