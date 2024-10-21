const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const responsesPath = path.join(__dirname, '../database/data.json');
const data = JSON.parse(fs.readFileSync(responsesPath, 'utf-8'));

const handleDynamicMessage = async (message, client) => {
    let response;

    if (data[message.body]) {
        await message.react('⏳');
        const reply = data[message.body];

        if (typeof reply === 'string') {
            response = reply;
        } else {
            const { caption, filePath, url } = reply;

            if (filePath) {
                const media = MessageMedia.fromFilePath(filePath);
                response = { type: 'media', mediaUrl: filePath, caption };
                await client.sendMessage(message.from, media, { caption });
            } else if (url) {
                const media = await MessageMedia.fromUrl(url);
                response = { type: 'media', mediaUrl: url, caption };
                await client.sendMessage(message.from, media, { caption });
            }
        }
        await message.react('✅');
    }

    return response;
	console.log(response);
};

module.exports = { handleDynamicMessage };
