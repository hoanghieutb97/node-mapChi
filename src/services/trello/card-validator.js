const axios = require('axios');
const { addNewCardXlsx, uploadFileToTrello } = require('./card-creator');
const { KeyAndApi, JSON_SERVER } = require('../../config/constants');
const mongoose = require('mongoose');
const listDonService = require('../mongo/listDonService');

async function checkCreateCard() {
    try {
        const response = await axios.get(JSON_SERVER.CREATE_ENDPOINT);
        const listCreate = response.data;
        
        // Xử lý từng item trong listCreate
        for (let i = 0; i < listCreate.length; i++) {
            const item = listCreate[i];
            
            try {
                // Sử dụng createIfNotExists để xử lý
                const result = await listDonService.createIfNotExists(item);
                
                if (result.success) {
                    // Tạo thành công (chưa tồn tại)
                    console.log(`✅ Đã tạo item mới từ JSON Server - barcode: ${item.barcode}`);
                } else {
                    // Đã tồn tại
              
                }
                
                // Xóa item khỏi JSON Server sau khi xử lý (dù thành công hay đã tồn tại)
                try {
                    await axios.delete(`${JSON_SERVER.CREATE_ENDPOINT}/${item.id}`);
                   
                } catch (deleteError) {
                    console.error(`❌ Lỗi khi xóa item khỏi JSON Server:`, deleteError.message);
                }
            } catch (error) {
                // Lỗi thì bỏ qua và log
                console.error(`❌ Lỗi khi xử lý item barcode ${item.barcode}:`, error.message);
                continue; // Bỏ qua item này, xử lý item tiếp theo
            }
        }


    } catch (error) {
        // Im lặng xử lý lỗi
    }

    setTimeout(checkCreateCard, 540000); // Thử lại sau 30 phút mặc định
}
module.exports = checkCreateCard