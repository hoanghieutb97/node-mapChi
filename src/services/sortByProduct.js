const SortByProduct = require('../models/SortByProduct');

let cachedSortByProduct = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 phút

async function getSortByProduct() {
    // Nếu cache còn hạn và có data
    if (cachedSortByProduct && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return cachedSortByProduct;
    }

    try {
        const sortByProduct = await SortByProduct.find();
        const result = {
            variant_orderId_sku: sortByProduct.find(s => s.type === 'variant_orderId_sku')?.products || [],
            nameId_orderId_sku: sortByProduct.find(s => s.type === 'nameId_orderId_sku')?.products || [],
            width_orderId_sku: sortByProduct.find(s => s.type === 'width_orderId_sku')?.products || []
        };

        // Cập nhật cache
        cachedSortByProduct = result;
        lastFetchTime = Date.now();
        
        return result;
    } catch (error) {
        console.error('Error getting SortByProduct:', error);
        // Nếu có cache cũ, dùng cache cũ
        if (cachedSortByProduct) {
            return cachedSortByProduct;
        }
        // Nếu không có cache, trả về mảng rỗng
        return {
            variant_orderId_sku: [],
            nameId_orderId_sku: [],
            width_orderId_sku: []
        };
    }
}

module.exports = { getSortByProduct }; 