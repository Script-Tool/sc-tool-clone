const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey:
    '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',
});

/**
 * Creates a chat completion using OpenAI's API
 * @param {string} systemPrompt - The system message to set context
 * @param {string} userPrompt - The user's question/prompt
 * @returns {Promise<string>} The assistant's response
 */
async function openAIGenerateJson(systemPrompt = '', userPrompt = '') {
  try {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'generate_youtube_content',
          description:
            'Tạo nội dung có cấu trúc cho video YouTube viết bằng tiếng việt',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Tiêu đề' },
              outline: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Phác thảo cho nội dung video và luôn bao gồm chính xác 3 điểm phác thảo',
              },
              target_audience: {
                type: 'string',
                description: 'Đối tượng mục tiêu cho video',
              },
              thumbnail: {
                type: 'string',
                description: 'Mô tả hình thu nhỏ',
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'keywords không có dấu',
              },
              hashtags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Luôn định dạng hashtags với #',
              },
              content: {
                type: 'object',
                description:
                  'Thông tin chương và nội dung viết bằng tiếng việt',
                properties: {
                  chapter: {
                    type: 'string',
                    description: 'Tên chương',
                  },
                  content: {
                    type: 'string',
                    description: 'Nội dung viết bằng tiếng việt',
                  },
                  image: {
                    type: 'string',
                    description: 'Mô tả ảnh của nội dung',
                  },
                },
                required: ['chapter', 'content', 'image'],
                additionalProperties: false,
              },
            },
            required: [
              'title',
              'outline',
              'target_audience',
              'thumbnail',
              'keywords',
              'hashtags',
              'content',
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const messages = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemPrompt,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: tools,
      tool_choice: 'required',
    });

    return JSON.parse(
      response.choices[0].message?.tool_calls[0]?.function?.arguments
    );
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate content with OpenAI');
  }
}

module.exports = openAIGenerateJson;
