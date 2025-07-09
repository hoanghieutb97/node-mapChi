# Node.js Server - Cổng 1001

Ứng dụng Node.js đơn giản sử dụng Express framework chạy trên cổng 1001 với tính năng quản lý danh sách màu.

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

### Chế độ production
```bash
npm start
```

### Chế độ development (với nodemon)
```bash
npm run dev
```

## API Endpoints

### Cơ bản
- `GET /` - Trang chủ với thông tin server
- `GET /api/status` - Kiểm tra trạng thái server
- `POST /api/data` - Gửi dữ liệu (JSON với field `message`)

### Quản lý màu (từ file danhsach_tenchi.txt)
- `GET /api/colors` - Lấy tất cả danh sách màu
- `GET /api/colors/:maChi` - Tìm màu theo mã chi (ví dụ: T415)
- `GET /api/colors/search/:keyword` - Tìm kiếm màu theo từ khóa

## Truy cập

- Server: http://localhost:1001
- API Status: http://localhost:1001/api/status
- Danh sách màu: http://localhost:1001/api/colors

## Ví dụ sử dụng API

### Lấy tất cả màu
```bash
curl http://localhost:1001/api/colors
```

### Tìm màu theo mã chi
```bash
curl http://localhost:1001/api/colors/T415
```

### Tìm kiếm màu
```bash
curl http://localhost:1001/api/colors/search/Y22
```

### Gửi dữ liệu
```bash
curl -X POST http://localhost:1001/api/data \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào!"}'
```

## Cấu trúc dữ liệu màu

Mỗi màu có format:
```json
{
  "maChi": "T415",
  "rgb": "255,255,255"
}
```

Trong đó:
- **maChi**: Mã cuộn chỉ
- **rgb**: Giá trị màu RGB (R,G,B) 