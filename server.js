const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
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
const nodeHtmlToImage = require('node-html-to-image')
const cardValidator = require('./src/services/trello/card-validator');
const getListTrelloAuto = require('./src/services/trello/getListTrelloAuto');
const webhookCreator = require('./src/services/trello/webhook-creator');
const WebSocket = require('ws');
const usersService = require('./src/services/mongo/usersService');
const listDonService = require('./src/services/mongo/listDonService');
const FormData = require('form-data');
const sharp = require('sharp')
const QRCode = require('qrcode');
const axios = require('axios');
global.listTrello = [];
global.itemsXuLyEMB = [];


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
const wss = new WebSocket.Server({ server }); // dùng server đang chạy
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

app.post('/createFolderEMB', (req, res) => {
  const { orderId, barcode, variant } = req.body;
  if (!orderId || !barcode || !variant) {
    return res.status(400).json({ message: 'Missing orderId, barcode, or variant' });
  }

  const folderPath = path.join('\\\\192.168.1.240\\fileTheu', orderId, barcode, variant);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to create/check folder', error: err });
    }
    res.status(200).json({ message: 'Folder ensured', path: folderPath });
  });
});

app.post('/nativeCheckUser', async (req, res) => {
  const { userPassword } = req.body;


  const result = await usersService.findByMatKhau(userPassword);
  if (result.success) {
    if (result.data !== null)
      res.status(200).json({ message: 'co mat khau', data: result.data });
    else
      res.status(200).json({ message: 'khong co mat khau', data: false });

  }
  else
    res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });



});

app.post('/getListTheuByVaiTro', async (req, res) => {
  const { vaiTro } = req.body;

  if (vaiTro === "luồn mếch") {
    const result = await listDonService.findByDoiLamKhuon();

    if (result.success) {
      return res.status(200).json({ message: 'co mat khau', data: result.data });
    } else {
      return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
    }
  } else
    if (vaiTro === "thêu") {
      const result = await listDonService.findByDoiTheu();

      if (result.success) {
        return res.status(200).json({ message: 'co mat khau', data: result.data });
      } else {
        return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
      }
    }

  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});


app.post('/userLuonMechCancel', async (req, res) => {
  const { item } = req.body;
  let { _id, ...updateData } = item;
  updateData = { ...updateData, items: updateData.items.map(itemxxx => ({ ...itemxxx, userLamKhuon: "" })) }
  const result = await listDonService.updateById(item._id, updateData);
  if (result.success) {
    WS_userLuonMechActive_fetchALl();
    return res.status(200).json({ message: 'userLuonMechActive', data: result.data })
  } else {
    return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
  }
  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});

app.post('/userInTemDonHang', async (req, res) => {
  const { item } = req.body;
  // Tạo QR code cho barcode
  let barcodeQR = '';
  if (item.barcode) {
    try {
      barcodeQR = await QRCode.toDataURL(item.barcode, { width: 500 });
    } catch (e) {
      barcodeQR = '';
    }
  }
  const html = `
  <html>
    <head>
      <style>
        body {
          width: 1181px;
          height: 1772px;
          font-family: Arial, sans-serif;
          padding: 40px;
          box-sizing: border-box;
        }
        h1 { font-size: 48px; }
        .label { font-size: 36px; margin-bottom: 12px; }
        .value { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Thông Tin Đơn Hàng</h1>
      <div class="label">Order ID: <span class="value">${item.orderId}</span></div>
      <div class="label">Product: <span class="value">${item.product}</span></div>

<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; font-family: Arial, sans-serif;">
  <div style="flex: 1; border: 1px solid #ccc; padding: 12px; background: #f9f9f9; border-radius: 8px;">
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Variant: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.variant}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Quantity: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.Quantity}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Country: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.country}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">NameID: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.nameId}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Priority: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.Priority}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Date: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.dateItem}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Barcode: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.barcode}</span></div>
    <div style="font-weight: bold; margin-bottom: 2px; font-size: 40px;">Partner: <span style="font-weight: normal; color: #333; margin-left: 4px;">${item.partner}</span></div>
  </div>

  <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
    <img src="${barcodeQR}" alt="QR code" style="max-width: 100%; max-height: 500px;" />
  </div>
</div>



      ${Array.isArray(item.items) && item.items.length > 0 ? `
        <div style="margin-top:32px;">
          <h2>Danh sách chi tiết Items</h2>
          ${item.items.map((subItem, idx) => `
            <div style="border:1px solid #ccc; padding:16px; margin-bottom:16px; border-radius:8px;">
              <div class="label">Item #${idx + 1}</div>
              <div class="label">Position: <span class="value">${subItem.positionTheu}</span></div>
            
              
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
  </html>
`
  const dir = path.join(__dirname, 'output')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  const outputPng = path.join(dir, 'order-info.png')
  const outputJpg = path.join(dir, 'order-info.jpg')
  nodeHtmlToImage({
    output: outputPng,
    html: html
  }).then(() => {
    console.log('✅ PNG đã tạo, đang chuyển sang JPG...')
    sharp(outputPng)
      .jpeg({ quality: 90 })
      .toFile(outputJpg)
      .then(async () => {
        // Gửi file JPG vừa lưu tới endpoint máy in
        const axios = require('axios');
        const FormData = require('form-data');
        const fs = require('fs');
        const form = new FormData();
        form.append('image', fs.createReadStream(outputJpg));
        try {
          await axios.post('http://192.168.1.220:1004/print', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          console.log('✅ Đã gửi file JPG tới máy in!');
        } catch (err) {
          console.error('❌ Lỗi gửi file tới máy in:', err.message);
        }
      })
  })

  // console.log(item);

  return res.status(200).json({ message: 'oke in tem' });
});

app.post('/checkHaveEMBFile', async (req, res) => {

  const { folderPath, ActiveItem } = req.body;


  try {
    const files = await fsPromises.readdir(folderPath);
    const embFiles = files.filter(file => path.extname(file).toLowerCase() === '.emb');

    if (embFiles.length === 0) {
      res.status(200).json({ data: false, message: '⛔ Không có file .EMB trong thư mục' });
    } else if (embFiles.length > 1) {
      res.status(200).json({ data: false, message: '⛔ Có nhiều file .EMB' });
    } else {
      res.status(200).json({ data: true, message: '✅ Có đúng 1 file .EMB' });
      if (global.itemsXuLyEMB.length === 0) {
        processEMBFile(folderPath)
      }
      global.itemsXuLyEMB.push({ ...ActiveItem, networkPath: folderPath, SlBuocChi: [] });
    }
  } catch (err) {
    res.status(500).json({ error: '❌ Lỗi đọc thư mục', detail: err.message });
  }

});


app.post('/userTheuDone', async (req, res) => {
  const { item, accessToken } = req.body;
  let { _id, ...updateData } = item;

  const result = await listDonService.updateById(_id, updateData);


  if (!result.success) {
    return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
  }

  const barcode = updateData.barcode;

  try {
    const response = await axios.get("https://industry-apis.printway.io/api/v1/print/check-barcode", {
      params: { barcode },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });


    return res.status(200).json({ message: 'userTheuDone', data: result.data });

  } catch (err) {
    console.error("❌ Lỗi:", err.response?.data || err.message);

    if (err.response?.data?.message === "Unauthorized") {


      return res.status(200).json({ message: 'Unauthorized', data: result.data });
    }

    return res.status(500).json({ message: 'Lỗi gọi API check-barcode', data: result.data });
  }
});


app.post('/userTheuQuetIn', async (req, res) => {
  const { barcode, accessToken } = req.body;

  try {
    await axios.get("https://industry-apis.printway.io/api/v1/print/check-barcode", {
      params: { barcode },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });


    return res.status(200).json({ message: 'userTheuDone', data: result.data });

  } catch (err) {
    console.error("❌ Lỗi:", err.response?.data || err.message);

    if (err.response?.data?.message === "Unauthorized") {
      return res.status(200).json({ message: 'Unauthorized', data: result.data });
    }

    return res.status(500).json({ message: 'Lỗi gọi API check-barcode', data: result.data });
  }
});

app.post('/userLuonMechDone', async (req, res) => {
  const { item, user } = req.body;
  let { _id, ...updateData } = item;
  updateData = { ...updateData, items: updateData.items.map(itemxxx => ({ ...itemxxx, status: "doiTheu", userLamKhuon: user })) }
  const result = await listDonService.updateById(item._id, updateData);
  if (result.success) {
    console.log("đợi thêu ...............");

    WS_userLuonMechActive_fetchALl();
    return res.status(200).json({ message: 'userLuonMechActive', data: result.data })
  } else {
    return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
  }
  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});


app.post('/userLuonMechActive', async (req, res) => {
  const { item, user } = req.body;
  // console.log("item", item);
  // console.log("user", user);

  if (true) {
    let { _id, ...updateData } = item;
    updateData = { ...updateData, items: updateData.items.map(itemxxx => ({ ...itemxxx, userLamKhuon: user })) }
    const result = await listDonService.updateById(item._id, updateData);


    if (result.success) {
      WS_userLuonMechActive_fetchALl();
      return res.status(200).json({ message: 'userLuonMechActive', data: result.data });

    } else {
      return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
    }
  }

  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});

app.post('/userTheuActive', async (req, res) => {
  const { _id, updateData } = req.body;
  // console.log("item", item);
  // console.log("user", user);


  const result = await listDonService.updateById(_id, updateData);


  if (result.success) {
    WS_userLuonMechActive_fetchALl();
    return res.status(200).json({ message: 'userTheuActive', data: result.data });

  } else {
    return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
  }


  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});

app.post('/getItemByBarcode', async (req, res) => {
  const { barcode } = req.body;
  console.log("barcode", barcode);
  // console.log("user", user);



  const result = await listDonService.findByBarcode(barcode);


  if (result.success) {
    WS_userLuonMechActive_fetchALl();
    return res.status(200).json({ message: 'userLuonMechActive', data: result.data });

  } else {
    return res.status(400).json({ message: 'loi ko the req toi mongo server 1001', data: false });
  }


  return res.status(400).json({ message: 'Sai vai trò nhé', data: false });
});


app.post('/sendDstFileToTheu', async (req, res) => {
  const { url } = req.body; // VD: url = 'PWS7413118/42000018643651/artwork_left_chest'


  const filePath = path.join(url, 'file.dst');

  // 📨 Tạo form và gửi đi
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://192.168.1.220:1007/upload', form, {
      headers: form.getHeaders()
    });


    return res.status(200).json({ message: response.data.message, data: response.data.success });
  } catch (err) {
    console.error('❌ Lỗi gửi file DST:', err.message);
    return res.status(500).json({ message: 'lỗi khi copy USB', error: err.message });
  }
});

function WS_userLuonMechActive_fetchALl() {
  for (let client of clients.mech) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'fetchALL' }));
    }
  }
}
const clients = {
  theu: new Set(),
  mech: new Set()
};

wss.on('connection', (ws) => {


  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'auth') {
      ws.user = data.user;
      ws.vaiTro = data.vaiTro;

      // Gán client vào nhóm phù hợp
      if (ws.vaiTro === 'thêu') clients.theu.add(ws);
      else if (ws.vaiTro === 'luồn mếch') clients.mech.add(ws);

      console.log(`📌 ${ws.user} đã đăng nhập vaiTrò: ${ws.vaiTro}`);
    }
  });

  ws.on('close', () => {
    clients.theu.delete(ws);
    clients.mech.delete(ws);
    console.log(clients);
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