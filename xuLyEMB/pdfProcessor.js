const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

/**
 * Chạy file Python extract_stop.py để trích xuất Stop Sequence
 * @param {string} pdfPath - Đường dẫn đến file PDF
 */
async function processPDF(pdfPath) {
  try {
    console.log(`📄 Đang xử lý file PDF: ${pdfPath}`);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(pdfPath)) {
      console.log(`❌ File PDF không tồn tại: ${pdfPath}`);
      return;
    }

    // Lấy tên user hiện tại
    const currentUser = os.userInfo().username || process.env.USERNAME || process.env.USER || 'admin';
    const pythonScriptPath = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'extract_stop.py');
    
    // Kiểm tra file Python có tồn tại không
    if (!fs.existsSync(pythonScriptPath)) {
      console.log(`❌ File Python không tồn tại: ${pythonScriptPath}`);
      return;
    }

    console.log(`🐍 Đang chạy file Python: ${pythonScriptPath}`);
    
    // Chạy file Python
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonScriptPath], {
        cwd: path.dirname(pythonScriptPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            console.log('🔍 Raw output từ Python:');
            console.log(outputData);
            console.log('─'.repeat(60));
            
            // Tìm JSON array hoặc object trong output
            let jsonMatch = outputData.match(/\[[\s\S]*\]/); // Tìm array trước
            if (!jsonMatch) {
              jsonMatch = outputData.match(/\{[\s\S]*\}/); // Tìm object nếu không có array
            }
            
            if (jsonMatch) {
              const jsonString = jsonMatch[0];
              const jsonData = JSON.parse(jsonString);
              console.log('✅ so buoc chi da lay ***************************:');
              console.log(JSON.stringify(jsonData, null, 2));
              
            } else {
              console.log('❌ Không tìm thấy JSON trong output Python');
              resolve(null);
            }
          } catch (parseError) {
            console.error('❌ Lỗi parse JSON:', parseError.message);
            console.log('🔍 JSON string gây lỗi:');
            console.log(jsonMatch ? jsonMatch[0] : 'Không tìm thấy JSON');
            resolve(null);
          }
        } else {
          console.error(`❌ Python script lỗi với code: ${code}`);
          console.error('Error:', errorData);
          reject(new Error(`Python script failed with code ${code}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Lỗi chạy Python script:', error.message);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error("❌ Lỗi khi xử lý PDF:", error.message);
  }
}

/**
 * Chờ file xuất hiện với timeout
 * @param {string} filePath - Đường dẫn file cần chờ
 * @param {number} timeoutMs - Thời gian chờ tối đa (ms)
 * @returns {Promise<boolean>} - True nếu file xuất hiện, False nếu timeout
 */
function waitForFile(filePath, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkFile = () => {
      try {
        if (fs.existsSync(filePath)) {
          // Kiểm tra thêm xem file có thể đọc được không
          const stats = fs.statSync(filePath);
          if (stats.size > 0) {
            console.log(`✅ File đã xuất hiện sau ${Date.now() - startTime}ms (kích thước: ${stats.size} bytes)`);
            // Chờ thêm 1 giây để đảm bảo file đã được ghi hoàn toàn
            setTimeout(() => resolve(true), 1000);
            return;
          } else {
            console.log(`⏳ File tồn tại nhưng rỗng, chờ thêm...`);
          }
        }
      } catch (error) {
        console.log(`⏳ Lỗi kiểm tra file: ${error.message}, thử lại...`);
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeoutMs) {
        console.log(`⏰ Timeout sau ${timeoutMs}ms - File không xuất hiện hoặc không thể đọc`);
        resolve(false);
        return;
      }
      
      // Kiểm tra lại sau 200ms
      setTimeout(checkFile, 200);
    };
    
    checkFile();
  });
}

/**
 * Xử lý file PDF trong thư mục fileEMB
 */
async function processEMBFile() {
  const currentUser = os.userInfo().username || process.env.USERNAME || process.env.USER || 'admin';
  const pdfPath = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'fileEMB', 'file.pdf');
  
  console.log('🔄 Bắt đầu xử lý file PDF sau sự kiện ghi đè...');
  console.log(`📂 Đang chờ file: ${pdfPath}`);
  
  // Chờ file PDF xuất hiện tối đa 10 giây
  const fileExists = await waitForFile(pdfPath, 10000);
  
  if (fileExists) {
    await processPDF(pdfPath);
  } else {
    console.log('❌ Không thể xử lý PDF - File không xuất hiện trong thời gian chờ');
  }
}

module.exports = {
  processPDF,
  processEMBFile
}; 