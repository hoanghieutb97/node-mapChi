import pdfplumber
import os
import re
import json

# Bảng màu tham chiếu
colors = [
    { "name": "Dark Green", "rgb": [0, 153, 0] },
    { "name": "Blue", "rgb": [0, 0, 255] },
    { "name": "Red", "rgb": [255, 0, 0] },
    { "name": "Yellow", "rgb": [255, 255, 0] },
    { "name": "Aqua", "rgb": [51, 204, 204] },
    { "name": "Dark Magenta", "rgb": [192, 0, 192] },
    { "name": "Green", "rgb": [0, 255, 0] },
    { "name": "Black", "rgb": [0, 0, 0] },
    { "name": "White", "rgb": [255, 255, 255] },
    { "name": "Dark Blue", "rgb": [0, 0, 153] },
    { "name": "Dark Red", "rgb": [153, 0, 0] },
    { "name": "Orange", "rgb": [255, 153, 51] },
    { "name": "Purple", "rgb": [153, 0, 204] },
    { "name": "Brown", "rgb": [153, 102, 51] },
    { "name": "Pink", "rgb": [255, 126, 204] },
    { "name": "Sand", "rgb": [255, 204, 126] },
    { "name": "Turquoise", "rgb": [102, 255, 204] },
    { "name": "Grey", "rgb": [102, 102, 102] },
    { "name": "Khaki", "rgb": [153, 153, 102] },
    { "name": "Powder Blue", "rgb": [126, 126, 255] },
    { "name": "Cyan", "rgb": [0, 255, 255] },
    { "name": "Magenta", "rgb": [255, 0, 255] }
]

def get_rgb_from_name(name_line):
    for color in colors:
        if color["name"].lower() in name_line.lower():
            return color["rgb"]
    return None

# Lấy desktop path
desktop = os.path.join(os.path.expanduser("~"), "Desktop")
pdf_path = os.path.join(desktop, "serverEMB", "fileEMB", "file.pdf")

if not os.path.exists(pdf_path):
    print("❌ Không tìm thấy file PDF:", pdf_path)
    exit()

with pdfplumber.open(pdf_path) as pdf:
    stop_page = None
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text and "Stop Sequence:" in text:
            stop_page = i
            break

if stop_page is None:
    print("❌ Không tìm thấy Stop Sequence trong PDF")
    exit()

lines = pdf.pages[stop_page].extract_text().split("\n")

data = []
start = False
pattern = re.compile(r"^(\d+)\.\s+(\d+)\s+([\d,]+)(?:\s+R(\d+)\s+G(\d+)\s+B(\d+))?")

for line in lines:
    if "Stop Sequence:" in line:
        start = True
        continue
    if start:
        if line.strip() == "" or "Production Worksheet" in line or line.startswith("Authors:"):
            break
        match = pattern.match(line.strip())
        if match:
            stop = int(match.group(1))
            soCuonChi = int(match.group(2))
            length = match.group(3)
            if match.group(4):
                rgb = [int(match.group(4)), int(match.group(5)), int(match.group(6))]
            else:
                rgb = get_rgb_from_name(line)
            data.append({
                "stop": stop,
                "soCuonChi": soCuonChi,
                "length": length,
                "RGB": rgb
            })

# In ra JSON
print(json.dumps(data, indent=2, ensure_ascii=False))





# import pdfplumber

# pdf_path = "Design3 Print.pdf"

# with pdfplumber.open(pdf_path) as pdf:
#     stop_page = None
#     for i, page in enumerate(pdf.pages):
#         text = page.extract_text()
#         if text and "Stop Sequence:" in text:
#             stop_page = i
#             break

# if stop_page is None:
#     print("❌ Không tìm thấy Stop Sequence trong PDF")
#     exit()

# # Lấy nội dung Stop Sequence
# lines = pdf.pages[stop_page].extract_text().split("\n")

# stop_lines = []
# start = False
# for line in lines:
#     if "Stop Sequence:" in line:
#         start = True
#         continue
#     if start:
#         if line.strip() == "" or "Production Worksheet" in line:
#             break
#         stop_lines.append(line.strip())

# # Ghi ra file .txt
# with open("stop_sequence.txt", "w", encoding="utf-8") as f:
#     for line in stop_lines:
#         f.write(line + "\n")

# print("✅ Đã xuất file stop_sequence.txt từ trang", stop_page + 1)
