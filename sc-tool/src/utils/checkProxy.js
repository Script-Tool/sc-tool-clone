const axios = require("axios");

async function checkProxy(proxy, username, password) {
  const [ip, port] = proxy.split(":");

  const response = await axios.get("http://api.ipify.org?format=json", {
    proxy: {
      host: ip,
      port: parseInt(port),
      auth: {
        username,
        password,
      },
    },
    timeout: 5000,
  });
}

module.exports = checkProxy;
