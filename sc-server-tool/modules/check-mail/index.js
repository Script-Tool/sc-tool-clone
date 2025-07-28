const axios = require('axios')
module.exports = {
  checkMail: function (mails) {
    const gToolAPI_key = process.env.GTOOL_API_KEY

    let data = {
      headers: { 'ApiKey': gToolAPI_key },
      url: `https://gtool.chiennn.me/api/checker`,
      method: 'post',
      data: {
        "type": "gmail",
        "emails": mails
      }
    }

    return axios(data)
  }
}
