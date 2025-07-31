const { KeyAndApi } = require('../../config/constants');
const axios = require('axios');
const { InPutexcel } = require('../excel/InPutexcel');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { moveToRunDone, moveToRunErr } = require('./card-mover');
const { pushItemMongo } = require('../mongo/pushItemMongo');


// Biến toàn cục để lưu danh sách card đang xử lý
global.listTrello = global.listTrello || [];



// Hàm xử lý một card
async function processCard(cardId) {
    // Kiểm tra xem card đã có trong global.listTrello chưa
    if (global.listTrello.some(card => card.cardId === cardId)) {
        console.log(`Card ${cardId} đã tồn tại trong danh sách xử lý, bỏ qua.`);
        return;
    }

    try {

        // Lấy thông tin attachments của card
        const response = await axios.get(
            `https://api.trello.com/1/cards/${cardId}?attachments=true&key=${KeyAndApi.apiKey}&token=${KeyAndApi.token}`
        );


        const attachments = response.data.attachments;


        // Kiểm tra file Excel
        const xlsxAttachments = attachments.filter(att => {
            return att.name && att.name.toLowerCase().endsWith('.xlsx');
        });


        if (xlsxAttachments.length === 1) {
            try {


                // Tải file Excel với authentication
                const excelResponse = await axios.get(xlsxAttachments[0].url, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Authorization': `OAuth oauth_consumer_key="${KeyAndApi.apiKey}", oauth_token="${KeyAndApi.token}"`
                    }
                });


                // Tạo file tạm thời
                const tempFilePath = path.join(os.tmpdir(), xlsxAttachments[0].name);
                await fs.writeFile(tempFilePath, excelResponse.data);



                try {
                    // Sử dụng InPutexcel để xử lý file

                    const listExcel = await InPutexcel(tempFilePath);


                    // Kiểm tra xem có phần tử false trong listExcel không
                    let canMatch = listExcel.some(item => item.addGllm === false);

                    if (canMatch) {// nếu là false thì có cái thiếu variant
                        await moveToRunErr(cardId);
                    }
                    else {
                        // Push dữ liệu vào MongoDB
                        await pushItemMongo(listExcel);
                        // Move card to Run Done
                        await moveToRunDone(cardId);
                        axios.get('http://192.168.1.220:1002/api/GetAllDesignFetchData') // link tới Next.js API route
                            .then(res => {

                            })
                            .catch(err => {

                            });

                    }



                } catch (error) {
                    console.log("Error processing Excel file:", error);
                    throw error;
                } finally {
                    // Xóa file tạm sau khi xử lý xong
                    try {
                        await fs.unlink(tempFilePath);

                    } catch (error) {
                        console.log("Error deleting temporary file:", error);
                    }
                }
            } catch (error) {
                console.log("Error in Excel processing:", error);
                throw error;
            }
        }

    } catch (error) {
        console.log("error********************", error);
    }
}

// Hàm xử lý webhook
async function handleWebhook(req, res) {
    try {
        const action = req.body.action;
        const model = req.body.model;

        // Chỉ xử lý khi thêm attachment Excel vào card
        if (action.type === 'addAttachmentToCard') {
            const cardId = action.data.card.id;

            // Kiểm tra trạng thái hiện tại của card
            try {
                const cardResponse = await axios.get(
                    `https://api.trello.com/1/cards/${cardId}?key=${KeyAndApi.apiKey}&token=${KeyAndApi.token}`
                );

                // Nếu card không nằm trong startList, bỏ qua
                if (cardResponse.data.idList !== KeyAndApi.startList) {

                    return res.status(200).send('OK');
                }

                // Kiểm tra xem attachment có phải là file Excel không
                if (action.data.attachment.name.toLowerCase().endsWith('.xlsx')) {
                    await processCard(cardId);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái card:', error);
                return res.status(500).send('Internal Server Error');
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

module.exports = { handleWebhook, processCard }; 