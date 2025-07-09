const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Lọc và hiển thị màu từ file PDF
 */
async function extractColorsFromPDF() {
  const pdfPath = 'C:\\Users\\admin\\Desktop\\serverEMB\\fileEMB\\file.pdf';
  
  try {
    console.log('🎨 BẮT ĐẦU LỌC MÀU TỪ PDF');
    console.log('─'.repeat(60));
    
    // Đọc file PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log('📄 THÔNG TIN PDF:');
    console.log(`   📋 Tiêu đề: ${data.info?.Title || 'Không có'}`);
    console.log(`   👤 Tác giả: ${data.info?.Author || 'Không có'}`);
    console.log(`   📅 Ngày tạo: ${data.info?.CreationDate || 'Không có'}`);
    console.log(`   📄 Số trang: ${data.numpages}`);
    console.log(`   📏 Độ dài text: ${data.text.length} ký tự`);
    
    console.log('\n📝 NỘI DUNG ĐẦY ĐỦ:');
    console.log('─'.repeat(60));
    console.log(data.text);
    console.log('─'.repeat(60));
    
    // Tách từng dòng
    const lines = data.text.split('\n');
    
    console.log('\n🎨 LỌC CÁC DÒNG MÀU:');
    console.log('─'.repeat(60));
    
    const colors = [];
    let inColorSection = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Tìm phần bắt đầu màu
      if (trimmedLine.includes('Stop Sequence:') || trimmedLine.includes('#N#ColorSt.CodeNameChartElement')) {
        inColorSection = true;
        console.log(`📍 Bắt đầu phần màu tại dòng ${index + 1}: "${trimmedLine}"`);
        return;
      }
      
      // Thoát khỏi phần màu
      if (inColorSection && (trimmedLine.includes('Production Worksheet') || trimmedLine.includes('Wilcom EmbroideryStudio'))) {
        inColorSection = false;
        console.log(`📍 Kết thúc phần màu tại dòng ${index + 1}: "${trimmedLine}"`);
        return;
      }
      
      // Xử lý dòng màu
      if (inColorSection && trimmedLine.match(/^\d+\./)) {
        console.log(`🎨 Dòng ${index + 1}: ${trimmedLine}`);
        
        // Tách thông tin màu
        const colorMatch = trimmedLine.match(/^(\d+)\.\s*([^R]+)?\s*(R\d+\s*G\d+\s*B\d+)/);
        if (colorMatch) {
          const colorIndex = parseInt(colorMatch[1]);
          const colorName = colorMatch[2] ? colorMatch[2].trim() : `Color ${colorIndex}`;
          const rgbRaw = colorMatch[3].replace(/\s+/g, '');
          
          // Chuyển đổi R58G122B57 thành 58,122,57
          const rgbMatch = rgbRaw.match(/R(\d+)G(\d+)B(\d+)/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const rgb = `${r},${g},${b}`;
            
            colors.push({
              index: colorIndex,
              name: colorName,
              rgb: rgb,
              rgbRaw: rgbRaw,
              lineNumber: index + 1
            });
            
            console.log(`   ✅ Màu ${colorIndex}: ${colorName} → RGB(${r}, ${g}, ${b})`);
          }
        }
      }
    });
    
    console.log('\n📊 KẾT QUẢ LỌC MÀU:');
    console.log('─'.repeat(60));
    console.log(`🎨 Tổng số màu tìm thấy: ${colors.length}`);
    
    if (colors.length > 0) {
      console.log('\n🎨 DANH SÁCH MÀU:');
      colors.forEach(color => {
        console.log(`   ${color.index}. ${color.name}`);
        console.log(`      RGB: ${color.rgb}`);
        console.log(`      Raw: ${color.rgbRaw}`);
        console.log(`      Dòng: ${color.lineNumber}`);
        console.log('');
      });
      
      // Lưu kết quả ra file
      const outputPath = 'extracted_colors.json';
      fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2), 'utf8');
      console.log(`💾 Đã lưu danh sách màu vào: ${outputPath}`);
    }
    
    // Tìm thông tin thiết kế
    console.log('\n📋 THÔNG TIN THIẾT KẾ:');
    console.log('─'.repeat(60));
    
    const designInfo = {};
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('Stitches:')) {
        designInfo.stitches = trimmedLine.split(':')[1]?.trim();
      }
      if (trimmedLine.includes('Height:')) {
        designInfo.height = trimmedLine.split(':')[1]?.trim();
      }
      if (trimmedLine.includes('Width:')) {
        designInfo.width = trimmedLine.split(':')[1]?.trim();
      }
      if (trimmedLine.includes('Colors:')) {
        designInfo.colors = trimmedLine.split(':')[1]?.trim();
      }
      if (trimmedLine.includes('Colorway:')) {
        designInfo.colorway = trimmedLine.split(':')[1]?.trim();
      }
    });
    
    Object.entries(designInfo).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

// Chạy script
extractColorsFromPDF(); 