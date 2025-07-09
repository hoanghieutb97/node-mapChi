const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { log } = require('console');

/**
 * Xử lý file EMB từ đường dẫn mạng LAN
 * @param {string} networkPath - Đường dẫn mạng LAN chứa file EMB
 * @returns {Object} - Kết quả xử lý
 */
function processEMBFile(networkPath) {
  try {
    console.log(`   📂 Đường dẫn: ${networkPath}`);

    // Kiểm tra thư mục có tồn tại không
    if (!fs.existsSync(networkPath)) {
      console.log('❌ Thư mục không tồn tại');
      return {
        success: false,
        error: 'Thư mục không tồn tại',
        message: `Không tìm thấy thư mục: ${networkPath}`,
        statusCode: 404
      };
    }

    // Tìm tất cả file .emb trong thư mục
    const files = fs.readdirSync(networkPath);
    const embFiles = files.filter(file => file.toLowerCase().endsWith('.emb'));
    
    console.log(embFiles);
    // Kiểm tra số lượng file EMB
    if (embFiles.length === 0) {
      console.log('❌ Không tìm thấy file .emb nào');
      return {
        success: false,
        error: 'Không tìm thấy file EMB',
        message: `Không có file .emb nào trong thư mục: ${networkPath}`,
        foundFiles: files,
        statusCode: 404
      };
    }

    if (embFiles.length > 1) {
      console.log('❌ Có nhiều file .emb - không thể xử lý');
      return {
        success: false,
        error: 'Có nhiều file EMB',
        message: `Tìm thấy ${embFiles.length} file .emb, chỉ cho phép 1 file`,
        embFiles: embFiles,
        statusCode: 400
      };
    }

    // Chỉ có 1 file EMB - xử lý copy
    const sourceFile = embFiles[0];
    const sourcePath = path.join(networkPath, sourceFile);

    // Lấy tên user hiện tại bằng nhiều cách
    const currentUser = os.userInfo().username || process.env.USERNAME || process.env.USER || 'admin';
    const targetPath = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'fileEMB', 'file.emb');

    // Tạo thư mục fileEMB nếu chưa có
    const fileEMBDir = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'fileEMB');
    if (!fs.existsSync(fileEMBDir)) {
      fs.mkdirSync(fileEMBDir, { recursive: true });
    }

    // Xóa tất cả file cũ trong thư mục fileEMB (tuần tự)
    console.log('🗑️ Bắt đầu xóa file cũ trong thư mục fileEMB...');
    const existingFiles = fs.readdirSync(fileEMBDir);
    
    if (existingFiles.length === 0) {
      console.log('📁 Thư mục fileEMB đã trống');
    } else {
      // Xóa từng file một cách tuần tự
      for (let i = 0; i < existingFiles.length; i++) {
        const file = existingFiles[i];
        const filePath = path.join(fileEMBDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
        }
      }
      
      console.log('✅ Hoàn thành xóa file cũ');
    }

    // Copy file EMB
    try {
      fs.copyFileSync(sourcePath, targetPath);
      const fileStats = fs.statSync(targetPath);
      console.log('✅ COPY FILE THÀNH CÔNG:');

      // Chạy xuLyEMB.exe
      const exeResult = runXuLyEMB(currentUser);
      
      return {
        success: true,
        message: 'Xử lý file EMB thành công',
        sourceFile: sourceFile,
        targetPath: targetPath,
        fileSize: fileStats.size,
        exeResult: exeResult,
        timestamp: new Date().toISOString()
      };

    } catch (copyError) {
      console.error('❌ LỖI COPY FILE:', copyError);
      return {
        success: false,
        error: 'Lỗi copy file EMB',
        message: copyError.message,
        source: sourcePath,
        target: targetPath,
        statusCode: 500
      };
    }

  } catch (error) {
    console.error('❌ Lỗi xử lý file EMB:', error);
    return {
      success: false,
      error: 'Lỗi xử lý file EMB',
      message: error.message,
      statusCode: 500
    };
  }
}

/**
 * Chạy xuLyEMB.exe
 * @param {string} currentUser - Tên user hiện tại
 * @returns {Object} - Kết quả chạy exe
 */
function runXuLyEMB(currentUser) {
  const exePath = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'xulyEMB_autoIT', 'xuLyEMB.exe');
  
  if (fs.existsSync(exePath)) {
    try {
      const child = spawn(exePath, [], {
        cwd: path.dirname(exePath),
        detached: true,
        stdio: 'ignore'
      });

      child.unref();
      console.log(`   ✅ Đã khởi chạy xuLyEMB.exe (PID: ${child.pid})`);
      
      return {
        success: true,
        pid: child.pid,
        message: 'Đã khởi chạy xuLyEMB.exe thành công'
      };
    } catch (exeError) {
      console.log(`   ❌ Lỗi khởi chạy xuLyEMB.exe: ${exeError.message}`);
      return {
        success: false,
        error: exeError.message,
        message: 'Lỗi khởi chạy xuLyEMB.exe'
      };
    }
  } else {
    console.log(`   ❌ Không tìm thấy file: ${exePath}`);
    return {
      success: false,
      error: 'File không tồn tại',
      message: `Không tìm thấy file: ${exePath}`
    };
  }
}

module.exports = {
  processEMBFile,
  runXuLyEMB
}; 