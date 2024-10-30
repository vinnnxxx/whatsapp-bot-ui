const { downloadMediaMessage } = require('fhy-wabot');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');
const configPath = path.join(__dirname, '../settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { GeminiMessage, GeminiImage } = require('./utils/Gemini');
const { Country } = require('./utils/Country');
const { YoutubeVideo, YoutubeAudio, FacebookVideo, FacebookAudio, TwitterVideo, TwitterAudio, InstagramVideo, InstagramAudio, TikTokVideo, TikTokAudio, VimeoVideo, VimeoAudio } = require('./utils/Downloader');
const { Translate } = require('./utils/Translates');
const { Weather } = require('./utils/Weather');
const { CheckSEO } = require('./utils/SEO');
const { WikipediaAI, WikipediaSearch, WikipediaImage } = require('./utils/Wikipedia');

async function AdvancedResponse(messageContent, sender, sock, message) {
    
	if (messageContent.startsWith(`${config.cmd.CMD_TO_VOICE} `)) {
		const textToConvert = messageContent.replace(`${config.cmd.CMD_TO_VOICE} `, '');
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const audioFilePath = path.join(__dirname, '../public/media/to-voice.mp3');
			const gtts = new gTTS(textToConvert, `${config.settings.TO_VOICE}`);
			gtts.save(audioFilePath, async function (err) {
				if (err) {
					console.error('Error saving audio:', err);
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
					return;
				}
				await sock.sendMessage(sender, {
					audio: { url: audioFilePath },
					mimetype: 'audio/mp4',
					ptt: true,
				}, { quoted: message });
				fs.unlink(audioFilePath, (unlinkErr) => {
					if (unlinkErr) {
						console.error('Error deleting audio file:', unlinkErr);
					}
				});
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			});
		} catch (error) {
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent === `${config.cmd.CMD_STICKER}`) {
		const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
		if (quotedMessage?.imageMessage) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			const buffer = await downloadMediaMessage({ message: quotedMessage }, 'buffer');
			const inputFilePath = path.join(__dirname, '../public/media/sticker-image.jpg');
			const outputStickerPath = path.join(__dirname, '../public/media/sticker.webp');
			const ffmpegPath = path.join(__dirname, '../plugin/ffmpeg.exe');
			fs.writeFileSync(inputFilePath, buffer);
			const ffmpegCommand = `"${ffmpegPath}" -i "${inputFilePath}" -vf "scale=512:512" -vcodec libwebp -lossless 1 -qscale 80 -loop 0 -an -vsync 0 -preset default -t 5 "${outputStickerPath}"`;
			exec(ffmpegCommand, async (error, stdout, stderr) => {
				if (error) {
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
					return;
				}
				const stickerBuffer = fs.readFileSync(outputStickerPath);
				await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: message });
				fs.unlinkSync(inputFilePath);
				fs.unlinkSync(outputStickerPath);
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			});
		} else {
			await sock.sendMessage(sender, { text: "Tidak ada gambar yang di-quote untuk dibuat sticker." }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_AI} `)) {
		const searchQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_AI} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const responseMessage = await WikipediaAI(searchQuery, sock, sender, message);
			if (responseMessage) {
				await sock.sendMessage(sender, { text: responseMessage, quoted: message });
			}
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_SEARCH} `)) {
		const searchQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_SEARCH} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const responseMessage = await WikipediaSearch(searchQuery, sock, sender, message);
			if (responseMessage) {
				await sock.sendMessage(sender, { text: responseMessage, quoted: message });
			}
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_IMG} `)) {
		const userQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_IMG} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const { url, caption } = await WikipediaImage(userQuery);
			await sock.sendMessage(sender, {image: {url: url}, caption: caption}, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_SEO} `)) {
		const domain = messageContent.replace(`${config.cmd.CMD_SEO} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

		try {
			const responseMessage = await CheckSEO(domain); 
			const formattedMessage = 
				'- SEO Success Rate: ' + responseMessage.seoSuccessRate + '\n' +
				'- Title: ' + responseMessage.title + '\n' +
				'- Meta Description: ' + responseMessage.metaDescription + '\n' +
				'- Meta Keywords: ' + responseMessage.metaKeywords + '\n' +
				'- Open Graph Title: ' + responseMessage.ogTitle + '\n' +
				'- Open Graph Description: ' + responseMessage.ogDescription + '\n' +
				'- Open Graph Image: ' + responseMessage.ogImage + '\n' +
				'- Canonical URL: ' + responseMessage.canonicalUrl + '\n' +
				'- Is Indexable: ' + (responseMessage.isIndexable ? 'Yes' : 'No');
			await sock.sendMessage(sender, { text: formattedMessage.trim() }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WEATHER} `)) {
		const cityName = messageContent.replace(`${config.cmd.CMD_WEATHER} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const weatherJson = await Weather(cityName);
			const responseMessage = `*Weather in ${cityName}*\n\nTemperature: ${weatherJson.temperature}\nCondition: ${weatherJson.condition}\nWind: ${weatherJson.wind}\nHumidity: ${weatherJson.humidity}`;
			await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
	if (messageContent.startsWith(`${config.cmd.CMD_TRANSLATE}`)) {
		const parts = messageContent.split(' ');
		const langId = parts[0].split('-')[1];
		const query = parts.slice(1).join(' ');

		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const translateText = await Translate(query, langId);
			await sock.sendMessage(sender, { text: translateText }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}


    if (messageContent.startsWith(`${config.cmd.CMD_GEMINI} `)) {
        const question = messageContent.replace(`${config.cmd.CMD_GEMINI} `, '').trim();
        await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
        try {
            const responseMessage = await GeminiMessage(question);
            await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
        } catch (error) {
            console.error('Error sending message:', error);
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    if (messageContent.startsWith(`${config.cmd.CMD_GEMINI_IMG} `)) {
        const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const getPrompt = messageContent.replace(`${config.cmd.CMD_GEMINI_IMG} `, '').trim();

        if (quotedMessage?.imageMessage) {
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            const buffer = await downloadMediaMessage({ message: quotedMessage }, 'buffer');
            const inputFilePath = path.join(__dirname, '../public/media/gemini-image.jpg');
            fs.writeFileSync(inputFilePath, buffer);
            try {
                const analysisResult = await GeminiImage(inputFilePath, getPrompt);
                await sock.sendMessage(sender, { text: analysisResult }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
            } catch (error) {
                console.error('Error processing image:', error);
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            } finally {
                deleteFile(inputFilePath);
            }
        } else {
            await sock.sendMessage(sender, { text: "Tidak ada gambar yang di-quote untuk dianalisis." }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    if (messageContent.startsWith(`${config.cmd.CMD_COUNTRY} `)) {
        const countryName = messageContent.replace(`${config.cmd.CMD_COUNTRY} `, '').trim();
        await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
        
        try {
            const responseMessage = await Country(countryName); 
            await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
        } catch (error) {
            console.error('Error sending message:', error);
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    const mediaCommands = [
        { cmd: `${config.cmd.CMD_TWDLMP4} `, platform: 'twitter', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_TWDLMP2} `, platform: 'twitter', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_IGDLMP4} `, platform: 'instagram', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_IGDLMP3} `, platform: 'instagram', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_TKDLMP4} `, platform: 'tiktok', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_TKDLMP3} `, platform: 'tiktok', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_VMDLMP4} `, platform: 'vimeo', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_VMDLMP3} `, platform: 'vimeo', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_FBDLMP4} `, platform: 'facebook', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_FBDLMP3} `, platform: 'facebook', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_YTDLMP4} `, platform: 'youtube', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_YTDLMP3} `, platform: 'youtube', mediaType: 'mp3' },
    ];

    for (const { cmd, platform, mediaType } of mediaCommands) {
        if (messageContent.startsWith(cmd)) {
            const url = messageContent.split(' ')[1];
            await handleMediaDownload(platform, mediaType, url, sender, message, sock);
            break;
        }
    }
}

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err.message}`);
        }
    });
};

const handleMediaDownload = async (platform, mediaType, url, sender, message, sock) => {
    const fileExtensions = {
        mp4: `${platform}-video.mp4`,
        mp3: `${platform}-audio.mp3`,
    };
    const outputFilePath = path.join(__dirname, "../public/media", fileExtensions[mediaType]);

    await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

    try {
        if (mediaType === 'mp4') {
            await (platform === 'twitter' ? TwitterVideo(url, outputFilePath) :
                platform === 'instagram' ? InstagramVideo(url, outputFilePath) :
                platform === 'tiktok' ? TikTokVideo(url, outputFilePath) :
                platform === 'vimeo' ? VimeoVideo(url, outputFilePath) :
                platform === 'facebook' ? FacebookVideo(url, outputFilePath) :
                YoutubeVideo(url, outputFilePath));
        } else {
            await (platform === 'twitter' ? TwitterAudio(url, outputFilePath) :
                platform === 'instagram' ? InstagramAudio(url, outputFilePath) :
                platform === 'tiktok' ? TikTokAudio(url, outputFilePath) :
                platform === 'vimeo' ? VimeoAudio(url, outputFilePath) :
                FacebookAudio(url, outputFilePath));
        }

        const mediaMessage = mediaType === 'mp4' 
            ? { video: { url: outputFilePath }, caption: "This is the video you asked for!" } 
            : { audio: { url: outputFilePath }, mimetype: 'audio/mp4' };

        await sock.sendMessage(sender, mediaMessage, { quoted: message });
        await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });

        deleteFile(outputFilePath);
    } catch (error) {
        await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
    }
};

module.exports = AdvancedResponse;
