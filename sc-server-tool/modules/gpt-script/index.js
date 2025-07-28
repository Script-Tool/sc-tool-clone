const fetch = require("node-fetch")
const API_PATH = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_KEY = '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'
module.exports = {
  async generateScript(payload, gptKey = youtube_config.chat_gpt_api_key) {
    const API_KEY = gptKey
    let message = youtube_config.gpt_script_template || 'tạo một kịch bản phim dựa vào các tiêu chí: '

    if (typeof payload == 'string') {
      message = payload
    } else {
      payload.forEach(item => {
        message += `${item.label} ${item.value}.`
      })
    }

    if (!message) {
      return false
    }

    message += youtube_config.gpt_script_template_suffix || '. đặt tên bộ phim ở đầu tiên.'
    const data = {
      "model": "gpt-3.5-turbo",
      "messages": [
        {
          "role": "user",
          "content": message
        }
      ]
    }

    return fetch(API_PATH, {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${API_KEY}`
      }
    }).then(res => res.json()).then(data => {
      if (data && data.id) {
        return data.choices[0].message.content
      }
      return null
    }).catch(err => {
      console.log('Error:', err)
      return null
    });
  },
  async generateContent(payload, gptKey = youtube_config.chat_gpt_api_key) {
    const API_KEY = gptKey
    let type = payload.type
    const target = payload.target
    const style = payload.style
    const category = payload.category
    let message = youtube_config.gpt_template || 'Tạo bộ ${type} liên quan đến các nhóm hoặc chủ đề để seeding ${target} ${category}, dành riêng cho từng nền tảng YouTube, TikTok, Facebook Phong cách ${style}.'
    if (type == 'Bài đăng') {
      type = 'nội dung'
      message += ', mỗi kết quả hơn 100 từ'
    }

    message = message.replace('${type}', type)
    message = message.replace('${target}', target)
    message = message.replace('${category}', category)
    message = message.replace('${style}', style)

    let data = {
      "model": "gpt-3.5-turbo",
      "messages": [
        {
          "role": "user",
          "content": message
        }
      ]
    }

    return fetch(API_PATH, {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${API_KEY}`
      }
    }).then(res => res.json()).then(data => {
      if (data && data.id) {
        let contentRs = data.choices[0].message.content
        return contentRs
      }
      return null
    }).catch(err => {
      console.log('Error:', err)
      return null
    });
  }
}
