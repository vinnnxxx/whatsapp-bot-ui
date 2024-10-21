const { MessageMedia } = require('whatsapp-web.js');
const { GeminiMessage } = require('./libs/Gemini');
const { Weather } = require('./libs/Weather');
const { Translate } = require('./libs/Translate');
const { Surah, SurahDetails } = require('./libs/Quran');

const handleStaticMessage = async (message, client) => {
    let response;

    // Gemini AI
    if (message.body.startsWith('.gemini-ai ')) {
        const question = message.body.replace('.gemini-ai ', '').trim();
        await message.react('⏳');
        try {
			const responseMessage = await GeminiMessage(question);
			response = `${responseMessage}`; 
			await message.react('✅');
		} catch (error) {
			console.error('Error processing Gemini AI:', error);
			await message.react('❌');
		}
    } else
	
	// Weather
    if (message.body.startsWith('.weather ')) {
        const cityName = message.body.replace('.weather ', '').trim();
        await message.react('⏳');
        try {
			const responseMessage = await Weather(cityName);
			response = `*Weather in ${cityName}*\n\nTemperature: ${responseMessage.temperature}\nCondition: ${responseMessage.condition}\nWind: ${responseMessage.wind}\nHumidity: ${responseMessage.humidity}`;
			await message.react('✅');
		} catch (error) {
			console.error('Error processing Gemini AI:', error);
			await message.react('❌');
		}
    } else
	
	// Translate
    if (message.body.startsWith('.translate-')) {
		const langId = message.body.split(' ')[0].split('-')[1];
		const text = message.body.split(' ').slice(1).join(' ');
		await message.react('⏳');
		try {
			const responseMessage = await Translate(text, langId);
			response = `${responseMessage}`;
			await message.react('✅');
		} catch (error) {
			console.error('Error processing Gemini AI:', error);
			await message.react('❌');
		}
    } else
	
	// Surah
    if (message.body.startsWith('.surah ')) {
        const surahId = message.body.replace('.surah ', '').trim();
		await message.react('⏳');
		try {
			const responseMessage = await Surah(surahId); 
			response = `${responseMessage}`;
			await message.react('✅');
		} catch (error) {
			console.error('Error processing Gemini AI:', error);
			await message.react('❌');
		}
    } else
		
	// Surah:Ayat
    if (message.body.startsWith('.ayat ')) {
		const [surahPart, ayahPart] = messageBody.split(' ')[1].split(':');
		const surahId = parseInt(surahPart);
		const ayahId = ayahPart ? parseInt(ayahPart) : null;
		await message.react('⏳');
		try {
			if (ayahId) {
				const responseMessage = await SurahDetails(surahId, ayahId);
				response = `${responseMessage}`;
			} else {
				const responseMessage = await getSurahDetails(surahId);
				response = `${responseMessage}`;
			}
			await message.react('✅');
		} catch (error) {
			console.error('Error processing Gemini AI:', error);
			await message.react('❌');
		}
    } else

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
