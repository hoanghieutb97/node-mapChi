const mongoose = require('mongoose');

/**
 * Service CRUD cho collection listDon
 */
class ListDonService {
    
    /**
     * Tạo item mới
     * @param {Object} itemData - Dữ liệu item cần tạo
     * @returns {Object} - Kết quả tạo
     */
    async create(itemData) {
        try {
            const result = await mongoose.connection.db.collection('listDon').insertOne(itemData);
            console.log(`✅ Đã tạo item mới với ID: ${result.insertedId}`);
            return {
                success: true,
                message: 'Tạo item thành công',
                data: result
            };
        } catch (error) {
            console.error('❌ Lỗi khi tạo item:', error);
            throw error;
        }
    }

    /**
     * Tạo nhiều items cùng lúc
     * @param {Array} itemsData - Mảng dữ liệu items cần tạo
     * @returns {Object} - Kết quả tạo
     */
    async createMany(itemsData) {
        try {
            const result = await mongoose.connection.db.collection('listDon').insertMany(itemsData);
            console.log(`✅ Đã tạo ${result.insertedCount} items mới`);
            return {
                success: true,
                message: `Tạo ${result.insertedCount} items thành công`,
                data: result
            };
        } catch (error) {
            console.error('❌ Lỗi khi tạo nhiều items:', error);
            throw error;
        }
    }

    /**
     * Lấy tất cả items
     * @param {Object} filter - Bộ lọc (tùy chọn)
     * @returns {Array} - Danh sách items
     */
    async findAll(filter = {}) {
        try {
            const items = await mongoose.connection.db.collection('listDon').find(filter).toArray();
            return {
                success: true,
                message: 'Lấy danh sách thành công',
                data: items,
                count: items.length
            };
        } catch (error) {
            console.error('❌ Lỗi khi lấy danh sách items:', error);
            throw error;
        }
    }

    /**
     * Lấy item theo barcode
     * @param {String} barcode - Barcode cần tìm
     * @returns {Object} - Item tìm được
     */
    async findByBarcode(barcode) {
        try {
            const item = await mongoose.connection.db.collection('listDon').findOne({ barcode });
            return {
                success: true,
                message: item ? 'Tìm thấy item' : 'Không tìm thấy item',
                data: item
            };
        } catch (error) {
            console.error('❌ Lỗi khi tìm item theo barcode:', error);
            throw error;
        }
    }

    /**
     * Lấy item theo ID
     * @param {String} id - ID của item
     * @returns {Object} - Item tìm được
     */
    async findById(id) {
        try {
            const item = await mongoose.connection.db.collection('listDon').findOne({ _id: new mongoose.Types.ObjectId(id) });
            return {
                success: true,
                message: item ? 'Tìm thấy item' : 'Không tìm thấy item',
                data: item
            };
        } catch (error) {
            console.error('❌ Lỗi khi tìm item theo ID:', error);
            throw error;
        }
    }

    /**
     * Cập nhật item theo barcode
     * @param {String} barcode - Barcode cần cập nhật
     * @param {Object} updateData - Dữ liệu cần cập nhật
     * @returns {Object} - Kết quả cập nhật
     */
    async updateByBarcode(barcode, updateData) {
        try {
            const result = await mongoose.connection.db.collection('listDon').updateOne(
                { barcode },
                { $set: updateData }
            );
            
            if (result.matchedCount > 0) {
                console.log(`✅ Đã cập nhật item với barcode: ${barcode}`);
                return {
                    success: true,
                    message: 'Cập nhật thành công',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'Không tìm thấy item để cập nhật'
                };
            }
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật item:', error);
            throw error;
        }
    }

    /**
     * Cập nhật item theo ID
     * @param {String} id - ID của item
     * @param {Object} updateData - Dữ liệu cần cập nhật
     * @returns {Object} - Kết quả cập nhật
     */
    async updateById(id, updateData) {
        try {
            const result = await mongoose.connection.db.collection('listDon').updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: updateData }
            );
            
            if (result.matchedCount > 0) {
                console.log(`✅ Đã cập nhật item với ID: ${id}`);
                return {
                    success: true,
                    message: 'Cập nhật thành công',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'Không tìm thấy item để cập nhật'
                };
            }
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật item:', error);
            throw error;
        }
    }

    /**
     * Xóa item theo barcode
     * @param {String} barcode - Barcode cần xóa
     * @returns {Object} - Kết quả xóa
     */
    async deleteByBarcode(barcode) {
        try {
            const result = await mongoose.connection.db.collection('listDon').deleteOne({ barcode });
            
            if (result.deletedCount > 0) {
                console.log(`✅ Đã xóa item với barcode: ${barcode}`);
                return {
                    success: true,
                    message: 'Xóa thành công',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'Không tìm thấy item để xóa'
                };
            }
        } catch (error) {
            console.error('❌ Lỗi khi xóa item:', error);
            throw error;
        }
    }

    /**
     * Xóa item theo ID
     * @param {String} id - ID của item cần xóa
     * @returns {Object} - Kết quả xóa
     */
    async deleteById(id) {
        try {
            const result = await mongoose.connection.db.collection('listDon').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
            
            if (result.deletedCount > 0) {
                console.log(`✅ Đã xóa item với ID: ${id}`);
                return {
                    success: true,
                    message: 'Xóa thành công',
                    data: result
                };
            } else {
                return {
                    success: false,
                    message: 'Không tìm thấy item để xóa'
                };
            }
        } catch (error) {
            console.error('❌ Lỗi khi xóa item:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra item có tồn tại theo barcode
     * @param {String} barcode - Barcode cần kiểm tra
     * @returns {Boolean} - True nếu tồn tại, False nếu không
     */
    async existsByBarcode(barcode) {
        try {
            const item = await mongoose.connection.db.collection('listDon').findOne({ barcode });
            return !!item;
        } catch (error) {
            console.error('❌ Lỗi khi kiểm tra item:', error);
            throw error;
        }
    }

    /**
     * Tạo item nếu chưa tồn tại (upsert)
     * @param {Object} itemData - Dữ liệu item
     * @returns {Object} - Kết quả
     */
    async createIfNotExists(itemData) {
        try {
            const exists = await this.existsByBarcode(itemData.barcode);
            
            if (!exists) {
                return await this.create(itemData);
            } else {
                console.log(`⚠️ Item với barcode ${itemData.barcode} đã tồn tại, bỏ qua`);
                return {
                    success: false,
                    message: 'Item đã tồn tại',
                    data: null
                };
            }
        } catch (error) {
            console.error('❌ Lỗi khi tạo item nếu chưa tồn tại:', error);
            throw error;
        }
    }
}

module.exports = new ListDonService(); 