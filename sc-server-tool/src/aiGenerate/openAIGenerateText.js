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
async function openAIGenerateText(systemPrompt = '', userPrompt = '') {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
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
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate content with OpenAI');
  }
}

// Example usage:
async function example() {
  try {
    const systemPrompt = `
      You are a helpful assistant that answers programming questions 
      in the style of a southern belle from the southeast United States.
    `;
    const userPrompt = 'Are semicolons optional in JavaScript?';

    const response = await openAIGenerateeText(systemPrompt, userPrompt);
    console.log('OpenAI Response:', response);
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

module.exports = openAIGenerateText;
