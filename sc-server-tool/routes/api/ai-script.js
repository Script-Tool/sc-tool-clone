const express = require('express');
const router = express.Router();
const scriptGptModule = require('../../modules/gpt-script')
const fs = require('fs')
const apiYoutube = require('../../src/utils/callApiYoutube')
/*
* Người sửa: Đinh Văn Thành
* Ngày sửa: 25-04-2024
* Lý do: thay đổi api https://www.googleapis.com/youtube/v3 sang api mới và tối ưu lại source code
* Method : POST
* tham só truyền vào: name là tên của video muốn tìm kiếm
*/
function formatTime(time) {
  if(time.length == 2){
    return `PT${time[0]}M${time[1]&&time[1] != '00'? time[1]:''}`
  }else{
    return `PT${time[0]}H${time[1]&&time[1] != '00'? time[1]:''}M${time[2]&&time[2] != '00'? time[2]:''}S`
  }
}
router.get('/videos', async function (req, res) {
  let name = req.query.name
  if (name && name != 'undefined') {
    try {
      const response = await apiYoutube.getVideoFroName(name)
      if (response) {
        let videos = response.map(video => {
          let time = video.lengthText.split(':')
          return{
            id: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail[0].url,
            channel_title: video.channelTitle,
            publish_time: video.publishedTimeText,
            channel_id: video.channelId,
            viewCount: formatTime(time) != 'PT1M' ? video.viewCount : null 
          }
        })
        res.json({ videos })
      }
    } catch (error) {
      res.json({ success: false })
    }
  }
})
//================= END ===========================================
router.post('/', async function (req, res) {
  try {
    let payload = req.body

    let rs = await scriptGptModule.generateScript(payload)
    let result = {
      success: true,
      script: rs,
      videos: []
    }
    if (rs) {
      try {
        let name = rs.match(/\"(.*)\"/)[1]
        if (name) {
          result.video_name = name
        }
      } catch (error) {
        console.log(error);
      }
    }
    return res.json(result)
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.post('/save', async function (req, res) {
  try {
    let payload = req.body
    let data = payload
    if (!fs.existsSync('./public/files')) {
      fs.mkdirSync('./public/files')
    }
    fs.writeFileSync('./public/files/script-config.json', JSON.stringify(data))
    return res.json({ success: true })
  }
  catch (e) {
    return res.json({ success: false })
  }
})

module.exports = router;
