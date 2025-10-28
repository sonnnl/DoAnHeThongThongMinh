# 🚀 Hướng Dẫn Tích Hợp AI - Toxic Detection

## 📋 Tổng Quan

Đã tích hợp model **Toxic Detection v2** từ folder `ai/toxics/v2/` vào hệ thống forum. Model này phát hiện nội dung độc hại, spam, hate speech trong tiếng Việt.

## ✅ Đã Hoàn Thành

### 1. Backend Python (AI Service)

**File:** `ai/api.py`

- Flask API server chạy port 6000
- Load ONNX model từ `ai/toxics/v2/model.onnx`
- Load tokenizer từ `ai/toxics/v2/tokenizer.json`
- Endpoint: `/api/ai/analyze` - Phân tích một text
- Endpoint: `/api/ai/analyze/batch` - Phân tích nhiều texts
- Endpoint: `/api/ai/health` - Health check

**Dependencies:** `ai/requirements.txt`

```txt
flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
onnxruntime==1.18.0
tokenizers==0.15.0
numpy==1.26.2
```

### 2. Backend Node.js (Forum Backend)

**File:** `web/backend/utils/aiClient.js`

- HTTP client gọi AI service
- Handle timeout (5 giây) và errors
- Graceful fallback nếu AI service down

**File:** `web/backend/middleware/aiAnalysis.js`

- Middleware tự động phân tích content
- Attach kết quả vào `req.aiAnalysis`
- Không block request nếu AI lỗi

**Model Schema Updates:**

- `web/backend/models/Post.js` - Thêm field `toxicType` vào `aiAnalysis`
- `web/backend/models/Comment.js` - Thêm field `toxicType` vào `aiAnalysis`

**Controller Updates:**

- `web/backend/controllers/postController.js` - Lưu AI analysis khi tạo post
- `web/backend/controllers/commentController.js` - Lưu AI analysis khi tạo comment

**Routes Updates:**

- `web/backend/routes/postRoutes.js` - Thêm `aiAnalysis` middleware vào POST route
- `web/backend/routes/commentRoutes.js` - Thêm `aiAnalysis` middleware vào POST route

## 🎯 Cách Sử Dụng

### 1. Setup AI Service

**Bước 1: Cài đặt Python dependencies**

```bash
cd ai
pip install -r requirements.txt
```

**Bước 2: Kiểm tra model files**

Đảm bảo các file sau tồn tại:

- `ai/toxics/v2/model.onnx`
- `ai/toxics/v2/tokenizer.json`

**Bước 3: Chạy AI Service**

```bash
cd ai
python api.py
```

AI Service sẽ chạy tại: `http://localhost:6000`

**Kiểm tra health:**

```bash
curl http://localhost:6000/api/ai/health
```

### 2. Setup Backend Node.js

**Bước 1: Thêm environment variable (optional)**

Trong `.env`:

```env
AI_SERVICE_URL=http://localhost:6000
```

Nếu không set, mặc định là `http://localhost:6000`

**Bước 2: Chạy backend**

```bash
cd web/backend
npm start
```

### 3. Test AI Integration

**Test tạo post với AI:**

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test post",
    "content": "Nội dung test để xem AI có hoạt động không",
    "category": "CATEGORY_ID"
  }'
```

**Xem kết quả AI trong response:**

```json
{
  "success": true,
  "data": {
    "title": "Test post",
    "content": "...",
    "aiAnalysis": {
      "isToxic": false,
      "toxicScore": 0.1234,
      "toxicType": "clean",
      "emotion": "neutral",
      "emotionScore": 0.0,
      "analyzedAt": "2025-01-27T..."
    }
  }
}
```

## 🔧 Kết Quả AI

### Toxic Detection Labels

Model sẽ phân loại nội dung thành các loại:

- **clean**: Nội dung sạch, không độc hại
- **individual**: Tấn công cá nhân
- **groups**: Tấn công nhóm
- **religion/creed**: Tấn công tôn giáo/tín ngưỡng
- **race/ethnicity**: Phân biệt dân tộc
- **politics**: Tấn công chính trị

### Database Schema

**Post/Comment có field `aiAnalysis`:**

```javascript
{
  isToxic: Boolean,
  toxicScore: Number (0-1),
  toxicType: String,
  emotion: String,
  emotionScore: Number (0-1),
  analyzedAt: Date
}
```

## ⚠️ Lưu Ý

1. **Graceful Fallback**: Nếu AI service down, hệ thống vẫn hoạt động bình thường, chỉ không có phân tích AI.

2. **Timeout**: AI request timeout sau 5 giây. Nếu quá thời gian, hệ thống sẽ skip AI analysis.

3. **Tốc Độ**: AI analysis mất khoảng 50-100ms. Không block user experience.

4. **Model Files**: Đảm bảo file `model.onnx` và `tokenizer.json` tồn tại trong `ai/toxorst/v2/`.

## 🐛 Troubleshooting

### AI Service không khởi động

```
❌ Error loading models: ...
```

**Nguyên nhân**: File model không tìm thấy.

**Giải pháp**: Kiểm tra các file sau tồn tại:

- `ai/toxics/v2/model.onnx`
- `ai/toxics/v2/tokenizer.json`

### Connection refused

```
⚠️  AI Service is not running (connection refused)
```

**Giải pháp**: Start AI service:

```bash
cd ai && python api.py
```

### Module not found

```
ModuleNotFoundError: No module named 'flask'
```

**Giải pháp**: Cài đặt dependencies:

```bash
cd ai && pip install -r requirements.txt
```

## 📝 TODO

- [ ] Thêm emotion detection model
- [ ] Tích hợp với frontend để hiển thị cảnh báo toxic
- [ ] Auto-reject posts nếu toxic score > 0.9
- [ ] Dashboard admin để xem AI stats
- [ ] Fine-tune model với data từ forum
