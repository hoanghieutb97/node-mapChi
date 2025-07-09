// Array màu dạng object (đã loại bỏ trùng lặp):
const colors = [
  { name: "Dark Green", rgb: [0, 153, 0] },
  { name: "Blue", rgb: [0, 0, 255] },
  { name: "Red", rgb: [255, 0, 0] },
  { name: "Yellow", rgb: [255, 255, 0] },
  { name: "Aqua", rgb: [51, 204, 204] },
  { name: "Dark Magenta", rgb: [192, 0, 192] },
  { name: "Green", rgb: [0, 255, 0] },
  { name: "Black", rgb: [0, 0, 0] },
  { name: "White", rgb: [255, 255, 255] },
  { name: "Dark Blue", rgb: [0, 0, 153] },
  { name: "Dark Red", rgb: [153, 0, 0] },
  { name: "Orange", rgb: [255, 153, 51] },
  { name: "Purple", rgb: [153, 0, 204] },
  { name: "Brown", rgb: [153, 102, 51] },
  { name: "Pink", rgb: [255, 126, 204] },
  { name: "Sand", rgb: [255, 204, 126] },
  { name: "Turquoise", rgb: [102, 255, 204] },
  { name: "Grey", rgb: [102, 102, 102] },
  { name: "Khaki", rgb: [153, 153, 102] },
  { name: "Powder Blue", rgb: [126, 126, 255] },
  { name: "Cyan", rgb: [0, 255, 255] },
  { name: "Magenta", rgb: [255, 0, 255] }
];

// Export để sử dụng
module.exports = colors;

// Array đơn giản (đã loại bỏ trùng lặp):
const simpleColors = [
  ["Dark Green", 0, 153, 0],
  ["Blue", 0, 0, 255],
  ["Red", 255, 0, 0],
  ["Yellow", 255, 255, 0],
  ["Aqua", 51, 204, 204],
  ["Dark Magenta", 192, 0, 192],
  ["Green", 0, 255, 0],
  ["Black", 0, 0, 0],
  ["White", 255, 255, 255],
  ["Dark Blue", 0, 0, 153],
  ["Dark Red", 153, 0, 0],
  ["Orange", 255, 153, 51],
  ["Purple", 153, 0, 204],
  ["Brown", 153, 102, 51],
  ["Pink", 255, 126, 204],
  ["Sand", 255, 204, 126],
  ["Turquoise", 102, 255, 204],
  ["Grey", 102, 102, 102],
  ["Khaki", 153, 153, 102],
  ["Powder Blue", 126, 126, 255],
  ["Cyan", 0, 255, 255],
  ["Magenta", 255, 0, 255]
];

console.log("Array màu dạng object:");
console.log(colors);

console.log("\nArray màu dạng đơn giản:");
console.log(simpleColors);
