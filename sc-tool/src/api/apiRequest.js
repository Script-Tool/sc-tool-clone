const axios = require('axios');

function apiRequest(config) {
  const headers = {
    ...config.headers,
    api_key: process.env.API_KEY
  };

  return axios({
    ...config,
    headers
  });
}

module.exports = apiRequest;