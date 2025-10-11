# Cấu Trúc Thư Mục Dự Án

```
DoAnHTTM/
│
├── 📁 web/                           # Web application
│   │
│   ├── 📁 backend/                   # Backend API (Node.js + Express)
│   │   ├── 📁 config/
│   │   │   ├── database.js          # ✅ MongoDB connection
│   │   │   └── cloudinary.js        # ✅ Cloudinary config
│   │   │
│   │   ├── 📁 models/               # ✅ Mongoose schemas
│   │   │   ├── User.js              # ✅ User model với badge, restrictions
│   │   │   ├── Category.js          # ✅ Category model với hierarchy
│   │   │   ├── Post.js              # ✅ Post model với AI analysis
│   │   │   ├── Comment.js           # ✅ Comment model với emotion detection
│   │   │   ├── Vote.js              # ✅ Vote model (upvote/downvote)
│   │   │   └── Report.js            # ✅ Report model cho moderation
│   │   │
│   │   ├── 📁 controllers/          # 🔲 Business logic (TODO)
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── categoryController.js
│   │   │   ├── postController.js
│   │   │   ├── commentController.js
│   │   │   ├── voteController.js
│   │   │   ├── reportController.js
│   │   │   └── uploadController.js
│   │   │
│   │   ├── 📁 routes/               # ✅ API routes
│   │   │   ├── authRoutes.js        # ✅ Register, login, OAuth
│   │   │   ├── userRoutes.js        # ✅ User CRUD
│   │   │   ├── categoryRoutes.js    # ✅ Category CRUD
│   │   │   ├── postRoutes.js        # ✅ Post CRUD
│   │   │   ├── commentRoutes.js     # ✅ Comment CRUD
│   │   │   ├── voteRoutes.js        # ✅ Voting
│   │   │   ├── reportRoutes.js      # ✅ Reporting
│   │   │   └── uploadRoutes.js      # ✅ File upload
│   │   │
│   │   ├── 📁 middleware/           # ✅ Express middleware
│   │   │   ├── auth.js              # ✅ Authentication & authorization
│   │   │   ├── validate.js          # ✅ Input validation
│   │   │   └── upload.js            # 🔲 Multer config (TODO)
│   │   │
│   │   ├── 📁 utils/                # 🔲 Helper functions (TODO)
│   │   │   ├── email.js
│   │   │   ├── jwt.js
│   │   │   ├── slugify.js
│   │   │   └── aiService.js
│   │   │
│   │   ├── server.js                # ✅ Entry point
│   │   ├── package.json             # ✅ Dependencies
│   │   └── .env.example             # ✅ Environment template
│   │
│   └── 📁 frontend/                 # Frontend (React + Vite)
│       ├── 📁 src/
│       │   ├── 📁 components/       # 🔲 React components (TODO)
│       │   │   ├── common/          # Button, Input, Modal, Card
│       │   │   ├── layout/          # Header, Footer, Sidebar
│       │   │   ├── post/            # PostCard, PostList, PostForm
│       │   │   ├── comment/         # CommentItem, CommentList
│       │   │   └── user/            # UserCard, UserProfile, UserBadge
│       │   │
│       │   ├── 📁 pages/            # 🔲 Page components (TODO)
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── PostDetail.jsx
│       │   │   ├── CreatePost.jsx
│       │   │   ├── Profile.jsx
│       │   │   └── Admin/
│       │   │
│       │   ├── 📁 services/         # 🔲 API services (TODO)
│       │   │   ├── api.js           # Axios instance
│       │   │   ├── authService.js
│       │   │   ├── postService.js
│       │   │   └── commentService.js
│       │   │
│       │   ├── 📁 hooks/            # 🔲 Custom React hooks (TODO)
│       │   ├── 📁 context/          # 🔲 React Context (TODO)
│       │   ├── 📁 utils/            # 🔲 Helper functions (TODO)
│       │   │
│       │   ├── App.jsx              # 🔲 Main App component (TODO)
│       │   └── main.jsx             # 🔲 Entry point (TODO)
│       │
│       ├── package.json             # ✅ Dependencies
│       ├── vite.config.js           # 🔲 Vite config (TODO)
│       ├── tailwind.config.js       # 🔲 Tailwind config (TODO)
│       └── index.html               # 🔲 HTML template (TODO)
│
├── 📁 ai/                            # AI Models & Services
│   │
│   ├── 📁 toxic_detection/          # Toxic/Spam detection
│   │   ├── model.py                 # ✅ PhoBERT model
│   │   ├── train.py                 # 🔲 Training script (TODO)
│   │   ├── predict.py               # 🔲 Prediction script (TODO)
│   │   ├── 📁 dataset/              # ViTHSD dataset
│   │   └── 📁 checkpoints/          # Trained models
│   │
│   ├── 📁 emotions/                 # Emotion detection
│   │   ├── model.py                 # ✅ PhoBERT model
│   │   ├── train.py                 # 🔲 Training script (TODO)
│   │   ├── predict.py               # 🔲 Prediction script (TODO)
│   │   ├── 📁 dataset/              # ✅ Emotion dataset (có sẵn)
│   │   └── 📁 checkpoints/          # Trained models
│   │
│   ├── api.py                       # ✅ FastAPI service
│   ├── requirements.txt             # ✅ Python dependencies
│   └── .env.example                 # ✅ Environment template
│
├── 📄 .gitignore                    # ✅ Git ignore rules
├── 📄 README.md                     # ✅ Project documentation
├── 📄 DATABASE_DESIGN.md            # ✅ Database schema documentation
└── 📄 STRUCTURE.md                  # ✅ This file

```

## Trạng Thái Hoàn Thành

### ✅ Đã Hoàn Thành

#### Backend

- [x] Database models (User, Category, Post, Comment, Vote, Report)
- [x] Database connection config
- [x] Cloudinary config
- [x] Authentication middleware
- [x] Validation middleware
- [x] All route definitions
- [x] Server setup với middleware stack
- [x] Package.json với dependencies

#### AI

- [x] Toxic detection model class
- [x] Emotion detection model class
- [x] FastAPI service với endpoints
- [x] Requirements.txt

#### Documentation

- [x] README.md với hướng dẫn chi tiết
- [x] DATABASE_DESIGN.md với schema đầy đủ
- [x] STRUCTURE.md (file này)
- [x] .env.example files

### 🔲 Cần Hoàn Thành

#### Backend

- [ ] Implement tất cả controllers (authController, userController, etc.)
- [ ] Implement utils (email service, JWT helpers, AI service client)
- [ ] Implement upload middleware (multer config)
- [ ] Google OAuth integration
- [ ] Email service (nodemailer)
- [ ] Testing (unit tests, integration tests)

#### Frontend

- [ ] Setup Vite + React project
- [ ] Tạo tất cả components
- [ ] Tạo tất cả pages
- [ ] Implement API services
- [ ] State management (Zustand stores)
- [ ] Routing (React Router)
- [ ] UI/UX design với Tailwind + DaisyUI
- [ ] Responsive design
- [ ] Testing

#### AI

- [ ] Train toxic detection model trên ViTHSD dataset
- [ ] Train emotion detection model trên emotion dataset
- [ ] Implement training scripts
- [ ] Implement prediction scripts
- [ ] Model evaluation và optimization
- [ ] Deploy AI service

#### DevOps

- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] Deployment scripts
- [ ] Monitoring & logging
- [ ] Backup strategy

## Thứ Tự Phát Triển Đề Xuất

### Phase 1: Backend Core (Week 1-2)

1. Implement authController (register, login, JWT)
2. Implement userController (CRUD profile)
3. Implement categoryController (admin tạo categories)
4. Test authentication flow

### Phase 2: Main Features (Week 3-4)

1. Implement postController (CRUD posts)
2. Implement commentController (CRUD comments với nesting)
3. Implement voteController (upvote/downvote)
4. Implement uploadController (Cloudinary integration)
5. Test posting flow

### Phase 3: AI Integration (Week 5-6)

1. Train toxic detection model
2. Train emotion detection model
3. Deploy AI service
4. Integrate AI calls vào postController và commentController
5. Test AI predictions

### Phase 4: Moderation (Week 7)

1. Implement reportController
2. Implement moderator dashboard
3. Test moderation flow (ban users, remove content)

### Phase 5: Frontend (Week 8-10)

1. Setup React + Vite + TailwindCSS
2. Implement layout components (Header, Footer, Sidebar)
3. Implement authentication pages (Login, Register)
4. Implement main pages (Home, PostDetail, Profile)
5. Implement post creation flow
6. Implement comment system với emotion display
7. Implement voting UI
8. Implement admin/moderator dashboard

### Phase 6: Polish & Deploy (Week 11-12)

1. UI/UX improvements
2. Performance optimization
3. Security hardening
4. Testing (unit, integration, E2E)
5. Documentation
6. Deployment

## Lưu Ý Quan Trọng

### Backend

- Tất cả models đã có đầy đủ methods và business logic
- Routes đã được define, chỉ cần implement controllers
- Middleware đã sẵn sàng cho authentication và validation
- Cần implement AI service client ở utils/aiService.js để gọi AI API

### Database

- MongoDB indexes đã được define trong models
- Cần create database và collections khi chạy lần đầu
- Mongoose sẽ tự động create indexes

### AI

- Models sử dụng PhoBERT (vinai/phobert-base)
- Cần GPU để train nhanh (hoặc dùng Google Colab)
- Có thể download pre-trained PhoBERT và fine-tune
- FastAPI service có thể chạy riêng trên port 8000

### Frontend

- Sử dụng React Query để cache API calls
- Zustand cho global state (auth, user info)
- TailwindCSS + DaisyUI cho UI components
- React Hook Form cho form validation

## Resources

### Backend

- Express.js: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- JWT: https://jwt.io/
- Cloudinary: https://cloudinary.com/documentation

### Frontend

- React: https://react.dev/
- Vite: https://vitejs.dev/
- TailwindCSS: https://tailwindcss.com/
- DaisyUI: https://daisyui.com/
- React Query: https://tanstack.com/query/latest

### AI

- Transformers: https://huggingface.co/docs/transformers
- PhoBERT: https://huggingface.co/vinai/phobert-base
- FastAPI: https://fastapi.tiangolo.com/
- PyTorch: https://pytorch.org/

### Dataset

- ViTHSD: https://github.com/bakansm/ViTHSD
