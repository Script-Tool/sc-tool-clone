const redis = require('../src/redis-server/redis')
const CONFIG = require('../config/config')
global.newProfiles = []
global.okProfiles = []

module.exports = {
  insert: async function (rows) {
    try{
      let Proxy = getModel('Proxy')
      for await (let row of rows) {
        await Proxy.create({
          server: row[0],
          username: row[1],
          password: row[2],
        })
      }
      await Proxy.reloadGlobalProxy()
      return { success: true }
    }
    catch (e) {
        console.log('error','insertProxy err: ',e)
        return {err: e}
    }
  },
  deleteAll: async function () {
    try{
      let proxyModel = await getModel('Proxy')
      await proxyModel.DeleteMany({})
      return 1
    }
    catch (e) {
        console.log('error', 'delete profile error: ', e)
        return 0
    }
  }
}