const fs = require('fs');
const path = require('path');
const listDonService = require('../src/services/mongo/listDonService');
const { processEMBFile } = require('./embProcessor');
const fsPromises = require('fs').promises;
const os = require('os');

/**
 * Chuyển đổi RGB sang Lab (sRGB D65)
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Array} - Lab values [L, a, b]
 */
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

/**
 * Tính CIEDE2000 (chuẩn CIE)
 * @param {Array} lab1 - Lab values thứ nhất [L, a, b]
 * @param {Array} lab2 - Lab values thứ hai [L, a, b]
 * @returns {number} - Delta E 2000
 */
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

/**
 * Đọc danh sách màu từ file danhsach_tenchi.txt
 * @returns {Array} - Danh sách màu với format {maCuonChi, rgb}
 */
function readColorList() {
  try {
    const filePath = path.join(__dirname, '..', 'danhsach_tenchi.txt');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const colorList = [];

    lines.forEach(line => {
      const parts = line.split(' - ');
      if (parts.length === 2) {
        const maCuonChi = parts[0].trim();
        const rgbString = parts[1].trim();
        const rgb = rgbString.split(',').map(Number);

        if (rgb.length === 3) {
          colorList.push({
            maCuonChi: maCuonChi,
            rgb: rgb
          });
        }
      }
    });

    console.log(`📋 Đã load ${colorList.length} mã cuộn chỉ từ danhsach_tenchi.txt`);
    return colorList;
  } catch (error) {
    console.error('❌ Lỗi đọc file danhsach_tenchi.txt:', error.message);
    return [];
  }
}

/**
 * Tìm màu khớp nhất sử dụng Delta E 2000
 * @param {Array} targetRgb - Màu RGB cần tìm [r, g, b]
 * @param {Array} colorList - Danh sách màu để tìm kiếm
 * @returns {Object|null} - Màu khớp nhất hoặc null
 */
function findClosestColor(targetRgb, colorList) {
  if (!colorList || colorList.length === 0) {
    return null;
  }

  let closestColor = null;
  let minDistance = Infinity;

  colorList.forEach(color => {
    const lab1 = rgbToLab(...targetRgb);
    const lab2 = rgbToLab(...color.rgb);
    const distance = calculateCIEDE2000(lab1, lab2);

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = {
        maCuonChi: color.maCuonChi,
        rgb: color.rgb,
        deltaE: distance
      };
    }
  });

  return closestColor;
}

/**
 * Xử lý tìm màu khớp cho danh sách màu
 * @param {Array} payload - Danh sách màu cần xử lý
 * @returns {Object} - Kết quả xử lý
 */
async function processColorMatching(payload) {
  try {
    // Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(payload)) {
      throw new Error('Dữ liệu phải là một mảng');
    }

    // Đọc danh sách màu hiện tại
    const existingColors = readColorList();

    if (existingColors.length === 0) {
      throw new Error('Không thể đọc danh sách màu từ file danhsach_tenchi.txt');
    }

    // Xử lý từng màu trong payload
    const processedItems = [];

    payload.forEach((item, index) => {
      if (!item.RGB || !Array.isArray(item.RGB) || item.RGB.length !== 3) {
        throw new Error(`Dữ liệu RGB không hợp lệ tại item ${index}: ${JSON.stringify(item)}`);
      }

      // Tìm màu khớp nhất trong danh sách hiện tại
      const closestMatch = findClosestColor(item.RGB, existingColors);

      // Tạo object kết quả với maCuonChi được thêm vào
      const processedItem = {
        ...item,
        maCuonChi: closestMatch ? closestMatch.maCuonChi : null,
        deltaE: closestMatch ? closestMatch.deltaE : null
      };

      processedItems.push(processedItem);

      // Log kết quả tìm kiếm
      if (closestMatch) {
      } else {
        console.log(`❌ Stop ${item.stop} (${item.RGB}) --- Không tìm thấy màu khớp`);
      }
    });


    console.log(processedItems);
    global.itemsXuLyEMB[0].SlBuocChi = processedItems;

    // Copy file.sdt và file.pdf sang networkPath của item đầu tiên
    const currentUser = os.userInfo().username || process.env.USERNAME || process.env.USER || 'admin';
    const srcDir = path.join('C:', 'Users', currentUser, 'Desktop', 'serverEMB', 'fileEMB');


    const destDir = global.itemsXuLyEMB[0]?.networkPath;
    const filesToCopy = ['file.dst', 'file.pdf'];
    if (destDir) {
      try {
        await fsPromises.mkdir(destDir, { recursive: true });
        for (const file of filesToCopy) {
          const src = path.join(srcDir, file);
          const dest = path.join(destDir, file);
          await fsPromises.copyFile(src, dest);
          console.log(`✅ Đã copy ${file} sang ${destDir}`);
        }
      } catch (err) {
        console.error('❌ Lỗi copy file:', err);
      }
    }

    const result = await listDonService.findById(global.itemsXuLyEMB[0]._id);
    let { _id, ...updateData } = result.data;

    updateData.items = updateData.items.map(itemx => {
      if (itemx.positionTheu === global.itemsXuLyEMB[0].items.positionTheu) return { ...itemx, stopLess: processedItems }
      return itemx
    })



    let fetchMaCHi = await listDonService.updateById(_id, updateData);
    

    let itemxoa = global.itemsXuLyEMB.shift();

    if (global.itemsXuLyEMB[0])
      await processEMBFile(global.itemsXuLyEMB[0].networkPath)




    let stopLess = processedItems.map(item => ({
      stop: item.stop,
      maCuonChi: item.maCuonChi,
      rgb: item.RGB,
    }))

    // Tạo mảng listCuonChi chứa các maCuonChi duy nhất từ stopLess
    let listCuonChi = [...new Set(stopLess.map(item => item.maCuonChi).filter(maCuonChi => maCuonChi !== null))];

    return {
      stopLess: stopLess,
      listCuonChi: listCuonChi
    };

  } catch (error) {
    console.error('❌ Lỗi khi xử lý tìm màu khớp:', error);
    throw error;
  }
}

module.exports = {
  processColorMatching
};
