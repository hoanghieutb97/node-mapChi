const axios = require('axios');
const { KeyAndApi } = require('../../config/constants');
const { processCard } = require('./webhook');

async function getListTrelloAuto() {
    try {
        // Kiểm tra biến toàn cục
        if (!global.listTrello) global.listTrello = [];
        const shouldFetchNewCards = global.listTrello.length === 0

        if (shouldFetchNewCards) {
       

            // Kiểm tra KeyAndApi
            if (!KeyAndApi?.startList || !KeyAndApi?.apiKey || !KeyAndApi?.token) {
                throw new Error("Missing required Trello API credentials");
            }

          

            const responseAll = await axios.get(
                `https://api.trello.com/1/lists/${KeyAndApi.startList}/cards?key=${KeyAndApi.apiKey}&token=${KeyAndApi.token}`
            );

          
            if (!responseAll?.data) {
                throw new Error("Invalid response from Trello API");
            }

            global.listTrello = [];
            const listCard = responseAll.data.map(item => ({
                cardId: item.id,
                nameCard: item.name
            }));

        


            // Xử lý các card mới với delay
            for (const card of listCard) {
                try {
                    if (!card?.cardId) continue;
                    console.log(`\nXử lý card ${card.cardId} (${card.nameCard})`);
                    await processCard(card.cardId); 
                  
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`Lỗi khi xử lý card ${card.cardId}:`, error.message);
                }
            }
        }

      
        // Lên lịch chạy lại sau 9 phút
        setTimeout(getListTrelloAuto, 600000);
    } catch (error) {
        console.error("\n=== Lỗi trong quá trình xử lý ===");
        console.error("Chi tiết lỗi:", error.message);
        // Nếu có lỗi, thử lại sau 1 phút
        setTimeout(getListTrelloAuto, 60000);
    }
}

module.exports = getListTrelloAuto; 