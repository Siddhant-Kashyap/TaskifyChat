const fs = require('fs').promises;

async function readChatHistory() {
    try {
        const data = await fs.readFile('chatHistory.json');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('chatHistory.json', '[]');
            return [];
        }
        throw error;
    }
}

async function writeChatHistory(chatHistory) {
   
    await fs.writeFile('chatHistory.json', JSON.stringify(chatHistory));
}

module.exports = {
    readChatHistory,
    writeChatHistory
};
