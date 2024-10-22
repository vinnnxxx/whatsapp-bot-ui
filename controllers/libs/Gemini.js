const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../database/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(config.GEMINI_APIKEY);
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
