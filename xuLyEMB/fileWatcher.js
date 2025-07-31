const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const { processPDFFile } = require('./pdfProcessor');

/**
 * Theo dõi thay đổi file status.txt trong thư mục serverEMB
 */
function watchStatusFile() {
  // Lấy tên user hiện tại
  const currentUser = os.userInfo().username || process.env.USERNAME || process.env.USER || 'admin';
  const statusFilePath = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'status.txt');
  const watchDir = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB');


  console.log(`📄 Đang theo dõi file: ${statusFilePath}`);

  // Khởi tạo watcher
  const watcher = chokidar.watch(watchDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });

  // Chỉ bắt sự kiện thay đổi file (ghi đè)
  watcher.on('change', async (filePath) => {
    if (path.basename(filePath) === 'status.txt') {

      console.log('🔄 Đã ghi đè file status.txt');
      console.log(`   📂 Đường dẫn: ${filePath}`);
      console.log(`   ⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`);

      // Gọi hàm xử lý PDF sau khi bắt được sự kiện ghi đè
      try {

        await processPDFFile();


      } catch (error) {
        console.error('❌ Lỗi khi xử lý PDF:', error.message);
      }
    }
  });

  // Bắt lỗi
  watcher.on('error', (error) => {
    console.error('❌ Lỗi theo dõi file:', error);
  });

  // Bắt sự kiện ready
  watcher.on('ready', () => {
    console.log('✅ Đã sẵn sàng theo dõi file status.txt');
  });

  return watcher;
}

/**
 * Dừng theo dõi file
 * @param {Object} watcher - Watcher instance
 */
function stopWatching(watcher) {
  if (watcher) {
    watcher.close();
    console.log('🛑 Đã dừng theo dõi file status.txt');
  }
}

module.exports = {
  watchStatusFile,
  stopWatching
}; 