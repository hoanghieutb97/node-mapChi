const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { processEMBFile } = require('./xuLyEMB/embProcessor');
const { watchStatusFile, stopWatching } = require('./xuLyEMB/fileWatcher');
const { KeyAndApi } = require('./src/config/constants');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
let statusWatcher = null;
const http = require('http');
const connectDB = require('./src/config/db');
const { startJSONServer } = require('./src/server/startServer');
const { handleWebhook } = require('./src/services/trello/webhook');

const cardValidator = require('./src/services/trello/card-validator');
const getListTrelloAuto = require('./src/services/trello/getListTrelloAuto');
const webhookCreator = require('./src/services/trello/webhook-creator');


global.listTrello = [];

// Middleware để parse JSON
app.use(cors({
  origin: "*", // Cho phép tất cả origins
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(cors({
  origin: "*", // Cho phép tất cả origins
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(bodyParser.json());
const server = http.createServer(app);
// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'fileEMB');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}_${originalName}`);
  }
});
var arayxx = []
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận file .emb
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.emb')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .emb'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  }
});
async function initialize() {
  try {

    // 3. Kết nối database
    await connectDB();
    // 4. Khởi động JSON Server
    await startJSONServer();
    // 6. Xử lý card và file chưa up lên mongo
    await cardValidator();
    // 7. Tự động lấy card mới 
    await getListTrelloAuto();
    // 8. Setup webhook Trello 
    await webhookCreator();

    console.log('all start connected************');


  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

initialize();
// API nhận link mạng LAN và tìm file EMB
app.post('/api/sendEMB', (req, res) => {
  try {
    const { networkPath } = req.body;

    if (!networkPath) {
      return res.status(400).json({
        error: 'Thiếu đường dẫn mạng LAN',
        message: 'Vui lòng gửi networkPath trong body'
      });
    }

    // Sử dụng module embProcessor để xử lý
    const result = processEMBFile(networkPath);

    if (result.success) {
      res.json({
        message: result.message,
        sourceFile: result.sourceFile,
        targetPath: result.targetPath,
        fileSize: result.fileSize,
        exeResult: result.exeResult,
        timestamp: result.timestamp,
        status: 'success'
      });
    } else {
      res.status(result.statusCode || 500).json({
        error: result.error,
        message: result.message,
        ...(result.foundFiles && { foundFiles: result.foundFiles }),
        ...(result.embFiles && { embFiles: result.embFiles }),
        ...(result.source && { source: result.source }),
        ...(result.target && { target: result.target }),
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Lỗi xử lý file EMB:', error);
    res.status(500).json({
      error: 'Lỗi xử lý file EMB',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware xử lý lỗi upload
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File quá lớn',
        message: 'Kích thước file không được vượt quá 10MB'
      });
    }
  }

  if (error.message === 'Chỉ chấp nhận file .emb') {
    return res.status(400).json({
      error: 'Loại file không hợp lệ',
      message: 'Chỉ chấp nhận file .emb'
    });
  }

  next(error);
});
app.post('/webhook/trello', handleWebhook);

app.get('/webhook/trello', (req, res) => {

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.status(200).send('Success');
});

app.post('/createFolderEMB', (req, res) => {
  const { orderId, barcode, variant } = req.body;
  if (!orderId || !barcode || !variant) {
    return res.status(400).json({ message: 'Missing orderId, barcode, or variant' });
  }

  const folderPath = path.join('\\\\192.168.1.240\\fileTheu', orderId, barcode,variant);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to create/check folder', error: err });
    }
    res.status(200).json({ message: 'Folder ensured', path: folderPath });
  });
});

// Khởi động server
const PORT = KeyAndApi.port || 1001;

server.listen(PORT, () => {
  console.log(`📱 Truy cập: http://localhost:${PORT}`);
  // Khởi động file watcher
  statusWatcher = watchStatusFile();
});
// Xử lý lỗi
process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt server...');
  stopWatching(statusWatcher);
  process.exit(0);
}); 