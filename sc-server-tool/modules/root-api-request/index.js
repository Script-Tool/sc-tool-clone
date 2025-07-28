const axios = require('axios')
module.exports = {
  request: function (options) {
    const access_key = process.env.SECRET
    let rootServerPath = process.env.MAIN_SERVER

    if (options.url == '/service/start' && options.data.order.package && options.data.order.package.script_code == 'watch_video') {
      rootServerPath = process.env.VPS_SERVER
    }

    if (options.url == '/service/start' && options.data.order.package && options.data.order.package.script_code == 'verify_mail') {
      rootServerPath = process.env.REG_SERVER
    }

    if (options.url.indexOf('/playlist') > -1) {
      rootServerPath = process.env.PLAYLIST_SERVER
    }

    let data = {
      ...options,
      headers: { 'access_key': access_key },
      url: rootServerPath + options.url
    }
    return axios(data)
  }
}
