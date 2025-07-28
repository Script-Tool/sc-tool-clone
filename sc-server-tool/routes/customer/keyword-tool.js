const express = require('express');
var router = express.Router();
const KeywordToolModule = require('../../modules/keyword')
const utils = require('../../src/utils/utils')
const rootApi = require('../../modules/root-api-request')

router.post('/create-playlist-from-keyword', async function(req, res) {
  try {
    let data = req.body
    // auth for service
    if (data.keywords) {
      rootApi.request({
        url: '/playlist/add-from-keywords',
        method: 'POST',
        data
      }).catch(er => {
        console.log(er);
      })

      res.json({ success: true, status: 'success', message: 'Create successfully.' })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/load-keywords-for-playlist', async function(req, res) {
  try {
    let data = req.body
    let keywords = await KeywordToolModule.getKeywordsForAdmin({ keyword: data.keyword, limit: data.limit })

    return res.json({ success: true, keywords })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/get-keyword-statis/:keyword', async function(req, res) {
  try {
    let keyword = req.params.keyword

    //const { videos, channels } = await KeywordToolModule.getSearchResults({ keyword: keyword, limit_time: 30 })
    //const { playlists } = await KeywordToolModule.getTopPlaylist({ keyword: keyword, limit: 16 })
    //const key_trends = await KeywordToolModule.getKeywordTrend({ keyword: keyword, limit_time: 12, limit: 7 })

    let [{videos, channels}, {playlists}, {key_trends}] = await Promise.all([
      KeywordToolModule.getSearchResults({ keyword: keyword, limit_time: 30 }),
      KeywordToolModule.getTopPlaylist({ keyword: keyword, limit: 16 }),
      KeywordToolModule.getKeywordTrend({ keyword: keyword, limit_time: 12, limit: 7 })
    ])

    return res.json({ success: true, videos, channels, key_trends, playlists })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/', async function(req, res) {
  try {
    let data = req.body
    let options = {
      keyword: data.keyword,
      region: data.region,
      limit: data.total_limit,
      limit_time: data.limit_time
    }

    if (data.result_type == 'pro_key') {
      let data = await KeywordToolModule.getHotKeyword(options)
      
      return res.json({ success: true, results: data.keywords, result_videos: data.result_videos })
    } else if (data.result_type == 'related_key') {
      let data = await KeywordToolModule.getSuggestionKeyword(options)
      return res.json({ success: true, results: data.keywords, result_videos: data.result_videos })
    }

    return res.json({ status: 'error', message: 'Error while handle' })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/generate-keyword-idea', async function(req, res) {
  try {
    let data = req.body
    let options = {
      keyword: data.keyword,
      limit: data.total_limit || 30,
      region: data.region || '',
      lang_id: data.lang_id || '',
      region_code: data.region_code || 'us'
    }

    let rs = await KeywordToolModule.getKeywordsIdea(options)
    if (rs) {
      return res.json({ ...rs, success: true })
    }
    
    return res.json({ status: 'error', message: 'Error while handle' })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/get-topics', async function(req, res) {
  try {
    const TopicModel = getModel('Topic')
    const HotKeyword = getModel('HotKeyword')
    let topics = await TopicModel.find({ parent_topic_code: { $in: [null, '', undefined] } })

    for await (let topic of topics) {
      let totalKeywords = await HotKeyword.countDocuments({ topic_code: topic.code })
      topic.set('total_keywords', totalKeywords)

      let children = await TopicModel.find({ parent_topic_code: topic.code })
      if (children.length) {
        for await (let child of children) {
          let total = await HotKeyword.countDocuments({ topic_code: child.code })
          child.set('total_keywords', total)
        }
      }
      topic.set('children', children)
    }
    
    return res.json({ success: true, topics })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/get-keywords-of-topic', async function(req, res) {
  try {
    const HotKeywordModel = getModel('HotKeyword')
    let topic_code = req.body.topic_code
    let per_page = req.body.per_page || 30
    let current_page = req.body.current_page || 1

    let filter = {
      topic_code
    }

    if (topic_code) {
      let region = ''
      let keywordsData = await HotKeywordModel.find(filter).skip((current_page - 1) * per_page).limit(per_page)
      let total = await HotKeywordModel.countDocuments(filter)

      let keywordsLoaded = []
      let keywordsNew = []
      keywordsData.forEach(item => {
        if (item.dataLoaded) {
          item = item.toObject()
          let itemData = {...item, ...item.dataLoaded}
          delete itemData.dataLoaded
          keywordsLoaded.push(itemData)
        } else {
          keywordsNew.push(item.keyword.toLowerCase())
        }
      });

      if (keywordsNew.length) {
        let rs = await KeywordToolModule.getKeywordsIdea({ keywords: keywordsNew })
        keywordsNew = rs.keywords
        if (keywordsNew.length) {
          for await (let k of rs.keywords) {
            var regex = new RegExp(["^", k.keyword, "$"].join(""), "i");
            await HotKeywordModel.updateMany({ keyword: regex }, { $set: { dataLoaded: k } })
          }
        }
      }

      let allKeywords = [...keywordsNew, ...keywordsLoaded]
      res.json({ success: true, keywords: allKeywords, total })
    } else {
      return res.json({ success: false })
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/save-keyword-data', async function(req, res) {
  try {
    let body = req.body
    if (body.keyword && body.items) {
      const SavedKeywordData = getModel('SavedKeywordData')
      await SavedKeywordData.create({
        keyword: body.keyword,
        items: body.items,
        total_items: body.items.length,
        keyword_code: utils.generateCode(body.keyword),
        customer: req.customer.id
      })
      
      return res.json({ success: true, status: 'success', message: 'Saved success.' })
    }

    return res.json({ status: 'error', message: 'Error while handle' })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/get-keyword-data', async function(req, res) {
  try {
    const SavedKeywordData = getModel('SavedKeywordData')
    let filter = {
      customer: req.customer ? req.customer.id : ''
    }

    let items = await SavedKeywordData.find(filter, 'keyword keyword_code total_items')

    return res.json({ success: true, items })
    
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/get-keyword-items/:keyword_code', async function(req, res) {
  try {
    const SavedKeywordData = getModel('SavedKeywordData')
    let filter = {
      customer: req.customer.id,
      keyword_code: req.params.keyword_code
    }

    let data = await SavedKeywordData.findOne(filter, 'items')
    if (data) {
      return res.json({ success: true, items: data.items })
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
