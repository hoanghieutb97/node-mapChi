const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

/**
 * Đọc file PDF cụ thể
 */
async function readSpecificPDF() {
  const pdfPath = 'C:\\Users\\admin\\Desktop\\serverEMB\\fileEMB\\file.pdf';
  
  try {
    console.log('📄 Đang đọc file PDF...');
    console.log(`   📂 Đường dẫn: ${pdfPath}`);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ File không tồn tại!');
      return;
    }
    
    // Đọc file PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    console.log(`   📏 Kích thước file: ${(dataBuffer.length / 1024).toFixed(2)} KB`);
    
    // Parse PDF
    const data = await pdf(dataBuffer);
    
    console.log('\n📊 THÔNG TIN PDF:');
    console.log(`   📄 Số trang: ${data.numpages}`);
    console.log(`   📝 Độ dài text: ${data.text.length} ký tự`);
    
    if (data.info) {
      console.log(`   📋 Tiêu đề: ${data.info.Title || 'Không có'}`);
      console.log(`   👤 Tác giả: ${data.info.Author || 'Không có'}`);
      console.log(`   📅 Ngày tạo: ${data.info.CreationDate || 'Không có'}`);
    }
    
    console.log('\n📝 NỘI DUNG (200 ký tự đầu):');
    console.log('─'.repeat(50));
    console.log(data.text.substring(0, 200));
    if (data.text.length > 200) {
      console.log('...');
    }
    console.log('─'.repeat(50));
    
    console.log('\n📝 NỘI DUNG ĐẦY ĐỦ:');
    console.log('─'.repeat(50));
    console.log(data.text);
    console.log('─'.repeat(50));
    
    // Lưu nội dung ra file text để dễ đọc
    const outputPath = path.join(__dirname, 'pdf_content.txt');
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`\n💾 Đã lưu nội dung vào: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Lỗi đọc PDF:', error);
  }
}

// Chạy script
readSpecificPDF(); 