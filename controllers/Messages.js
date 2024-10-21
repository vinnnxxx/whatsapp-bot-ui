const fs = require('fs');
const path = require('path');
const { handleDynamicMessage } = require('./DynamicMessages');
const { handleStaticMessage } = require('./StaticMessages');
const responsesPath = path.join(__dirname, '../database/data.json');
const data = JSON.parse(fs.readFileSync(responsesPath, 'utf-8'));

const handleIncomingMessage = async (message, client) => {
    let response;

    try {
        response = await handleDynamicMessage(message, client);
        if (!response) {
            response = await handleStaticMessage(message, client);
        }
    } catch (error) {
        await message.react('⛔');
        response = { type: 'error', message: "Failed to process the request." };
    }

    return response;
};

module.exports = { handleIncomingMessage };
