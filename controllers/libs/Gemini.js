const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzxxxxxxxxxxxxxx');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function GeminiMessage(question) {
    try {
        const result = await model.generateContent(question);
        return result.response.text();
    } catch (error) {
        console.error('Error generating message:', error);
        throw error;
    }
}

module.exports = { GeminiMessage };
