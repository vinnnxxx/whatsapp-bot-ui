const { MessageMedia } = require('whatsapp-web.js');
const { GeminiMessage } = require('./libs/Gemini');
const { Translate } = require('./libs/Translate');
const { Surah, SurahDetails } = require('./libs/Quran');
const { WikipediaSearch, WikipediaAI, WikipediaImage } = require('./libs/Wikipedia');
const { Country } = require('./libs/Country');
const { CheckSEO } = require('./libs/SEO');

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
		const commandPart = message.body.split(' ')[1];
		const [surahPart, ayahPart] = commandPart.split(':');
	
		const surahId = parseInt(surahPart);
		const ayahId = ayahPart ? parseInt(ayahPart) : null;
	
		await message.react('⏳');
		try {
			let response;
			if (ayahId !== null) {
				response = await SurahDetails(surahId, ayahId);
			} else {
				response = await Surah(surahId);
			}
			
			await message.react('✅');
			} catch (error) {
			console.error('Error processing request:', error);
			await message.react('❌');
			await message.reply('An error occurred while fetching the data.'); // Notify user about the error
		}
	} else

	// Wikipedia AI query
	if (message.body.startsWith('.wiki-ai ')) {
        const query = message.body.replace('.wiki-ai ', '').trim();
		await message.react('⏳');
		response = await WikipediaAI(query);
		await message.react('✅');
	} else

	// Wikipedia search for multiple results
	if (message.body.startsWith('.wiki-search ')) {
        const query = message.body.replace('.wiki-search ', '').trim();
		await message.react('⏳');
		response = await WikipediaSearch(query);
		await message.react('✅');
	} else

	// Wikipedia image search
	if (message.body.startsWith('.wiki-img ')) {
        const query = message.body.replace('.wiki-img ', '').trim();
		
		
		const imageResult = await WikipediaImage(query);
        const caption = imageResult.caption;
        const url = imageResult.url;
        const media = await MessageMedia.fromUrl(url);
        response = { type: 'media', mediaUrl: url, caption };

        await message.react('⏳');
        await client.sendMessage(message.from, media, { caption });
        await message.react('✅');
	} else

	// Country
	if (message.body.startsWith('.country ')) {
        const countryName = message.body.replace('.country ', '').trim();
		await message.react('⏳');
		response = await Country(countryName);
		await message.react('✅');
	} else

	// SEO
	if (message.body.startsWith('.seo ')) {
        const domain = message.body.replace('.seo ', '').trim();
		await message.react('⏳');
		const responseMessage = await CheckSEO(domain); 
		response = 
			'- SEO Success Rate: ' + responseMessage.seoSuccessRate + '\n' +
			'- Title: ' + responseMessage.title + '\n' +
			'- Meta Description: ' + responseMessage.metaDescription + '\n' +
			'- Meta Keywords: ' + responseMessage.metaKeywords + '\n' +
			'- Open Graph Title: ' + responseMessage.ogTitle + '\n' +
			'- Open Graph Description: ' + responseMessage.ogDescription + '\n' +
			'- Open Graph Image: ' + responseMessage.ogImage + '\n' +
			'- Canonical URL: ' + responseMessage.canonicalUrl + '\n' +
			'- Is Indexable: ' + (responseMessage.isIndexable ? 'Yes' : 'No');
		await message.react('✅');
	} else

	// ==== Testing Basic =====
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
	// ==== Testing Basic =====

    return response;
	console.log(response);
};

module.exports = { handleStaticMessage };
