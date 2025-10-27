# Forum - Hệ thống thảo luận thông minh

Đồ án môn học **Hệ thống thông minh** - Forum thảo luận tương tự VOZ/Reddit với tích hợp AI.

## 🎯 Tổng quan

Dự án xây dựng một nền tảng forum thảo luận với các tính năng:

- 🔐 **Đăng nhập Google OAuth** (chỉ Google, không có email/password)
- 💬 Đăng bài, bình luận với hệ thống vote (upvote/downvote)
- 👥 User profile với badge system (Newbie, Chuyên gia, Xem chùa, ...)
- 📁 Quản lý categories
- 🤖 **AI Integration**: Phát hiện toxic content, phân tích cảm xúc
- 📊 Report system cho vi phạm
- 💌 Direct messaging
- 🔔 Real-time notifications
- 🌓 Dark/Light mode

> **Lưu ý đặc biệt:** Dự án này CHỈ hỗ trợ đăng nhập bằng Google OAuth để đơn giản hóa authentication và tập trung vào các tính năng AI.

## 🛠️ Tech Stack

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- **Google OAuth 2.0** (authentication only)
- Cloudinary (upload ảnh/video)

### Frontend

- React 18 + Vite
- TailwindCSS + DaisyUI
- Zustand (state management)
- React Query (data fetching)
- Axios

### AI/ML

- Python + TensorFlow
- Toxic content detection
- Emotion detection (6 emotions: joy, sadness, anger, fear, surprise, neutral)

## 📦 Cài đặt

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Python 3.8+ (cho AI)

### Backend Setup

```bash
cd web/backend
npm install

# Tạo .env file (xem SETUP_GUIDE.md)
# Cấu hình MongoDB, JWT, Cloudinary

npm run dev
```

### Frontend Setup

```bash
cd web/frontend
npm install

# Tạo .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

npm run dev
```

### AI Setup

```bash
cd ai
# Xem AI_TRAINING_GUIDE.md để hướng dẫn train models
```

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Hướng dẫn cài đặt chi tiết
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoints
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md) - Thiết kế database
- [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) - Kiến trúc AI models
- [PHAN_TICH_THIET_KE_HE_THONG.md](PHAN_TICH_THIET_KE_HE_THONG.md) - Phân tích hệ thống

## 🚀 Features

### ✅ Đã hoàn thành

- [x] Authentication (JWT, Google OAuth placeholder)
- [x] User management với badge system
- [x] Post CRUD với vote system
- [x] Comment system với replies
- [x] Category management
- [x] Report system
- [x] Direct messaging
- [x] Notification system
- [x] File upload (Cloudinary)
- [x] Responsive UI với dark mode
- [x] Backend API đầy đủ (10 routes, 10 controllers)

### 🔄 Đang phát triển

- [ ] Post Detail Page hoàn chỉnh
- [ ] Create/Edit Post với markdown editor
- [ ] Comment component với emotion display
- [ ] Profile page hoàn chỉnh
- [ ] Search functionality
- [ ] Real-time notifications (Socket.io)

### 📋 Kế hoạch

- [ ] AI toxic detection integration
- [ ] AI emotion detection integration
- [ ] Admin dashboard
- [ ] Analytics & statistics
- [ ] Mobile responsive optimization
- [ ] SEO optimization

## 🤖 Tính năng AI

### 1. Toxic Content Detection

- Dataset: `ai/toxics/dataset/` (train.csv, dev.csv, test.csv)
- Phát hiện: spam, hate speech, harassment, violence
- Tự động warning user khi post/comment có nội dung toxic

### 2. Emotion Detection

- Dataset: `ai/emotions/dataset/` (train, valid, test)
- 6 emotions: joy, sadness, anger, fear, surprise, neutral
- Hiển thị emotion indicator trong comments
- Gợi ý user khi có cảm xúc tiêu cực

## 📁 Structure

```
DoAnHTTM/
├── ai/                    # AI models & datasets
│   ├── emotions/          # Emotion detection
│   └── toxics/            # Toxic detection
├── web/
│   ├── backend/           # Node.js backend ✅
│   │   ├── controllers/   # 10 controllers
│   │   ├── models/        # 9+ models
│   │   ├── routes/        # 10 routes
│   │   └── middleware/    # Auth, validation
│   └── frontend/          # React frontend ✅
│       └── src/
│           ├── components/ # Layout, Navbar, Sidebar
│           ├── pages/     # All pages
│           ├── services/  # 10 API services
│           └── store/     # Zustand stores
└── *.md                   # Documentation
```

## 🎓 Đồ án môn học

**Môn:** Hệ thống thông minh  
**Mục tiêu:** Xây dựng forum với tích hợp AI để:

- Tự động phát hiện và xử lý nội dung độc hại
- Phân tích cảm xúc người dùng
- Cải thiện trải nghiệm và an toàn cộng đồng

## 🚦 Quick Start

```bash
# 1. Clone repo
git clone <repo-url>
cd DoAnHTTM

# 2. Backend
cd web/backend
npm install
# Tạo .env với MongoDB, JWT, Cloudinary
npm run dev  # http://localhost:5000

# 3. Frontend (terminal mới)
cd web/frontend
npm install
# Tạo .env với VITE_API_URL
npm run dev  # http://localhost:3000
```

## 📝 License

MIT License - Đồ án môn học

---

**Note:** Xem [SETUP_GUIDE.md](SETUP_GUIDE.md) để hướng dẫn chi tiết về cài đặt và phát triển tiếp.
