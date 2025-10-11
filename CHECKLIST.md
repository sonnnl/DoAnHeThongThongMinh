# Development Checklist

Checklist theo dõi tiến độ phát triển dự án.

---

## ✅ Phase 0: Setup & Planning (COMPLETED)

- [x] Tạo cấu trúc thư mục
- [x] Thiết kế database schemas
- [x] Viết documentation
  - [x] README.md
  - [x] DATABASE_DESIGN.md
  - [x] STRUCTURE.md
  - [x] QUICK_START.md
  - [x] API_DOCUMENTATION.md
- [x] Setup backend structure
  - [x] Models (User, Category, Post, Comment, Vote, Report)
  - [x] Routes (tất cả route definitions)
  - [x] Middleware (auth, validate)
  - [x] Config files (database, cloudinary)
  - [x] Package.json
- [x] Setup AI structure
  - [x] Model classes (toxic detection, emotion detection)
  - [x] FastAPI service
  - [x] Requirements.txt
- [x] Create .gitignore
- [x] Create .env.example files

---

## 🔲 Phase 1: Backend Core (Week 1-2)

### Authentication & Authorization

- [ ] Implement authController.js
  - [ ] Register endpoint
  - [ ] Login endpoint
  - [ ] Refresh token endpoint
  - [ ] Logout endpoint
  - [ ] Get current user endpoint
- [ ] Implement Google OAuth
  - [ ] Setup Passport.js
  - [ ] Google strategy
  - [ ] Callback handler
- [ ] JWT utilities
  - [ ] Generate token
  - [ ] Verify token
  - [ ] Refresh token logic
- [ ] Email service
  - [ ] Setup Nodemailer
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Welcome email
- [ ] Testing
  - [ ] Unit tests cho auth logic
  - [ ] Integration tests cho auth endpoints

### User Management

- [ ] Implement userController.js
  - [ ] Get user profile
  - [ ] Update profile
  - [ ] Get user's posts
  - [ ] Get user's comments
  - [ ] Get user statistics
- [ ] Avatar upload
  - [ ] Multer middleware
  - [ ] Cloudinary integration
  - [ ] Image optimization
- [ ] Badge calculation
  - [ ] Auto-update badges based on stats
  - [ ] Background job for recalculation
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests

### Category Management

- [ ] Implement categoryController.js
  - [ ] Get all categories
  - [ ] Get category by ID/slug
  - [ ] Create category (admin)
  - [ ] Update category (admin)
  - [ ] Delete category (admin)
  - [ ] Get posts in category
- [ ] Subcategories
  - [ ] Nested category structure
  - [ ] Category tree builder
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests

---

## 🔲 Phase 2: Main Features (Week 3-4)

### Posts

- [ ] Implement postController.js
  - [ ] Get posts list (with sorting: hot, new, top, controversial)
  - [ ] Get post by slug
  - [ ] Create post
  - [ ] Update post
  - [ ] Delete post
  - [ ] Search posts
- [ ] Media handling
  - [ ] Image upload (multiple)
  - [ ] Video upload (max 25MB)
  - [ ] Media validation
  - [ ] Delete orphan media
- [ ] Post permissions
  - [ ] Check if user can post
  - [ ] Author-only edit/delete
  - [ ] Moderator actions
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Load testing

### Comments

- [ ] Implement commentController.js
  - [ ] Get comments for post
  - [ ] Get comment by ID
  - [ ] Create comment
  - [ ] Create reply (nested comment)
  - [ ] Update comment
  - [ ] Delete comment (soft delete)
- [ ] Comment tree
  - [ ] Build nested comment structure
  - [ ] Optimize query performance
  - [ ] Pagination for nested comments
- [ ] Comment permissions
  - [ ] Check if user can comment
  - [ ] Author-only edit/delete
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests

### Voting System

- [ ] Implement voteController.js
  - [ ] Upvote post
  - [ ] Downvote post
  - [ ] Upvote comment
  - [ ] Downvote comment
  - [ ] Get user's votes
  - [ ] Remove vote
- [ ] Score calculation
  - [ ] Hot score algorithm
  - [ ] Controversial score algorithm
  - [ ] Background job to update scores
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Concurrency tests

### File Upload

- [ ] Implement uploadController.js
  - [ ] Upload image
  - [ ] Upload video
  - [ ] Delete file
  - [ ] Get upload history
- [ ] Upload middleware
  - [ ] Multer configuration
  - [ ] File type validation
  - [ ] File size validation
  - [ ] Virus scanning (optional)
- [ ] Cloudinary optimization
  - [ ] Image transformations
  - [ ] Video transcoding
  - [ ] Thumbnail generation
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Large file tests

---

## 🔲 Phase 3: AI Integration (Week 5-6)

### Toxic Detection

- [ ] Dataset preparation
  - [ ] Download ViTHSD dataset
  - [ ] Data cleaning
  - [ ] Train/val/test split
  - [ ] Data augmentation
- [ ] Model training
  - [ ] Setup training script
  - [ ] Train model
  - [ ] Evaluate model
  - [ ] Save best checkpoint
- [ ] Model deployment
  - [ ] Load model in FastAPI
  - [ ] Optimize inference
  - [ ] Test API endpoint
- [ ] Integration
  - [ ] Create aiService.js utility
  - [ ] Call AI API from postController
  - [ ] Call AI API from commentController
  - [ ] Handle API errors gracefully
- [ ] Testing
  - [ ] Unit tests cho AI service
  - [ ] Integration tests
  - [ ] Performance tests

### Emotion Detection

- [ ] Dataset preparation
  - [ ] Verify dataset
  - [ ] Data cleaning
  - [ ] Train/val/test split
- [ ] Model training
  - [ ] Setup training script
  - [ ] Train model
  - [ ] Evaluate model
  - [ ] Save best checkpoint
- [ ] Model deployment
  - [ ] Load model in FastAPI
  - [ ] Test API endpoint
- [ ] Integration
  - [ ] Call AI API from commentController
  - [ ] Display emotion with colors
  - [ ] Show suggestions for anger
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] UI tests

### AI Service Optimization

- [ ] Batch prediction
- [ ] Caching predictions
- [ ] Model quantization
- [ ] GPU optimization
- [ ] Monitoring & logging

---

## 🔲 Phase 4: Moderation (Week 7)

### Report System

- [ ] Implement reportController.js
  - [ ] Create report
  - [ ] Get reports list (moderator)
  - [ ] Get report by ID
  - [ ] Accept report
  - [ ] Reject report
  - [ ] Get report statistics
- [ ] Report actions
  - [ ] Remove content
  - [ ] Ban user (1 day, 7 days, 30 days, permanent)
  - [ ] Send warning email
  - [ ] Log moderation actions
- [ ] Auto-moderation
  - [ ] Auto-ban after 5 accepted reports
  - [ ] Auto-flag high toxic score posts
  - [ ] Priority calculation
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Moderator workflow tests

### Moderator Dashboard

- [ ] Moderator routes
  - [ ] Pending reports
  - [ ] User bans
  - [ ] Content removal logs
  - [ ] Statistics
- [ ] Moderator permissions
  - [ ] Category-specific moderators
  - [ ] Action permissions
- [ ] Testing
  - [ ] Permission tests
  - [ ] Workflow tests

---

## 🔲 Phase 5: Frontend (Week 8-10)

### Setup

- [ ] Initialize Vite + React project
- [ ] Setup Tailwind CSS + DaisyUI
- [ ] Setup React Router
- [ ] Setup React Query
- [ ] Setup Zustand stores
- [ ] Configure ESLint
- [ ] Configure Prettier

### Layout & Navigation

- [ ] Header component
  - [ ] Logo
  - [ ] Navigation menu
  - [ ] Search bar
  - [ ] User menu
  - [ ] Notifications (future)
- [ ] Sidebar component
  - [ ] Categories list
  - [ ] Trending topics
  - [ ] Quick links
- [ ] Footer component
- [ ] Mobile responsive design

### Common Components

- [ ] Button component
- [ ] Input component
- [ ] Textarea component
- [ ] Select component
- [ ] Modal component
- [ ] Card component
- [ ] Badge component
- [ ] Avatar component
- [ ] Loading spinner
- [ ] Error message
- [ ] Empty state
- [ ] Pagination component

### Authentication Pages

- [ ] Login page
  - [ ] Email/password form
  - [ ] Google OAuth button
  - [ ] Forgot password link
  - [ ] Remember me
- [ ] Register page
  - [ ] Registration form
  - [ ] Validation
  - [ ] Terms acceptance
- [ ] Forgot password page
- [ ] Reset password page
- [ ] Email verification page

### Main Pages

- [ ] Home page
  - [ ] Post list
  - [ ] Sorting tabs (hot, new, top)
  - [ ] Infinite scroll
  - [ ] Filters
- [ ] Post detail page
  - [ ] Post content
  - [ ] Voting buttons
  - [ ] Share buttons
  - [ ] Comments section
  - [ ] Nested comments UI
- [ ] Create post page
  - [ ] Title input
  - [ ] Rich text editor
  - [ ] Category selector
  - [ ] Tag input
  - [ ] Image/video upload
  - [ ] Preview
- [ ] Edit post page
- [ ] Category page
  - [ ] Category info
  - [ ] Posts in category
  - [ ] Subcategories

### User Pages

- [ ] Profile page
  - [ ] User info
  - [ ] Badge display
  - [ ] Statistics
  - [ ] Posts tab
  - [ ] Comments tab
  - [ ] Edit profile (own profile)
- [ ] Edit profile page
  - [ ] Bio editor
  - [ ] Avatar upload
  - [ ] Account settings

### Admin Pages

- [ ] Admin dashboard
  - [ ] Statistics overview
  - [ ] Recent activity
- [ ] User management
  - [ ] User list
  - [ ] Ban/unban users
  - [ ] Change roles
- [ ] Category management
  - [ ] Category list
  - [ ] Create category
  - [ ] Edit category
  - [ ] Delete category
- [ ] Reports management
  - [ ] Pending reports
  - [ ] Review reports
  - [ ] Moderation logs

### Components

- [ ] PostCard component
  - [ ] Title
  - [ ] Preview content
  - [ ] Author info
  - [ ] Stats (votes, comments, views)
  - [ ] Voting buttons
  - [ ] Category badge
  - [ ] Tags
- [ ] PostList component
- [ ] CommentItem component
  - [ ] Author info
  - [ ] Content
  - [ ] Emotion indicator
  - [ ] Voting buttons
  - [ ] Reply button
  - [ ] Edit/delete buttons
  - [ ] Nested replies
- [ ] CommentList component
- [ ] CommentForm component
  - [ ] Textarea
  - [ ] Image upload
  - [ ] Emoji picker (optional)
  - [ ] Preview
- [ ] UserCard component
- [ ] UserBadge component
- [ ] EmotionBadge component
- [ ] VoteButtons component
- [ ] CategoryCard component
- [ ] RichTextEditor component
- [ ] ImageUploader component
- [ ] VideoUploader component

### Services

- [ ] api.js (Axios setup)
  - [ ] Base configuration
  - [ ] Request interceptor (add token)
  - [ ] Response interceptor (handle errors)
  - [ ] Token refresh logic
- [ ] authService.js
- [ ] userService.js
- [ ] postService.js
- [ ] commentService.js
- [ ] voteService.js
- [ ] categoryService.js
- [ ] reportService.js
- [ ] uploadService.js

### State Management

- [ ] Auth store (Zustand)
  - [ ] User state
  - [ ] Login/logout actions
  - [ ] Token management
- [ ] UI store
  - [ ] Theme
  - [ ] Sidebar open/close
  - [ ] Modals

### Testing

- [ ] Component tests (Vitest + Testing Library)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Accessibility tests

---

## 🔲 Phase 6: Polish & Deploy (Week 11-12)

### Performance Optimization

- [ ] Backend
  - [ ] Database query optimization
  - [ ] Add database indexes
  - [ ] Implement caching (Redis)
  - [ ] Lazy loading
  - [ ] Pagination optimization
- [ ] Frontend
  - [ ] Code splitting
  - [ ] Lazy loading routes
  - [ ] Image lazy loading
  - [ ] Memoization
  - [ ] Bundle size optimization
- [ ] AI
  - [ ] Model quantization
  - [ ] Batch predictions
  - [ ] Response caching

### Security

- [ ] Backend
  - [ ] SQL injection protection (NoSQL sanitize)
  - [ ] XSS protection
  - [ ] CSRF protection
  - [ ] Rate limiting per endpoint
  - [ ] Helmet.js headers
  - [ ] Input sanitization
  - [ ] File upload security
- [ ] Frontend
  - [ ] Secure token storage
  - [ ] XSS prevention
  - [ ] Content Security Policy
- [ ] AI
  - [ ] API key rotation
  - [ ] Request validation

### Testing

- [ ] Backend
  - [ ] Unit tests coverage > 80%
  - [ ] Integration tests
  - [ ] API endpoint tests
  - [ ] Load testing
- [ ] Frontend
  - [ ] Component tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Accessibility tests
- [ ] AI
  - [ ] Model accuracy tests
  - [ ] API performance tests

### Documentation

- [ ] Update README.md
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Frontend component documentation (Storybook)
- [ ] Deployment guide
- [ ] User guide
- [ ] Admin guide
- [ ] Code comments

### Deployment

- [ ] Setup production database (MongoDB Atlas)
- [ ] Setup production environment
  - [ ] Backend (Vercel/Railway/Render)
  - [ ] Frontend (Vercel/Netlify)
  - [ ] AI Service (Railway/Render với GPU)
- [ ] Setup Cloudinary production account
- [ ] Setup environment variables
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Setup monitoring (Sentry, New Relic)
- [ ] Setup logging (Winston, Logtail)
- [ ] Setup backup strategy
- [ ] Domain & SSL certificate
- [ ] CDN setup

---

## 🔲 Future Enhancements (Optional)

### Features

- [ ] Real-time notifications (WebSocket)
- [ ] Direct messages
- [ ] User following
- [ ] Post bookmarks
- [ ] Awards/Badges system
- [ ] Gamification
- [ ] Search với Elasticsearch
- [ ] Multi-language support
- [ ] Dark mode
- [ ] PWA support
- [ ] Mobile app (React Native)

### AI Features

- [ ] Content recommendation system
- [ ] Smart tagging
- [ ] Similar posts suggestion
- [ ] Auto-summarization
- [ ] Sentiment analysis trends
- [ ] Chatbot support

### Admin Features

- [ ] Advanced analytics dashboard
- [ ] User behavior tracking
- [ ] A/B testing
- [ ] Bulk operations
- [ ] Export data

---

## 📊 Progress Summary

**Total Tasks:** ~200+  
**Completed:** ~30 (Setup phase)  
**In Progress:** 0  
**Remaining:** ~170

**Estimated Time:** 12 weeks (3 months)

---

**Last Updated:** 2024-01-01
