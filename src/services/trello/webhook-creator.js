const axios = require('axios');
const { KeyAndApi } = require('../../config/constants');


async function getExistingWebhooks() {
    try {
        const response = await axios.get(
            `https://api.trello.com/1/tokens/${KeyAndApi.token}/webhooks`,
            {
                params: {
                    key: KeyAndApi.apiKey
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error getting webhooks:', error.response ? error.response.data : error);
        return [];
    }
}

async function deleteWebhook(webhookId) {
    try {
        await axios.delete(
            `https://api.trello.com/1/webhooks/${webhookId}`,
            {
                params: {
                    key: KeyAndApi.apiKey,
                    token: KeyAndApi.token
                }
            }
        );
      
    } catch (error) {
        console.error('Error deleting webhook:', error.response ? error.response.data : error);
    }
}

async function create_Webhook_Trello() {
    try {
        // Kiểm tra webhook hiện có
        const existingWebhooks = await getExistingWebhooks();
        for (let i = 0; i < existingWebhooks.length; i++) {
            if (existingWebhooks[i].callbackURL == ('http://101.99.6.103:' + KeyAndApi.port + '/webhook/trello'))
                await deleteWebhook(existingWebhooks[i].id);
        }

        const callbackURL = 'http://101.99.6.103:' + KeyAndApi.port + '/webhook/trello';
        const response = await axios.post(
            `https://api.trello.com/1/webhooks/`,
            {
                key: KeyAndApi.apiKey,
                token: KeyAndApi.token,
                callbackURL: callbackURL,
                idModel: KeyAndApi.activeBoard
            }
        );

     
        return response.data;
    } catch (error) {
        console.error('Error creating webhook:', error.response ? error.response.data : error);
        throw error;
    }
}

module.exports = create_Webhook_Trello;