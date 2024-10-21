const { MessageMedia } = require('whatsapp-web.js');

const handleStaticMessage = async (message, client) => {
    let response;

    if (message.body === '.test') {
        await message.react('⏳');
        response = "Test done!";
        await message.react('✅');
    } else
	
	if (message.body.startsWith('.test-local')) {
        const caption = 'Gambar local';
        const media = MessageMedia.fromFilePath('./public/images/default.png');
        response = { type: 'media', mediaUrl: '/images/default.png', caption };

        await message.react('⏳');
        await client.sendMessage(message.from, media, { caption });
        await message.react('✅');
    } else
		
	if (message.body.startsWith('.test-url')) {
        const caption = 'Gambar url';
        const url = 'https://img.freepik.com/free-photo/anime-style-galaxy-background_23-2151133974.jpg';
        const media = await MessageMedia.fromUrl(url);
        response = { type: 'media', mediaUrl: url, caption };

        await message.react('⏳');
        await client.sendMessage(message.from, media, { caption });
        await message.react('✅');
    }

    return response;
	console.log(response);
};

module.exports = { handleStaticMessage };
