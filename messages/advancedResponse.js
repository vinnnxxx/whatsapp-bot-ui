const { downloadMediaMessage } = require('fhy-wabot');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { GeminiMessage, GeminiImage } = require('./utils/Gemini');
const { Country } = require('./utils/Country');
const { YoutubeVideo, YoutubeAudio, FacebookVideo, FacebookAudio, TwitterVideo, TwitterAudio, InstagramVideo, InstagramAudio, TikTokVideo, TikTokAudio, VimeoVideo, VimeoAudio } = require('./utils/Downloader');
const { Translate } = require('./utils/Translates');

async function AdvancedResponse(messageContent, sender, sock, message) {
    
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
