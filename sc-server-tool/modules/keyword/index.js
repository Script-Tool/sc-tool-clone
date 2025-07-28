let axios = require('axios')
const xmljs = require("xml-js");
var request = require('request-promise');
const utils = require('../../src/utils/utils');
var exec = require("child_process").exec;
let invalidKeys = utils.spamKeywords
//const HttpsProxyAgent = require("https-proxy-agent")

const limitTimeTrendMap = {
  '1': 'now%201-d',
  '7': 'now+7-d',
  '30': 'today%201-m',
  '90': 'today%203-m',
  '12': 'today%2012-m'
}

const limitTimeYoutubeApiMap = {
  '1': '1',
  '7': '7',
  '30': '30',
  '90': '90',
  '12': '360'
}

function getDateString (date) {
  date = limitTimeYoutubeApiMap[date]
  let dateOffset = (24*60*60*1000) * Number(date);
  let dateString = new Date()
  dateString.setTime(dateString.getTime() - dateOffset);
  dateString = dateString.toISOString()
  return dateString
}

async function getApiKey() {
  const APIKeyModel = getModel('APIKey')
  let key = await APIKeyModel.getRandomKey('youtube_api')
  return key || process.env.YOUTUBE_API_KEY
}

/**
 * Lấy các từ khóa gợi ý liên quan đến từ khóa tìm kiếm
 * @param {Object} options - Các tùy chọn để lấy từ khóa gợi ý
 * @param {string} options.keyword - Từ khóa tìm kiếm
 * @param {string} options.region - Mã khu vực (vd: "US", "VN")
 * @returns {Promise<string[]>} Mảng các từ khóa gợi ý
 */
async function getKeywords(options) {
  let { keyword, region } = options
  if (region) {
    region = '&gl=' + region
  } else {
    region = ''
  }

  keyword = decodeURI(keyword)
  keyword = encodeURI(keyword)

  //const httpsAgent = new HttpsProxyAgent({host: '194.124.76.165', port: "6119", auth: "dmyt:minhdo@123"})
  //axios = axios.create({httpsAgent});

  const rs = await axios({
    method:'GET',
    url: `https://suggestqueries.google.com/complete/search?output=toolbar${region}&q=${keyword}`,
    responseType:'arraybuffer'
  })

  let xmlData = rs.data.toString('latin1')
  const data = JSON.parse(
    xmljs.xml2json(xmlData, { compact: true, spaces: 2 })
  );

  let keywords = []
  if (data && data.toplevel && data.toplevel.CompleteSuggestion && data.toplevel.CompleteSuggestion.length) {
    for await (let item of data.toplevel.CompleteSuggestion) {
      const keyword = item.suggestion._attributes.data
      if (keyword) {
        if (!keywords.includes(keyword)) {
          keywords.push(keyword)
        }
      }
    }
  }

  return keywords
}

/**
 * Lấy kết quả tìm kiếm video từ YouTube dựa trên từ khóa
 * @param {Object} data - Dữ liệu để tìm kiếm video
 * @param {string} data.keyword - Từ khóa tìm kiếm
 * @param {string} data.limit_time - Thời gian giới hạn (vd: "7" cho 7 ngày gần nhất)
 * @param {string} data.region_code - Mã khu vực
 * @returns {Promise<Object>} Đối tượng chứa mảng videos và channels
 */
async function getSearchResults (data) {
  const apiKey = await getApiKey()

  let limitTime = ''
  if (data.limit_time) {
    limitTime = `&publishedAfter=${getDateString(data.limit_time)}`
  }

  let regionCode = ''
  if (data.region_code) {
    regionCode += `&regionCode=${data.region_code}`
  }

  let url = `https://youtube.googleapis.com/youtube/v3/search?order=viewCount${limitTime}${regionCode}&part=snippet&maxResults=40&q=${data.keyword}&type=video&key=${apiKey}`
  url = encodeURI(url)
  let response = await axios.get(url)
  .catch(err=> {console.log(err);return err})
  if (response && response.data && response.data.items) {
    if (response.data.error) {
      return { error: response.data.error }
    }

    let videos = []
    response.data.items.map(video => {
      if (!videos.some(_video => _video.channel_id == video.snippet.channelId)) {
        videos.push({
          id: video.id.videoId,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.default.url,
          channel_title: video.snippet.channelTitle,
          publish_time: video.snippet.publishTime,
          channel_id: video.snippet.channelId
        })
      }
    })

    let videosAfterFilterDuration = []
    let countCheckDuration = 0
    await Promise.all(videos.map(video => {
      return async function () {
        try {
          if (countCheckDuration < 6) {
            let response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${video.id}&key=${apiKey}`)
            // handle check duration
            let contentDetails = response.data.items[0].contentDetails
            if (contentDetails && contentDetails.duration && (contentDetails.duration.indexOf('M') > -1 && contentDetails.duration != 'PT1M')) {
              video.duration = contentDetails.duration
              let static = response.data.items[0].statistics
              video.total_view = Number(static.viewCount)

              videosAfterFilterDuration.push(video)
            }
  
            countCheckDuration++
          }
        } catch (error) {
          console.log('--->', error);
        }
      }()
    }))

    let channels = []
    await Promise.all(videos.map(video => {
      return async function () {
        try {
          const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&key=${apiKey}&id=${video.channel_id}`)
          const statis = response.data.items[0].statistics
          let channelData = response.data.items[0]
          channels.push({
            id: video.channel_id,
            channel_title: channelData.snippet.title,
            thumbnail: channelData.snippet.thumbnails.default.url,
            total_sub: Number(statis.subscriberCount)
          })
        } catch (error) {
          console.log('-->', error);
        }
      }()
    }))

    channels = channels.sort((a, b) => {
      if (a.total_sub > b.total_sub) {
        return -1
      } else {
        return 1
      }
    })

    return { videos: videosAfterFilterDuration.splice(0, 6), channels: channels.splice(0, 6) }
  }
}

/**
 * Lấy danh sách phát hàng đầu từ YouTube dựa trên từ khóa
 * @param {Object} data - Dữ liệu để lấy danh sách phát hàng đầu
 * @param {string} data.keyword - Từ khóa tìm kiếm
 * @param {number} data.limit - Số lượng danh sách phát tối đa
 * @returns {Promise<Object>} Đối tượng chứa mảng playlists
 */
async function getTopPlaylist (data) {
  const apiKey = await getApiKey()

  let limitTime = ''
  // if (data.limit_time) {
  //   limitTime = `&publishedAfter=${getDateString(data.limit_time)}`
  // }

  let regionCode = ''
  // if (data.region_code) {
  //   regionCode += `&regionCode=${data.region_code}`
  // }

  let url = `https://youtube.googleapis.com/youtube/v3/search?order=viewCount${limitTime}${regionCode}&part=snippet&maxResults=${data.limit || 15}&q=${data.keyword}&type=playlist&key=${apiKey}`
  url = encodeURI(url)
  let response = await axios.get(url)
  .catch(err=> {console.log(err);return err})
  if (response && response.data && response.data.items) {
    if (response.data.error) {
      return { error: response.data.error }
    }

    let playlists = []
    response.data.items.map(item => {
      playlists.push({
        id: item.id.playlistId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        channel_title: item.snippet.channelTitle,
        channel_id: item.snippet.channelId,
        //publish_time: video.snippet.publishTime,
      })
    })

    return { playlists }
  }
}


/**
 * Lấy các từ khóa thịnh hành từ Google Trends
 * @param {Object} options - Các tùy chọn để lấy từ khóa thịnh hành
 * @param {string} options.keyword - Từ khóa tìm kiếm
 * @param {string} options.region - Mã khu vực
 * @param {string} options.limit_time - Thời gian giới hạn (vd: "7" cho 7 ngày gần nhất)
 * @param {number} options.limit - Số lượng từ khóa tối đa
 * @returns {Promise<Object[]>} Mảng các đối tượng chứa từ khóa và dữ liệu liên quan
 */
async function getKeywordsFromTrend(options) {
  let { keyword, region, limit_time, limit } = options
  try {
    keyword = encodeURI(keyword)
    region = region == 'all' || !region ? '':`,"geo":"${region}"`
    let url = `https://trends.google.com.vn/trends/api/explore?tz=-420&req={"comparisonItem":[{"keyword":"${keyword}"${region},"time":"${limitTimeTrendMap[limit_time]}"}],"category":0,"property":"youtube"}`
    var optionsP = {
      'method': 'POST',
      'url': url,
      'headers': {
        'Accept': 'application/json',
        'Cookie': 'NID=511=X4OjXDxpJAD4i5qxrEU67gNadhWBnqTs0I4aEVVGkTfl7e_b6u4lroRIdCUEgclZaUOtJr8BTWmN_rxmWYiHLK4VcMi-YQUX4GoFddEDb_3HUpmT7kyntQyeex5L-MGqOrow6CpEqNxFRpr-SAEg4zclHxbtasX7A5K9cGcylgE'
      }            
    };
    let data = await request(optionsP)
    data = data.replace(')]}', '')
    data = data.replace(`'`, '')
    data = data.replace('undefined:1', '')
    data.trim()
    data = JSON.parse(data)

    let requestData = data.widgets.find(item => item.id == 'RELATED_QUERIES')
    let token = requestData.token
    requestData = requestData.request
   
    requestData = encodeURI('&req=' + JSON.stringify(requestData))

    let data2 = await request({
      'method': 'GET',
      'url': 'https://trends.google.com.vn/trends/api/widgetdata/relatedsearches?hl=vi&tz=-420' + requestData + '&token=' + token,
    })

    data2 = data2.replace(`)]}',`, '')
    data2 = JSON.parse(data2)
    let items = data2.default.rankedList[1].rankedKeyword
    if (!items || !items.length) {
      items = data2.default.rankedList[0].rankedKeyword
    }
    items = items.map(item => {
      delete item.link
      return item
    })

    if (limit) {
      items = items.splice(0, limit)
    }

    return items
  } catch (error) {
    console.log("error getKeywordsFromTrend", error?.statusCode);
  }
}

/**
 * Lấy dữ liệu thống kê cho từ khóa từ YouTube
 * @param {Object} data - Dữ liệu để lấy thống kê
 * @param {string} data.keyword - Từ khóa
 * @param {Object} item - Đối tượng chứa dữ liệu từ khóa (tùy chọn)
 * @returns {Promise<Object>} Đối tượng chứa dữ liệu thống kê cho từ khóa
 */
async function getDataKeyword(data, item = {}) {
  const apiKey = await getApiKey()
  const keyword = data.keyword

  let url = `https://youtube.googleapis.com/youtube/v3/search?order=viewCount&publishedAfter=${getDateString(30)}&part=id,snippet&q=${keyword}&maxResults=40&type=video&key=${apiKey}`
  url = encodeURI(url)
  let response = await axios.get(url)
  .catch(err=> {console.log(err);return err})
  if (response && response.data && response.data.items) {
    if (response.data.error) {
      return { error: response.data.error }
    }
    
    let data = {
      total_view: 0,
      total_like: 0,
      total_comment: 0
    }
    let count = 0
    const limitVideo = 6
    let channelIdChecked = []
    for await (let item of response.data.items) {
      if (channelIdChecked.some(channelId => channelId == item.snippet.channelId)) {
        continue
      } 

      if (count >= limitVideo) {
        break
      }
      let videoID = item.id.videoId
      try {
        let response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoID}&key=${apiKey}`)
        let contentDetails = response.data.items[0].contentDetails
        if (contentDetails && contentDetails.duration && (contentDetails.duration.indexOf('M') > -1 && contentDetails.duration != 'PT1M')) {
          let static = response.data.items[0].statistics
          data.total_view += Number(static.viewCount) || 0
          channelIdChecked.push(item.snippet.channelId)
          count++
        }
      } catch (error) {
        console.log('--->', error);
      }
    }

    if (data) {
      Object.assign(item, data)
    }
    return item
  } else {
    return item
  }
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array
}

function checkValidKeyword(keyword) {
  if (invalidKeys.some(invalidKey => keyword.indexOf(invalidKey) > -1)) {
    return false
  }

  return true
}

async function getKeywordFromPlaylistNames(data) {
  try {
    const apiKey = await getApiKey();
    let { keyword, limit } = data;
    let keywords = [];
    let maxResults = Number(limit) * 2;
    let total = 0;
    let nextPageToken = "";

    while (total < maxResults / 2) {
      let url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${keyword}&type=playlist&key=${apiKey}${nextPageToken}`;
      url = encodeURI(url);

      let response = await axios.get(url);

      if (response.data.error) {
        // Nếu có lỗi từ API, dừng vòng lặp và trả về mảng rỗng
        return [];
      }

      for await (let item of response.data.items) {
        let title = item.snippet.title;
        if (title.length > 20 && total <= maxResults / 2) {
          keywords.push(title);
          total++;
        }
      }

      if (!response.data.nextPageToken) {
        // Nếu không còn trang tiếp theo, dừng vòng lặp
        break;
      } else {
        nextPageToken = "&pageToken=" + response.data.nextPageToken;
      }
    }

    return keywords;
  } catch (error) {
    console.error("getKeywordFromPlaylistNames error:", error.code ); // In ra thông tin lỗi cụ thể hơn
    throw error; // Hoặc return []; // Hoặc xử lý lỗi theo cách phù hợp với ứng dụng của bạn
  }
}


async function getKeywordFromYoutubeVideo (data) {
  const apiKey = await getApiKey()
  let { keyword, limit } = data
  let url = `https://youtube.googleapis.com/youtube/v3/search?publishedAfter=${getDateString(12)}&part=snippet&maxResults=${limit}&q=${keyword}&type=video&key=${apiKey}`
  url = encodeURI(url)
  let response = await axios.get(url).catch(err=> {console.log(err?.status);return err})

  if (response && response.data && response.data.items) {
    if (response.data.error) {
      console.log(response.data.error);
      return []
    }

    return response.data.items.map(video => {
      return video.snippet.title
    })
  }

  return []
}

module.exports = {
  getKeywordTrend: function (options) {
    return getKeywordsFromTrend(options)
  },
  getTopPlaylist: getTopPlaylist,
  getSearchResults: async function (options) {
    return getSearchResults(options)
  },
  getSuggestionKeyword: async function (options) {
    options.keyword = decodeURI(options.keyword)
    let keywords = [options.keyword]
    const limit = options.limit || 30

    async function execute(keys, level) {
      if (keywords.length >= limit) {
        return
      }

      let levelKeywords = []
      for await (let key of keys) {
        if (keywords.length >= limit) {
          return
        }

        let keywordData = await getKeywords({ ...options, keyword: key })
        keywordData = [...new Set(keywordData)]
        keywordData = keywordData.filter(key => !keywords.includes(key) && !levelKeywords.includes(key))

        levelKeywords.push(...keywordData)
        keywords.push(...keywordData)

        if (keywords.length >= limit) {
          break
        }
      }

      if (levelKeywords.length && keywords.length < limit) {
        await execute(levelKeywords, level + 1)
      }
    }

    await execute([options.keyword], 1)

    keywords = [...new Set(keywords)]
    if (keywords.length >= limit) {
      keywords = keywords.splice(0, limit)
    }

    return keywords
  },
  getHotKeyword: async function (options) {
    try {
      let keywords = []
      const limit = options.limit || 100

      async function execute(keys, level) {
        if (keywords.length >= limit) {
          return
        }

        let levelKeywords = []
        for await (let key of keys) {
          if (keywords.length >= limit) {
            return
          }

          const keywordData = await getKeywordsFromTrend({ ...options, keyword: key })
          levelKeywords.push(...keywordData.map(item => item.query))
          keywords.push(...keywordData)
        }

        if (levelKeywords.length) {
          levelKeywords = shuffleArray(levelKeywords)
          await execute(levelKeywords, level + 1)
        }
      }

      let result_videos = await getSearchResults({keyword: options.keyword, limit_time: options.limit_time})
      await execute([options.keyword], 1)

      if (keywords.length > limit) {
        keywords = keywords.splice(0, limit)
      }

      keywords = await Promise.all(
        keywords.map(item =>  {
          return getDataKeyword({ keyword: item.query, limit_time: options.limit_time }, item)
        })
      )

      return { keywords, result_videos }
    } catch (error) {
      console.log(error);
    }
  },
  getKeywordsIdea: async function (data) {
    let { keyword, limit, region, lang_id, region_code } = data
    keyword = encodeURI(keyword)

    let resdata = []
    let keywords = []
    if (data.keywords && data.keywords.length) {
      keywords = data.keywords
    } else {
      keywords = await this.getSuggestionKeyword({ keyword, limit })
    }

    let handles = []
    while (keywords.length) {
      handles.push(async function () {
        let keywordsStr = keywords.splice(0, 20)
        let lenthKeywords = keywordsStr.length
        keywordsStr = keywordsStr.join(',,')
        keywordsStr = decodeURI(keywordsStr)
        keywordsStr = encodeURI(keywordsStr)

        let params = `$_GET["keywords"]="${keywordsStr}"; $_GET["limit"]="${lenthKeywords}";`
        
        if (region) {
          params += `$_GET["location_id"]="${region}";`
        }
        if (lang_id) {
          params += `$_GET["lang_id"]="${lang_id}";`
        }
        
        let runText = `php -r '${params} require_once("./keyword-tool/index.php");'`

        function getRs() {
          return new Promise((res, rej) => {
            exec(runText, function (error, stdout, stderr) {
              if (error) {
                console.log(error);
                console.log(stderr);
                rej(false)
              } else {
                res(stdout)
              }
            })
          })
        }
        
        const rs = await getRs()

        if (rs) {
          let keywords = JSON.parse(rs)
          if (Array.isArray(keywords) && keywords.length) {
            await Promise.all(keywords.map(key => {
              return getDataKeyword({ keyword: key.keyword }, key)
            }))

            resdata.push(...keywords)
          } else {
            console.log(rs.data);
          }
        }
      }())
    }

    await Promise.all(handles)

    return { keywords: resdata }
  },
  getKeywordsForAdmin: async function (data) {
    let { keyword, limit, region, lang_id, region_code, limit_time } = data
    let keywords = []

    // get from trend
    let keywordData = await getKeywordsFromTrend({ keyword, region, limit_time: 90, limit })
    if (keywordData && Array.isArray(keywordData)) {
      keywordData = keywordData.map(item => item.query)
    } else {
      keywordData = []
    }
    keywords.push(...keywordData)

    // get from top 10 videos name
    if (keywords.length < limit) {
      let videoKeywords = await getKeywordFromYoutubeVideo({ keyword, limit: 10 })
      if (Array.isArray(videoKeywords)) {
        keywords.push(...videoKeywords)
      }
    }

    // get from playlist names
    if (keywords.length < limit) {
      let playlistKeywords = await getKeywordFromPlaylistNames({ keyword, limit: limit - keywords.length })
      keywords.push(...playlistKeywords)
    }

    return keywords
  }
}
