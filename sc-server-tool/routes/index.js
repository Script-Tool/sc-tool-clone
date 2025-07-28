const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const md5 = require('md5');

// Route để hiển thị trang Script Creator
router.get('/script-creator', async function(req, res) {
  let scriptConfigs;
  if (fs.existsSync('./public/files/script-config.json')) {
    scriptConfigs = fs.readFileSync('./public/files/script-config.json');
  } else {
    scriptConfigs = fs.readFileSync('./routes/script-config-old.json');
  }

  let script_inputs = JSON.parse(scriptConfigs);
  for (let script_input of script_inputs) {
    if (!script_input.options) {
      script_input.options = [];
    }
    script_input.code = Math.floor(Math.random() * 100000);
    for (let option of script_input.options) {
      option.code = Math.floor(Math.random() * 10000);
    }
  }

  const rs = { 
    title: 'Script Creator', 
    script_inputs, 
    manage: req.query.manager_sc ? true : false,
    gpt_script_template: youtube_config.gpt_script_template,
    gpt_script_template_suffix: youtube_config.gpt_script_template_suffix,
  };

  res.render('script-creator/index.ejs', rs);
});

// Route để kiểm tra playlist
router.get('/playlist-test', async function(req, res) {
  const { keyword, maxResults, suggest_channel, customer, api_key, tags } = req.query;
  
  const rs = await getModel('Playlist').loadCreatePlaylistServices(keyword, { 
    maxResults, 
    suggest_channel, 
    customer,
    api_key,
    tags: tags || '',
  });

  res.send(rs);
});

// Route để báo cáo nâng cấp
router.get('/report-upgrade', async function(req, res) {
  const { vmId } = req.query;
  let vmNameSelected = '';

  if (vmId) {
    vmRunnings.forEach(vm => {
      if (vmId == vm.vm_id) {
        vmNameSelected = vm.vm_name;
        updateVmFlag.forEach(_vm => {
          if (_vm.vm_name == vm.vm_name) {
            _vm.updated++;
          }
        });

        vm.updated = true;
      }
    });

    if (vmRunnings.every(_vm => _vm.vm_name != vmNameSelected || _vm.updated)) {
      updateVmFlag = updateVmFlag.filter(_vm => _vm.vm_name != vmNameSelected);
    }
  }

  return res.send({ success: true });
});

// Route để đổi mật khẩu
router.post('/change-pass', async function(req, res) {
  const { username, password, new_password } = req.body;

  if (!username || !password || !new_password) {
    return res.send({ error: 'Missing data.' });
  } 

  const UserModel = await getModel('User');
  const hashedPassword = md5(password);
  const user = await UserModel.findOne({ username, password: hashedPassword });

  if (user) {
    const token = md5(`${user.username}-${Date.now()}`);
    const newHashedPassword = md5(new_password);
    await user.updateOne({ password: newHashedPassword, tokens: [token] });

    return res.send({ success: true, token, cookie_name: secret, message: 'Change password successfully.' });
  } else {
    return res.send({ error: 'username or password incorrect.' });
  }
});

// Route để đăng nhập
router.post('/login', async function(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send({ error: 'Missing data.' });
  } 

  const UserModel = await getModel('User');
  const hashedPassword = md5(password);
  const user = await UserModel.findOne({ username, password: hashedPassword });

  if (user) {
    const token = md5(`${user.username}-${Date.now()}`);
    await user.updateOne({ $addToSet: { tokens: token } });
    return res.send({ success: true, token, cookie_name: secret });
  }

  return res.send({ error: 'Username or Password incorrect.' });
});

// Route để hiển thị trang đăng nhập
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

// Route mặc định, chuyển hướng đến trang dashboard
router.get('/', function(req, res, next) {
  res.redirect('/admin/view/dashboard');
});

// Route để kiểm tra cập nhật
router.get('/get-to-update', function(req, res, next) {
  const { vmId } = req.query;
  const data = {};

  if (vmRunnings.some(vm => vm.vm_id == vmId && !vm.updated)) {
    data.upgradeTool = true;
  }
 
  if (flagForResetProfiles) {
    data.resetAllItem = true;
  }

  res.send(data);
});

// Route để lấy cấu hình hệ thống
router.get('/oam/api-system-config', async function(req, res) {
  try {
    const data = {
      ...youtube_config,
      browser_mobile_percent: youtube_config.mobile_percent,
      ads_percent: youtube_config.ads_percent,
    };
  
    delete data.suggest_percent;
    delete data.page_watch;
    delete data.direct_percent;
    delete data.search_percent;
  
    if (req.query.isGetMobile) {
      data.active_devices = active_devices;
    }

    return res.send(data);
  } catch (error) {
    delete youtube_config.suggest_percent;
    delete youtube_config.page_watch;
    delete youtube_config.direct_percent;
    delete youtube_config.search_percent;
    return res.send(youtube_config);
  }
});

// Route để lấy video ngẫu nhiên
router.get('/YTVideo', async function (req, res) {
  let playlist = {};

  if (req.query.isGetMobile) {
    const viewTypes = [
      { key: 'suggest_percent', sort: youtube_config.suggest_percent, percent: 0 },
      { key: 'page_watch', sort: youtube_config.page_watch, percent: 0 },
      { key: 'home_percent', sort: youtube_config.home_percent, percent: 0 },
      { key: 'direct_percent', sort: youtube_config.direct_percent, percent: 0 },
      { key: 'search_percent', sort: youtube_config.search_percent, percent: 0 },
      { key: 'google_percent', sort: youtube_config.google_percent, percent: 0 },
    ];
  
    viewTypes.forEach(element => {
      playlist[element.key] = element.sort;
    });

    const YtVideo = await getModel('YoutubeVideo');
    const countRs = await YtVideo.countDocuments();
    const randomPosition = Math.floor(Math.random() * countRs);
    const video = await YtVideo.findOne().skip(randomPosition);
    playlist = { ...video.toObject(), ...playlist };
  } else {
    const Playlist = await getModel('Playlist');
    const countRs = await Playlist.countDocuments();
    const playlistData = await Playlist.findOne().skip(Math.floor(Math.random() * countRs));

    if (playlist) {
      playlist.playlist_url = playlist.data;
      playlist.playlist_percent = 100;
      playlist.url_type = 'playlist';
      playlist.total_times = 1;
      playlist.playlist_index = playlist.total_times;

      if (playlist.sub_percent && Math.random() < Number(playlist.sub_percent) / 1000) {
        playlist.is_sub = true;
      }
    }
  }

  if (!playlist.sub_percent && Math.random() < Number(youtube_config.sub_percent) / 1000) {
    playlist.is_sub = true;
  }

  res.send({ playlist });
});

module.exports = router;