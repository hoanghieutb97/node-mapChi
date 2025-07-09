const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { processEMBFile } = require('./xuLyEMB/embProcessor');
const { watchStatusFile, stopWatching } = require('./xuLyEMB/fileWatcher');
const app = express();
const PORT = 1001;
let statusWatcher = null;

// Middleware để parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Hàm chuyển đổi RGB sang Lab (sRGB D65)
function rgbToLab(r, g, b) {
  // Chuyển RGB sang sRGB (0-1)
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // Gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Chuyển sang XYZ (sRGB to XYZ matrix - D65)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  // Chuyển sang Lab (D65 white point)
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  const xr = x / xn;
  const yr = y / yn;
  const zr = z / zn;

  const fx = xr > 0.008856 ? Math.pow(xr, 1 / 3) : (7.787 * xr) + (16 / 116);
  const fy = yr > 0.008856 ? Math.pow(yr, 1 / 3) : (7.787 * yr) + (16 / 116);
  const fz = zr > 0.008856 ? Math.pow(zr, 1 / 3) : (7.787 * zr) + (16 / 116);

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b_lab = 200 * (fy - fz);

  return [L, a, b_lab];
}

// Hàm tính CIEDE2000 (chuẩn CIE)
function calculateCIEDE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  // Weighting factors (graphic arts)
  const kL = 1;
  const kC = 1;
  const kH = 1;

  // Step 1: Calculate C1, C2
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cb = (C1 + C2) / 2;

  // Step 2: Calculate G
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));

  // Step 3: Calculate a1', a2'
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  // Step 4: Calculate C1', C2'
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const Cbp = (C1p + C2p) / 2;

  // Step 5: Calculate h1', h2' (in degrees)
  let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;

  // Normalize to 0-360
  if (h1p < 0) h1p += 360;
  if (h2p < 0) h2p += 360;

  // Step 6: Calculate ΔL', ΔC'
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  // Step 7: Calculate ΔH'
  let dhp = h2p - h1p;
  if (dhp > 180) dhp -= 360;
  if (dhp < -180) dhp += 360;

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI / 180) / 2);

  // Step 8: Calculate H'
  let Hp;
  if (Math.abs(h1p - h2p) <= 180) {
    Hp = (h1p + h2p) / 2;
  } else {
    if (h1p + h2p < 360) {
      Hp = (h1p + h2p + 360) / 2;
    } else {
      Hp = (h1p + h2p - 360) / 2;
    }
  }

  // Step 9: Calculate T
  const T = 1 - 0.17 * Math.cos((Hp - 30) * Math.PI / 180) +
    0.24 * Math.cos((2 * Hp) * Math.PI / 180) +
    0.32 * Math.cos((3 * Hp + 6) * Math.PI / 180) -
    0.2 * Math.cos((4 * Hp - 63) * Math.PI / 180);

  // Step 10: Calculate SL, SC, SH
  const SL = 1 + (0.015 * Math.pow(L1 + L2 - 50, 2)) / Math.sqrt(20 + Math.pow(L1 + L2 - 50, 2));
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;

  // Step 11: Calculate RT
  const RT = -2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7))) *
    Math.sin((60 * Math.exp(-Math.pow((Hp - 275) / 25, 2))) * Math.PI / 180);

  // Step 12: Calculate ΔE00
  const dE = Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
    Math.pow(dCp / (kC * SC), 2) +
    Math.pow(dHp / (kH * SH), 2) +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return dE;
}

// Hàm tính khoảng cách màu sử dụng CIEDE2000
function calculateColorDistance(rgb1, rgb2) {
  const [r1, g1, b1] = rgb1.split(',').map(Number);
  const [r2, g2, b2] = rgb2.split(',').map(Number);

  const lab1 = rgbToLab(r1, g1, b1);
  const lab2 = rgbToLab(r2, g2, b2);

  return calculateCIEDE2000(lab1, lab2);
}

// Hàm tìm màu khớp nhất
function findClosestColor(targetRgb, colorList) {
  if (colorList.length === 0) return null;

  let closestColor = colorList[0];
  let minDistance = calculateColorDistance(targetRgb, colorList[0].rgb);

  for (let i = 1; i < colorList.length; i++) {
    const distance = calculateColorDistance(targetRgb, colorList[i].rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorList[i];
    }
  }

  return {
    ...closestColor,
    distance: minDistance,
    similarity: Math.round(Math.max(0, 100 - minDistance * 2)) // CIEDE2000: 0-100, thường < 50
  };
}

// Đọc danh sách màu từ file
function readColorList() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'danhsach_tenchi.txt'), 'utf8');
    const lines = data.trim().split('\n');
    const colorList = [];

    lines.forEach(line => {
      const parts = line.split(' - ');
      if (parts.length === 2) {
        const maChi = parts[0].trim();
        const rgb = parts[1].trim();
        colorList.push({ maChi, rgb });
      }
    });

    return colorList;
  } catch (error) {
    console.error('Lỗi đọc file danh sách màu:', error);
    return [];
  }
}




// API cập nhật danh sách màu từ Python với tìm màu khớp nhất
app.post('/api/colorsRenew', (req, res) => {
  try {
    const payload = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(payload)) {
      return res.status(400).json({
        error: 'Dữ liệu phải là một mảng',
        received: typeof payload
      });
    }

    // Đọc danh sách màu hiện tại
    const existingColors = readColorList();
    console.log(`📋 Đã load ${existingColors.length} màu từ danh sách hiện tại`);

    // Xử lý từng màu trong payload
    const processedColors = [];
    const matchResults = [];

    payload.forEach((item, index) => {
      if (!item.stt || !item.rgb) {
        throw new Error(`Dữ liệu không hợp lệ: ${JSON.stringify(item)}`);
      }

      // Tạo mã chi từ số thứ tự
      const maChi = item.stt;
      const targetRgb = item.rgb;

      // Tìm màu khớp nhất trong danh sách hiện tại
      const closestMatch = findClosestColor(targetRgb, existingColors);

      // Tạo object kết quả
      const colorResult = {
        maChi: maChi,
        rgb: targetRgb,
        closestMatch: closestMatch,
        isExactMatch: closestMatch && closestMatch.distance === 0
      };

      processedColors.push({
        maChi: maChi,
        rgb: targetRgb
      });

      matchResults.push(colorResult);

      // Log kết quả tìm kiếm
      if (closestMatch) {
        console.log(`🎯  ${maChi} (${targetRgb}--- ${closestMatch.maChi} (${closestMatch.rgb}))`);
        console.log(`   → Distance: ${closestMatch.distance.toFixed(2)}--${closestMatch.similarity}%--${colorResult.isExactMatch ? '✅' : '❌'}`);

      }
    });


    // Thống kê kết quả
    const exactMatches = matchResults.filter(r => r.isExactMatch).length;
    const closeMatches = matchResults.filter(r => !r.isExactMatch && r.closestMatch && r.closestMatch.distance < 5).length;
    const noMatches = matchResults.filter(r => !r.closestMatch || r.closestMatch.distance >= 5).length;

    console.log(`📊 THỐNG KÊ KẾT QUẢ:`);
    console.log(`   ✅ Exact matches: ${exactMatches}`);
    console.log(`   🎯 Close matches (<5): ${closeMatches}`);
    console.log(`   ❌ No good matches: ${noMatches}`);
    console.log(`   📋 Total processed: ${processedColors.length}`);

    res.json({
      message: 'Tìm màu khớp thành công (không ghi đè file)',
      total: processedColors.length,
      colors: processedColors,
      matchResults: matchResults,
      statistics: {
        exactMatches: exactMatches,
        closeMatches: closeMatches,
        noMatches: noMatches,
        total: processedColors.length
      },
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật danh sách màu:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật danh sách màu',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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

// Khởi động server
app.listen(PORT, () => {
  console.log(`📱 Truy cập: http://localhost:${PORT}`);

  // Kiểm tra file danh sách màu
  const colorList = readColorList();
  console.log(`📋 Đã load ${colorList.length} mã màu từ danhsach_tenchi.txt`);

  // Khởi động file watcher
  statusWatcher = watchStatusFile();
});

// Xử lý lỗi
process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt server...');
  stopWatching(statusWatcher);
  process.exit(0);
}); 