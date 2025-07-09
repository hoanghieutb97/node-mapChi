const fs = require('fs');

// Đọc file danh sách màu
const data = fs.readFileSync('danhsach_tenchi.txt', 'utf8');
const lines = data.trim().split('\n');

// Đếm các dòng hợp lệ (có format: MÃ - R,G,B)
let validCount = 0;
const validColors = [];

lines.forEach((line, index) => {
  const parts = line.split(' - ');
  if (parts.length === 2) {
    const maChi = parts[0].trim();
    const rgb = parts[1].trim();
    
    // Kiểm tra format RGB
    if (rgb.match(/^\d+,\d+,\d+$/)) {
      validCount++;
      validColors.push({ maChi, rgb, lineNumber: index + 1 });
    }
  }
});

console.log('📊 THỐNG KÊ DANH SÁCH MÀU:');
console.log('========================');
console.log(`📄 Tổng số dòng trong file: ${lines.length}`);
console.log(`✅ Số mã màu hợp lệ: ${validCount}`);
console.log(`❌ Số dòng không hợp lệ: ${lines.length - validCount}`);

// Kiểm tra các dòng không hợp lệ
console.log('\n🔍 CÁC DÒNG KHÔNG HỢP LỆ:');
lines.forEach((line, index) => {
  if (!line.includes(' - ') || !line.match(/^[A-Z]\d+ - \d+,\d+,\d+$/)) {
    console.log(`Dòng ${index + 1}: "${line}"`);
  }
});

console.log('\n📋 10 MÃ MÀU ĐẦU TIÊN:');
validColors.slice(0, 10).forEach(color => {
  console.log(`${color.lineNumber}. ${color.maChi} - ${color.rgb}`);
});

console.log('\n📋 10 MÃ MÀU CUỐI CÙNG:');
validColors.slice(-10).forEach(color => {
  console.log(`${color.lineNumber}. ${color.maChi} - ${color.rgb}`);
}); 