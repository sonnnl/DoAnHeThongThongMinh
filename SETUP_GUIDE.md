# HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

## Tổng quan dự án đã hoàn thành

Dự án Forum (VOZ/Reddit clone) với kiến trúc MERN stack đã được code xong phần web cơ bản, bao gồm:

### Backend (Node.js + Express + MongoDB)

✅ **Models** (9 models):

- User, Post, Comment, Category, Vote, Report, Notification, DirectMessage, Conversation, SavedPost, UserFollow, CategoryFollow, AdminLog

✅ **Controllers** (9 controllers):

- authController, userController, postController, commentController, categoryController, voteController, reportController, notificationController, messageController, uploadController

✅ **Routes** (10 routes):

- authRoutes, userRoutes, postRoutes, commentRoutes, categoryRoutes, voteRoutes, reportRoutes, uploadRoutes, notificationRoutes, messageRoutes

✅ **Middleware**:

- Authentication & Authorization
- Validation (express-validator)

✅ **Features**:

- JWT Authentication
- Google OAuth (placeholder)
- User roles (admin, moderator, user)
- User badge system (Newbie, Chuyên gia, Người từng trải, Xem chùa, ...)
- Upvote/Downvote system
- Comment system với replies
- Report system
- Direct messaging
- Notification system
- File upload (Cloudinary)
- Rate limiting
- Security (helmet, CORS, sanitization)

### Frontend (React + Vite + TailwindCSS + DaisyUI)

✅ **Setup**:

- Vite configuration
- TailwindCSS + DaisyUI
- React Router v6
- Zustand state management
- React Query for data fetching
- React Hot Toast for notifications
- Axios với interceptors

✅ **API Services** (10 services):

- auth, posts, comments, users, categories, votes, notifications, messages, upload, reports

✅ **Store**:

- authStore (Zustand)
- themeStore (dark/light mode)

✅ **Components**:

- Layout (MainLayout, AuthLayout)
- Navbar với search, notifications, messages
- Sidebar
- PostCard
- Loading

✅ **Pages** (placeholder cho tất cả routes):

- Home, Login, Register, PostDetail, CreatePost, EditPost, Profile, Settings, Category, Categories, Messages, Notifications, Search, NotFound

✅ **Utils & Hooks**:

- Helper functions (formatDate, timeAgo, badge helpers, emotion helpers, ...)
- useDebounce, useIntersectionObserver

---

## CÀI ĐẶT

### 1. Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x (hoặc MongoDB Atlas)
- Cloudinary account (cho upload ảnh)

### 2. Backend Setup

```bash
cd web/backend

# Install dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn:
# - MONGODB_URI
# - JWT_SECRET và JWT_REFRESH_SECRET
# - CLOUDINARY credentials
# - Các config khác
```

**File .env mẫu cho backend:**

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/forum

JWT_SECRET=your_jwt_secret_change_this
JWT_REFRESH_SECRET=your_refresh_secret_change_this

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```bash
# Chạy backend
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

### 3. Frontend Setup

```bash
cd web/frontend

# Install dependencies
npm install

# Tạo file .env
# Nội dung:
# VITE_API_URL=http://localhost:5000/api

# Chạy frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

---

## CHỨC NĂNG ĐÃ HOÀN THÀNH

### Backend API Endpoints

- ✅ Authentication: `/api/auth/*` (register, login, logout, refresh token, forgot password, verify email)
- ✅ Users: `/api/users/*` (profile, follow/unfollow, update, search)
- ✅ Posts: `/api/posts/*` (CRUD, vote, save, search, trending)
- ✅ Comments: `/api/comments/*` (CRUD, replies)
- ✅ Categories: `/api/categories/*` (CRUD, follow)
- ✅ Votes: `/api/votes/*` (upvote/downvote)
- ✅ Reports: `/api/reports/*` (create, review - admin/moderator)
- ✅ Notifications: `/api/notifications/*`
- ✅ Messages: `/api/messages/*` (direct messaging)
- ✅ Upload: `/api/upload/*` (Cloudinary integration)

### Frontend Features

- ✅ Responsive UI với TailwindCSS + DaisyUI
- ✅ Dark/Light mode
- ✅ Authentication (Login/Register)
- ✅ Home page với post listing
- ✅ Navbar với search, notifications, messages
- ✅ Sidebar với navigation
- ✅ API integration với React Query
- ✅ State management với Zustand
- ✅ Protected routes

---

## CHỨC NĂNG CẦN PHÁT TRIỂN THÊM

### Frontend (Priority)

1. **Post Detail Page**: Hiển thị chi tiết bài viết + comments
2. **Create/Edit Post**: Form tạo và chỉnh sửa bài viết với markdown editor
3. **Profile Page**: Hiển thị thông tin user, posts, comments, stats
4. **Category Pages**: Danh sách categories và posts theo category
5. **Search Page**: Tìm kiếm posts, users với filters
6. **Comment Component**: Comment list, reply, edit, delete với vote buttons
7. **Vote Component**: Upvote/downvote buttons with animations
8. **Notifications Page**: Danh sách notifications với mark as read
9. **Messages Page**: Chat UI với conversation list và message thread
10. **Settings Page**: Cài đặt profile, password, preferences
11. **Admin Dashboard**: Quản lý users, posts, categories, reports

### AI Integration

1. **Toxic Comment Detection**:

   - Train model với dataset từ `ai/toxics/dataset/`
   - Tích hợp vào comment/post creation
   - Hiển thị warning cho user

2. **Emotion Detection**:

   - Train model với dataset từ `ai/emotions/dataset/`
   - Phân tích cảm xúc trong comments
   - Hiển thị emotion indicator và background color
   - Gợi ý cho user nếu comment có cảm xúc tiêu cực

3. **Content Classification**:
   - Auto-categorize posts
   - Spam detection
   - NSFW content detection

### Additional Features

1. **Real-time Updates**: Socket.io cho notifications, messages
2. **Email Service**: NodeMailer cho email verification, password reset
3. **Image Optimization**: Compress và resize images trước khi upload
4. **SEO**: Meta tags, Open Graph, sitemap
5. **Analytics**: Track views, engagement
6. **Moderation Tools**: Admin panel cho reports, user management
7. **Badges & Achievements**: Auto-update user badges based on activity
8. **Tags System**: Tags cho posts với autocomplete
9. **Infinite Scroll**: Load more posts/comments automatically
10. **Mobile App**: React Native app

---

## STRUCTURE

```
DoAnHTTM/
├── ai/                          # AI/ML models
│   ├── emotions/                # Emotion detection dataset
│   └── toxics/                  # Toxic content detection dataset
├── web/
│   ├── backend/                 # Node.js + Express backend
│   │   ├── config/              # Database, cloudinary config
│   │   ├── controllers/         # ✅ 9 controllers (DONE)
│   │   ├── middleware/          # ✅ Auth, validation (DONE)
│   │   ├── models/              # ✅ 9 models (DONE)
│   │   ├── routes/              # ✅ 10 routes (DONE)
│   │   ├── utils/               # Helper functions
│   │   ├── package.json
│   │   └── server.js            # ✅ Entry point (DONE)
│   └── frontend/                # React + Vite frontend
│       ├── public/
│       ├── src/
│       │   ├── components/      # ✅ Layout, Navbar, Sidebar, UI (DONE)
│       │   ├── hooks/           # ✅ Custom hooks (DONE)
│       │   ├── pages/           # ✅ All pages (placeholder)
│       │   ├── services/        # ✅ API services (DONE)
│       │   │   └── api/         # ✅ 10 API services
│       │   ├── store/           # ✅ Zustand stores (DONE)
│       │   ├── utils/           # ✅ Helpers (DONE)
│       │   ├── App.jsx          # ✅ (DONE)
│       │   ├── main.jsx         # ✅ (DONE)
│       │   └── index.css        # ✅ Global styles (DONE)
│       ├── index.html           # ✅ (DONE)
│       ├── vite.config.js       # ✅ (DONE)
│       ├── tailwind.config.js   # ✅ (DONE)
│       └── package.json
└── *.md                         # Documentation files
```

---

## TESTING

### Backend Testing

```bash
cd web/backend

# Test health endpoint
curl http://localhost:5000/health

# Test register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

### Frontend Testing

1. Mở http://localhost:3000
2. Test đăng ký user mới
3. Test đăng nhập
4. Test navigation, dark mode toggle
5. Test home page với posts

---

## NEXT STEPS

### Ưu tiên cao:

1. ✅ Tạo một vài categories trong database (dùng MongoDB Compass hoặc script)
2. ✅ Tạo một vài test posts
3. ⬜ Hoàn thiện **Post Detail Page** với comments
4. ⬜ Hoàn thiện **Create Post Page** với rich text editor
5. ⬜ Implement **Vote buttons** với animations
6. ⬜ Implement **Comment system** với replies

### Ưu tiên trung bình:

7. ⬜ Train AI models (toxic detection, emotion detection)
8. ⬜ Integrate AI vào comment/post creation
9. ⬜ Implement notification system với real-time updates
10. ⬜ Admin dashboard

---

## TECHNOLOGIES USED

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Cloudinary (file upload)
- bcryptjs (password hashing)
- express-validator (validation)
- helmet, cors (security)
- multer (file upload middleware)

### Frontend

- React 18
- Vite
- React Router v6
- Zustand (state management)
- React Query (data fetching)
- Axios (HTTP client)
- TailwindCSS + DaisyUI (UI)
- React Hot Toast (notifications)
- React Icons
- React Markdown (markdown rendering)
- dayjs (date formatting)

### AI/ML (To be implemented)

- Python
- TensorFlow/PyTorch
- Datasets đã có sẵn trong `ai/` folder

---

## TIPS & NOTES

1. **Code Structure**: Code được tổ chức theo kiến trúc MVC, clean và dễ maintain
2. **Security**: Đã implement JWT, rate limiting, input validation, sanitization
3. **User System**: Badge system tự động update dựa trên activity
4. **Restrictions**: User phải comment 3 lần và đăng ký trên 1 tiếng mới được tạo post
5. **Reports**: Bị report 5 lần (accepted) sẽ bị ban comment 1 ngày
6. **API**: RESTful API design với proper status codes và error handling
7. **Frontend**: Responsive, modern UI với dark mode support

---

## TROUBLESHOOTING

### Backend không kết nối MongoDB:

- Kiểm tra MongoDB đã chạy: `mongod` hoặc MongoDB service
- Kiểm tra MONGODB_URI trong .env

### Frontend không call được API:

- Kiểm tra VITE_API_URL trong .env
- Kiểm tra CORS trong backend (FRONTEND_URL)
- Check Network tab trong Browser DevTools

### Upload ảnh lỗi:

- Kiểm tra Cloudinary credentials trong .env
- Kiểm tra file size (max 25MB)
- Kiểm tra file type (chỉ accept images và videos)

---

## CONTACT & SUPPORT

Dự án này là đồ án môn học Hệ thống thông minh.

**Các tính năng AI cần implement:**

1. Phát hiện toxic/spam content
2. Phân tích cảm xúc trong comments
3. Gợi ý khi user có cảm xúc tiêu cực

**Lưu ý**: Dataset AI đã có sẵn trong folder `ai/`, cần train models và tích hợp vào web app.

---

Chúc bạn code vui vẻ! 🚀
