# Forum Thảo Luận - Đồ Án HTTM

Dự án forum thảo luận tương tự VOZ, Reddit với tích hợp AI phát hiện spam, toxic và cảm xúc.

## 📋 Tổng Quan

Đây là đồ án môn Hệ thống Thông minh, xây dựng một forum thảo luận với các tính năng:

### Tính Năng Chính

#### 🙋 User Management

- Đăng ký/Đăng nhập (email + password hoặc Google OAuth)
- Profile với avatar, bio, thống kê
- Hệ thống badge/biệt hiệu: Newbie, Người từng trải, Chuyên gia, Xem chùa
- Tracking: số ngày tham gia, upvotes/downvotes nhận được
- Restrictions: ban user, cấm comment/post

#### 📁 Categories

- Admin tạo categories/subcategories
- Icon, màu sắc, cover image cho mỗi category
- Đếm số posts, comments, views
- Rules riêng cho từng category

#### 📝 Posts

- Tạo bài viết với title, content (rich text)
- Upload ảnh và video (max 25MB)
- Tags
- Upvote/downvote system
- Đếm views, comments
- Tính score theo thuật toán Hot (Reddit-style)
- Pin, lock, feature posts

#### 💬 Comments

- Nested comments (replies)
- Upload ảnh trong comment
- Chỉnh sửa, xóa (soft delete - giữ structure nếu có replies)
- Upvote/downvote
- Hiển thị "[Bình luận này đã bị xóa]" khi có reply

#### 🚨 Report System

- User report posts/comments/users
- Lý do: spam, harassment, hate_speech, violence, etc.
- Moderator review và accept/reject
- Tự động ban user khi bị report 5 lần được chấp nhận

#### 🤖 AI Features

1. **Phát hiện Toxic Content**

   - Spam detection
   - Hate speech detection
   - Harassment detection
   - Sử dụng PhoBERT fine-tuned trên ViTHSD dataset

2. **Phân tích Cảm xúc**
   - Detect 8 emotions: joy, sadness, anger, fear, surprise, neutral, love, disgust
   - Gắn màu nền cho comment dựa trên emotion
   - Hiển thị gợi ý nếu detect anger

## 🏗️ Kiến Trúc

### Technology Stack

**Backend:**

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (image/video storage)
- Google OAuth

**Frontend:**

- React 18
- Vite
- TailwindCSS + DaisyUI
- React Router
- React Query
- Zustand (state management)

**AI:**

- Python + FastAPI
- PyTorch
- Transformers (PhoBERT)
- TensorFlow

### Cấu Trúc Thư Mục

```
DoAnHTTM/
├── web/
│   ├── backend/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection
│   │   │   └── cloudinary.js        # Cloudinary config
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── Category.js          # Category schema
│   │   │   ├── Post.js              # Post schema
│   │   │   ├── Comment.js           # Comment schema
│   │   │   ├── Vote.js              # Vote schema
│   │   │   └── Report.js            # Report schema
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── categoryController.js
│   │   │   ├── postController.js
│   │   │   ├── commentController.js
│   │   │   ├── voteController.js
│   │   │   └── reportController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── postRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   ├── voteRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # Authentication & authorization
│   │   │   ├── validate.js          # Input validation
│   │   │   └── upload.js            # File upload
│   │   ├── utils/
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── server.js                # Entry point
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/          # Button, Input, Modal, etc.
│       │   │   ├── layout/          # Header, Footer, Sidebar
│       │   │   ├── post/            # PostCard, PostList, PostForm
│       │   │   ├── comment/         # CommentItem, CommentList, CommentForm
│       │   │   └── user/            # UserCard, UserProfile, UserBadge
│       │   ├── pages/
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── PostDetail.jsx
│       │   │   ├── CreatePost.jsx
│       │   │   ├── Profile.jsx
│       │   │   ├── Category.jsx
│       │   │   └── Admin/
│       │   ├── services/
│       │   │   ├── api.js           # Axios instance
│       │   │   ├── authService.js
│       │   │   ├── postService.js
│       │   │   └── commentService.js
│       │   ├── hooks/
│       │   ├── context/
│       │   ├── utils/
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── package.json
│       ├── vite.config.js
│       └── tailwind.config.js
│
├── ai/
│   ├── toxic_detection/
│   │   ├── model.py                 # PhoBERT model cho toxic detection
│   │   ├── train.py                 # Training script
│   │   ├── predict.py               # Prediction script
│   │   ├── dataset/                 # ViTHSD dataset
│   │   └── checkpoints/             # Trained models
│   │
│   ├── emotions/
│   │   ├── model.py                 # PhoBERT model cho emotion detection
│   │   ├── train.py
│   │   ├── predict.py
│   │   ├── dataset/                 # Emotion dataset
│   │   └── checkpoints/
│   │
│   ├── api.py                       # FastAPI service
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

## 🗄️ Database Schema

### User

```javascript
{
  username, email, password, googleId,
  avatar, bio, location, website,
  stats: { postsCount, commentsCount, upvotesReceived, downvotesReceived, ... },
  badge: "Newbie" | "Người từng trải" | "Chuyên gia" | "Xem chùa",
  role: "user" | "moderator" | "admin",
  restrictions: { canComment, canPost, bannedUntil, banReason }
}
```

### Category

```javascript
{
  name, slug, description,
  icon, color, coverImage,
  parentCategory,
  stats: { postsCount, commentsCount, viewsCount },
  settings: { isActive, requireApproval, allowImages, allowVideos },
  moderators: [userId]
}
```

### Post

```javascript
{
  title, slug, content,
  author, category,
  media: { images: [], videos: [] },
  tags: [],
  stats: { upvotes, downvotes, commentsCount, viewsCount },
  score,
  status: "draft" | "published" | "pending_approval" | "removed" | "spam",
  aiAnalysis: { isToxic, toxicScore, isSpam, spamScore }
}
```

### Comment

```javascript
{
  content, author, post,
  parentComment, depth,
  images: [],
  stats: { upvotes, downvotes, repliesCount },
  emotion: { label, confidence },
  aiAnalysis: { isToxic, toxicScore },
  isDeleted, deletedMessage
}
```

### Vote

```javascript
{
  user,
  targetType: "Post" | "Comment",
  targetId,
  voteType: "upvote" | "downvote"
}
```

### Report

```javascript
{
  reporter,
  targetType: "Post" | "Comment" | "User",
  targetId,
  reason: "spam" | "harassment" | "hate_speech" | ...,
  description,
  status: "pending" | "reviewing" | "accepted" | "rejected",
  reviewedBy, action
}
```

## 🚀 Cài Đặt và Chạy

### Prerequisites

- Node.js >= 18
- MongoDB
- Python >= 3.9
- GPU (optional, cho training AI models)

### Backend Setup

```bash
cd web/backend
npm install
cp .env.example .env
# Điền thông tin vào .env
npm run dev
```

### Frontend Setup

```bash
cd web/frontend
npm install
npm run dev
```

### AI Service Setup

```bash
cd ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Train models hoặc download pre-trained models
python api.py
```

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/refresh` - Refresh token

### Users

- `GET /api/users/:id` - Lấy profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/avatar` - Upload avatar

### Categories

- `GET /api/categories` - Lấy tất cả categories
- `POST /api/categories` - Tạo category (admin)
- `PUT /api/categories/:id` - Update category (admin)

### Posts

- `GET /api/posts` - Lấy danh sách posts (hot, new, top)
- `GET /api/posts/:slug` - Lấy chi tiết post
- `POST /api/posts` - Tạo post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Xóa post

### Comments

- `GET /api/comments?postId=xxx` - Lấy comments của post
- `POST /api/comments` - Tạo comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Xóa comment

### Votes

- `POST /api/votes/upvote` - Upvote
- `POST /api/votes/downvote` - Downvote

### Reports

- `POST /api/reports` - Tạo report
- `GET /api/reports` - Lấy danh sách reports (moderator)
- `PUT /api/reports/:id/accept` - Accept report (moderator)
- `PUT /api/reports/:id/reject` - Reject report (moderator)

### AI

- `POST /api/ai/toxic` - Detect toxic content
- `POST /api/ai/emotion` - Detect emotion
- `POST /api/ai/analyze` - Phân tích toàn diện

## 🎯 Các Quy Tắc Nghiệp Vụ

1. **Restrictions cho User mới:**

   - Phải đăng ký đủ 1 tiếng mới được đăng bài
   - Phải comment ít nhất 3 lần mới được đăng bài

2. **Badge/Biệt hiệu:**

   - **Newbie**: < 10 posts, < 50 comments
   - **Người từng trải**: 10-50 posts, 50-200 comments
   - **Chuyên gia**: > 50 posts hoặc > 200 comments hoặc > 500 upvotes
   - **Xem chùa**: < 5 posts, < 10 comments

3. **Moderation:**

   - Bị report 5 lần (accepted) → bị cấm comment 1 ngày
   - AI detect toxic với confidence > 0.8 → auto pending approval

4. **Score Calculation:**
   - Hot score: `net_votes / (age_hours + 2)^1.5`
   - Controversial: `min(upvotes, downvotes) * total_votes`

## 📊 AI Models

### Toxic Detection

- Base: PhoBERT (vinai/phobert-base)
- Dataset: ViTHSD (Vietnamese Toxic & Hate Speech Detection)
- Classes: clean, spam, hate_speech, harassment
- Accuracy: ~85-90%

### Emotion Detection

- Base: PhoBERT
- Dataset: Custom Vietnamese emotion dataset
- Classes: joy, sadness, anger, fear, surprise, neutral, love, disgust
- Accuracy: ~80-85%

## 📄 License

MIT

## 👥 Contributors

[Your Name]
