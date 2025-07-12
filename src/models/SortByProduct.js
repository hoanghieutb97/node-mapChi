const mongoose = require('mongoose');

const sortByProductSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['variant_orderId_sku', 'nameId_orderId_sku', 'width_orderId_sku'],
        required: true
    },
    products: [{
        type: String,
        required: true
    }]
}, { collection: 'sort-by-product' });

module.exports = mongoose.model('SortByProduct', sortByProductSchema); 