const express = require('express');
const proxy_model = require('../../model/proxy_model');
const rq = require('request-promise');
const multer = require('multer');
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
var router = express.Router();
const scriptGptModule = require('../../modules/gpt-script');

router.post(
  '/watch_video/import',
  upload.single('watchVideoFile'),
  async function (req, res) {
    try {
      const fileRows = [];
      let Service = getModel('Service');
      let APIKEY = getModel('APIKey');
      const YOUTUBE_API_KEY = await APIKEY.getRandomKey('youtube_api');
      csv
        .parseFile(req.file.path)
        .on('data', function (data) {
          fileRows.push(data);
        })
        .on('end', async function () {
          try {
            fileRows.shift();
            fs.unlinkSync(req.file.path); // remove temp file

            for await (let row of fileRows) {
              let rs = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos?id=${row[0]}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`
              );
              if (rs && rs.data) {
                let data = rs.data;
                let videoDetail = await axios
                  .get(
                    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${row[0]}&key=${YOUTUBE_API_KEY}`
                  )
                  .catch((er) => {
                    console.log(er);
                  });

                let serviceData = {
                  script_code: 'watch_video',
                  remaining: row[1],
                  start_max_time: 88888,
                  end_max_time: 88888,
                };

                if (videoDetail && videoDetail.data) {
                  serviceData.first_data_reported =
                    videoDetail.data.items[0].statistics.viewCount;
                }

                let scriptData = {
                  keyword: data.items[0].snippet.title,
                  playlist_url: row[0],
                  watch_time: '',
                  is_config_view_percent: 'false',
                  search_percent: '',
                  direct_percent: '',
                  suggest_percent: '',
                  page_percent: '',
                  like_percent: '',
                  comment_percent: '',
                  suggest_channel_ids: '',
                  channel_title: data.items[0].snippet.channelTitle,
                };

                serviceData.data = JSON.stringify(scriptData);

                await Service.create(serviceData);
              }
            }

            res.send({ success: true });
          } catch (e) {
            console.log('insert-profile-email err:', e);
            res.send(e);
          }
        })
        .on('error', function (e) {
          console.error('parse profile err:', e);
          res.send(e);
        });
    } catch (e) {
      console.log('insert-profile-email err:', e);
      res.send(e);
    }
  }
);

router.get('/update-is-break', async function (req, res) {
  try {
    let id = req.query.id;
    if (id) {
      let Script = await getModel('Script');
      let script = await Script.findOne({ _id: id });
      if (script) {
        script.is_break = !script.is_break;
        await script.save();
      }
    }
    res.send({});
  } catch (e) {
    console.log('insert-profile-email err:', e);
    res.send(e);
  }
});

router.get('/update-status', async function (req, res) {
  try {
    let id = req.query.id;
    if (id) {
      let Script = await getModel('Script');
      let script = await Script.findOne({ _id: id });
      if (script) {
        script.status = !script.status;
        await script.save();
      }
    }
    res.send({});
  } catch (e) {
    console.log('insert-profile-email err:', e);
    res.send(e);
  }
});

router.post(
  '/import-scripts',
  upload.single('scriptFile'),
  function (req, res) {
    try {
      const fileRows = [];
      csv
        .parseFile(req.file.path)
        .on('data', function (data) {
          fileRows.push(data);
        })
        .on('end', async function () {
          try {
            fileRows.shift();
            fs.unlinkSync(req.file.path); // remove temp file
            let Service = getModel('Service');

            for await (let row of fileRows) {
              await Service.create({
                script_code: row[1],
                data: `{
                                "channel_id": "${row[0]}",
                                "comment_percent": "",
                                "like_percent": "",
                                "sub_from_video_percent": ""
                              }`,
                remaining: 200,
                one_time: Boolean(row[3]),
                start_max_time: Number(row[2]),
                end_max_time: Number(row[2]),
                remaining: Number(row[4]) || 0,
                note: row[5],
              });
            }

            res.send({ success: true });
          } catch (e) {
            console.log('insert-profile-email err:', e);
            res.send(e);
          }
        })
        .on('error', function (e) {
          console.error('parse profile err:', e);
          res.send(e);
        });
    } catch (e) {
      console.log('insert-profile-email err:', e);
      res.send(e);
    }
  }
);

router.get('/update-position', async function (req, res) {
  try {
    let id = req.query.id;
    if (id) {
      let Script = await getModel('Script');
      let script = await Script.findOne({ _id: id });
      if (script && script.position) {
        await Script.updateOne(
          { position: script.position - 1 },
          { $inc: { position: 1 } }
        );
        await script.updateOne({ $inc: { position: -1 } });
        return res.send({ success: true });
      }
    }
    return res.send({ success: false });
  } catch (e) {
    console.log('error', 'create video err: ', e);
    res.send({ err: e });
  }
});

router.get('/add', async function (req, res) {
  try {
    let data = req.query;
    let Script = await getModel('Script');
    console.log(req.query);

    await Script.create(data);

    res.send({ success: true });
  } catch (e) {
    console.log('error', 'create video err: ', e);
    res.send({ err: e });
  }
});

router.get('/service/add', async function (req, res) {
  try {
    let data = req.query;
    let Service = await getModel('Service');
    await Service.create(data);

    res.send({ success: true });
  } catch (e) {
    console.log('error', 'create video err: ', e);
    res.send({ err: e });
  }
});

router.get('/delete', async function (req, res) {
  try {
    console.log('delete:', req.query);
    let id = req.query.id;
    let Script = await getModel('Script');
    await Script.deleteOne({ _id: id });
    res.send({});
  } catch (e) {
    console.log('error', 'update-playlist err: ', e);
    res.send({ err: e });
  }
});

router.get('/service/delete', async function (req, res) {
  try {
    let id = req.query.id;
    let Script = await getModel('Service');
    await Script.deleteOne({ _id: id });
    res.send({});
  } catch (e) {
    console.log('error', 'update-playlist err: ', e);
    res.send({ err: e });
  }
});

router.get('/', async function (req, res, next) {
  let Proxy = await getModel('Proxy');
  let proxyTotal = await Proxy.find({}).countDocuments();
  let proxyActive = await Proxy.find({
    updatedAt: {
      // 5 minutes ago (from now)
      $gt: new Date(Date.now() - 1000 * 60 * 5),
    },
  }).countDocuments();
  let proxyUnactive = proxyTotal - proxyActive;

  res.render('oam/proxy', {
    title: 'Proxy',
    info: { proxyUnactive, proxyActive, proxyTotal },
  });
});

router.get('/delete-all', async function (req, res) {
  try {
    let Proxy = await getModel('Proxy');
    await Proxy.deleteMany();
    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.post('/creation', async function (req, res) {
  try {
    let { payload } = req.body;
    let gptKey = req.query.gptKey;
    let rs = await scriptGptModule.generateScript(payload, gptKey);
    return res.json({ success: true, result: JSON.stringify(rs) });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error: JSON.stringify(error) });
  }
});

module.exports = express.Router().use(router);
