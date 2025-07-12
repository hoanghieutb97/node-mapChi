const mongoose = require('mongoose');
const listDonService = require('./listDonService');
const axios = require('axios');
const { JSON_SERVER } = require('../../config/constants');

/**
 * Ghi item lỗi vào JSON Server
 * @param {Object} item - Item cần ghi
 * @param {String} error - Lỗi xảy ra
 */
async function writeErrorToJsonServer(item) {
    try {
        await axios.post(JSON_SERVER.CREATE_ENDPOINT, item);
        console.log(`📝 Đã ghi item lỗi vào JSON Server - barcode: ${item.barcode}`);
    } catch (jsonError) {
        console.error(`❌ Lỗi khi ghi vào JSON Server:`, jsonError.message);
    }
}

/**
 * Push danh sách Excel vào MongoDB
 * @param {Array} listExcel - Danh sách dữ liệu Excel cần push
 * @returns {Object} - Kết quả xử lý
 */
async function pushItemMongo(listExcel) {
    // Lọc và chỉ lấy những trường cần thiết
    let items = listExcel.map(item => ({
        orderId: item.orderId,
        barcode: item.barcode,
        Quantity: item.Quantity,
        variant: item.variant,
        country: item.country,
        product: item.product,
        partner: item.partner,
        urlDesign: item.urlDesign,
        dateItem: item.dateItem,
        Priority: item.Priority,
        nameId: item.nameId,
        status1:"",
        status2:"",
        status3:""

    }));
    let allItems = items.map(item => {
        // Xử lý urlDesign
        let processedUrls = [];
        if (item.urlDesign) {
            // Xóa tất cả ?download=yes và tách thành mảng
            let cleanUrl = item.urlDesign.replace(/\?download=yes/g, '');
            console.log('cleanUrl', cleanUrl);
            
            // Tách theo dấu ; và lọc mảng rỗng
            let urlArray = cleanUrl.split(';').filter(url => url.trim() !== '');
            
            // Chuyển mỗi URL thành object với urlDesignItem và positionTheu
            processedUrls = urlArray.map(url => {
                const urlParts = url.split('?');
                return {
                    urlImage: urlParts[0], // Phần trước dấu ?
                    positionTheu: urlParts[1] ? urlParts[1].replace('area=', '') : '' ,// Phần sau dấu ? (đã xóa area=)
                    stopLess:[],
                    slCuonCHi:0,
                    urlEMB:"",
                    status:"doiThietKe",
                    userThietKe:"",
                    userLamKhuon:"",
                    idMayTheu:"",
                    userTheu:"",
                    userThem1:"",
                    userThem2:"",
                   status1:"",
                   status2:"",

                };
            });
        }
        
        return {
            ...item,
            items: processedUrls
        }
    })
    
    console.log('allItems', allItems);
    
    try {
        console.log('items', allItems[0].items);
        
                // Lọc và tạo item trong MongoDB sử dụng service (xử lý song song)
        let errorItems = [];

        const promises = allItems.map(async (item) => {
            try {
                const result = await listDonService.createIfNotExists(item);
                if (result.success) {
                    console.log(`✅ ${result.message} - barcode: ${item.barcode}`);
                } else {
                    console.log(`⚠️ ${result.message} - barcode: ${item.barcode}`);
                }
            } catch (error) {
                console.error(`❌ Lỗi khi xử lý item barcode ${item.barcode}:`, error.message);
                errorItems.push({
                    barcode: item.barcode,
                    error: error.message
                });
                
                // Ghi item lỗi vào JSON Server
                await writeErrorToJsonServer(item);
            }
        });

        // Đợi tất cả promises hoàn thành
        await Promise.all(promises);

        return {
            success: true,
            message: 'Push dữ liệu thành công',
            count: allItems.length,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Lỗi khi push dữ liệu vào MongoDB:', error);
        throw error;
    }
}

module.exports = { pushItemMongo }; 