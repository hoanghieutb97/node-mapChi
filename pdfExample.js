const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Đọc nội dung file PDF
 * @param {string} pdfPath - Đường dẫn file PDF
 * @returns {Promise<Object>} - Kết quả đọc PDF
 */
async function readPDF(pdfPath) {
  try {
    // Đọc file PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse PDF
    const data = await pdf(dataBuffer);
    
    console.log('📄 Thông tin PDF:');
    console.log(`   📊 Số trang: ${data.numpages}`);
    console.log(`   📏 Kích thước: ${data.info?.Title || 'Không có tiêu đề'}`);
    console.log(`   📝 Nội dung (100 ký tự đầu): ${data.text.substring(0, 100)}...`);
    
    return {
      success: true,
      numpages: data.numpages,
      info: data.info,
      text: data.text,
      textLength: data.text.length
    };
    
  } catch (error) {
    console.error('❌ Lỗi đọc PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tìm kiếm text trong PDF
 * @param {string} pdfPath - Đường dẫn file PDF
 * @param {string} searchText - Text cần tìm
 * @returns {Promise<Object>} - Kết quả tìm kiếm
 */
async function searchInPDF(pdfPath, searchText) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    const lowerText = data.text.toLowerCase();
    const lowerSearch = searchText.toLowerCase();
    
    if (lowerText.includes(lowerSearch)) {
      const index = lowerText.indexOf(lowerSearch);
      const context = data.text.substring(Math.max(0, index - 50), index + searchText.length + 50);
      
      return {
        success: true,
        found: true,
        context: context,
        position: index
      };
    } else {
      return {
        success: true,
        found: false,
        message: `Không tìm thấy "${searchText}" trong PDF`
      };
    }
    
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm trong PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ví dụ sử dụng
// readPDF('./example.pdf').then(result => console.log(result));
// searchInPDF('./example.pdf', 'từ khóa').then(result => console.log(result));

module.exports = {
  readPDF,
  searchInPDF
}; 