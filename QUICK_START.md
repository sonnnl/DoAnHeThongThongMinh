# Quick Start Guide

Hướng dẫn nhanh để chạy dự án trên máy local.

## 📋 Yêu Cầu

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local hoặc MongoDB Atlas)
- **Python** >= 3.9
- **npm** hoặc **yarn**
- **Git**

## 🚀 Bước 1: Clone Project

```bash
git clone <repository-url>
cd DoAnHTTM
```

## 🗄️ Bước 2: Setup MongoDB

### Option A: MongoDB Local

1. Cài đặt MongoDB Community Edition
2. Chạy MongoDB:
   ```bash
   mongod
   ```

### Option B: MongoDB Atlas (Cloud)

1. Tạo tài khoản tại https://www.mongodb.com/atlas
2. Tạo cluster miễn phí
3. Lấy connection string

## 🔧 Bước 3: Setup Backend

```bash
cd web/backend
npm install
```

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Điền thông tin vào `.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/forum
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forum

# JWT (tạo random string dài)
JWT_SECRET=your_very_long_random_string_here
JWT_EXPIRE=7d

# Cloudinary (đăng ký tại https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_API_KEY=your_ai_api_key
```

Chạy backend:

```bash
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

## 🎨 Bước 4: Setup Frontend (TODO)

```bash
cd web/frontend
npm install
```

Tạo file `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## 🤖 Bước 5: Setup AI Service

### Cài đặt Python dependencies

```bash
cd ai
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Tạo file `.env`

```bash
cp .env.example .env
```

Điền thông tin:

```env
AI_SERVICE_PORT=8000
AI_API_KEY=your_secure_api_key_here

# Model paths (sẽ train sau)
TOXIC_MODEL_PATH=./toxic_detection/checkpoints/best_model.pt
EMOTION_MODEL_PATH=./emotions/checkpoints/best_model.pt

DEVICE=cpu
```

### Chạy AI service

```bash
python api.py
```

AI service sẽ chạy tại: http://localhost:8000

**Lưu ý:** Ban đầu chưa có trained models nên API sẽ báo lỗi. Cần train models trước (xem phần Training Models).

## ✅ Kiểm Tra

### Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Kết quả mong đợi:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Frontend

Mở browser tại http://localhost:3000

### Test AI Service

```bash
# Health check
curl http://localhost:8000/health

# Kết quả mong đợi:
{
  "status": "healthy",
  "device": "cpu",
  "models_loaded": {
    "toxic_detection": false,
    "emotion_detection": false
  }
}
```

## 📊 Bước 6: Seed Database (Optional)

Tạo admin user và sample data:

```bash
cd web/backend
node scripts/seed.js
```

Default admin credentials:

- Email: admin@forum.com
- Password: Admin123!

## 🧪 Training AI Models (Optional - Nâng Cao)

### Train Toxic Detection Model

```bash
cd ai/toxic_detection

# Download ViTHSD dataset
# https://github.com/bakansm/ViTHSD
# Đặt vào thư mục dataset/

# Train
python train.py --epochs 10 --batch-size 32
```

### Train Emotion Detection Model

```bash
cd ai/emotions

# Dataset đã có sẵn trong dataset/

# Train
python train.py --epochs 10 --batch-size 32
```

**Lưu ý:** Training cần GPU để nhanh. Nếu không có GPU, có thể:

1. Dùng Google Colab (miễn phí)
2. Tăng thời gian training trên CPU
3. Download pre-trained models (nếu có)

## 🐛 Troubleshooting

### Backend không kết nối được MongoDB

```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Kiểm tra connection string trong .env
# Đảm bảo không có khoảng trắng thừa
```

### Port đã được sử dụng

```bash
# Thay đổi port trong .env
PORT=5001

# Frontend
VITE_PORT=3001
```

### AI Service báo lỗi models not found

- Bình thường ban đầu chưa có trained models
- API vẫn chạy được nhưng predict endpoints sẽ báo 503
- Cần train models hoặc để null để skip AI features trong development

### Cannot find module

```bash
# Backend
cd web/backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd web/frontend
rm -rf node_modules package-lock.json
npm install

# AI
cd ai
pip install -r requirements.txt --force-reinstall
```

## 📝 Next Steps

Sau khi setup xong, bạn có thể:

1. **Implement Controllers:**

   - Tạo các controller files trong `web/backend/controllers/`
   - Xem `web/backend/routes/` để biết API endpoints cần implement

2. **Build Frontend:**

   - Tạo components trong `web/frontend/src/components/`
   - Tạo pages trong `web/frontend/src/pages/`
   - Implement API services trong `web/frontend/src/services/`

3. **Train AI Models:**

   - Download datasets
   - Train toxic detection model
   - Train emotion detection model
   - Test predictions

4. **Testing:**
   - Write unit tests
   - Write integration tests
   - Manual testing

## 📚 Documentation

- [README.md](./README.md) - Tổng quan dự án
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Thiết kế database
- [STRUCTURE.md](./STRUCTURE.md) - Cấu trúc thư mục
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API documentation

## 🆘 Cần Giúp Đỡ?

- Đọc documentation
- Check issues on GitHub
- Ask on Discord/Slack

---

**Chúc bạn code vui vẻ! 🚀**
