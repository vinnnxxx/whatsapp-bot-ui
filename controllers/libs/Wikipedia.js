const axios = require('axios');

// Common function to handle Wikipedia API requests
async function fetchWikipediaData(apiParams) {
    try {
        const response = await axios.get(`https://id.wikipedia.org/w/api.php`, { params: apiParams });
        return response.data;
    } catch (error) {
        console.error("Error fetching data from Wikipedia:", error);
        throw new Error('Failed to fetch data from Wikipedia');
    }
}

// Function to handle single result AI query
async function WikipediaAI(query) {
    try {
        const searchResponse = await fetchWikipediaData({
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            utf8: 1,
            origin: '*'
        });

        const searchResults = searchResponse.query.search;

        if (searchResults.length > 0) {
            const result = searchResults[0];
            return `*${result.title}*\n\n${result.snippet.replace(/<[^>]+>/g, '')}...\n\nBaca lebih lanjut di: https://id.wikipedia.org/wiki/${encodeURIComponent(result.title)}`;
        } else {
            return "No results found.";
        }
    } catch (error) {
        return 'An error occurred while fetching data.';
    }
}

// Function to handle multiple result search
async function WikipediaSearch(query) {
    try {
        const searchResponse = await fetchWikipediaData({
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: 10,
            format: 'json',
            utf8: 1,
            origin: '*'
        });

        const searchResults = searchResponse.query.search;

        if (searchResults.length > 0) {
            let responseMessage = "Hasil pencarian:\n\n";
            
            for (const result of searchResults) {
                const title = result.title;
                const snippet = result.snippet.replace(/<[^>]+>/g, '');
                responseMessage += `*${title}*\n${snippet}...\nBaca lebih lanjut di: https://id.wikipedia.org/wiki/${encodeURIComponent(title)}\n\n`;
            }

            return responseMessage;
        } else {
            return "No results found.";
        }
    } catch (error) {
        return 'An error occurred while fetching data.';
    }
}

// Function to handle image search
async function WikipediaImage(query) {
    try {
        const searchResponse = await fetchWikipediaData({
            action: 'query',
            format: 'json',
            list: 'search',
            srsearch: query,
            utf8: 1,
            srlimit: 1
        });

        const pageId = searchResponse.query.search[0]?.pageid;
        if (!pageId) {
            return 'Image not found.';
        }

        const imageResponse = await fetchWikipediaData({
            action: 'query',
            format: 'json',
            prop: 'pageimages',
            pageids: pageId,
            pilimit: 'max',
            pithumbsize: 500
        });

        const imageUrl = imageResponse.query.pages[pageId]?.thumbnail?.source;
        const originalImageUrl = imageResponse.query.pages[pageId]?.imageinfo?.[0]?.url;
        const finalImageUrl = originalImageUrl || imageUrl;

        if (!finalImageUrl) {
            return 'Image not found.';
        }

        return { url: finalImageUrl, caption: `Image search results for: ${query}` };
    } catch (error) {
        console.error("Error fetching Wikipedia image:", error);
        return 'An error occurred while fetching image.';
    }
}

module.exports = { WikipediaAI, WikipediaSearch, WikipediaImage };
