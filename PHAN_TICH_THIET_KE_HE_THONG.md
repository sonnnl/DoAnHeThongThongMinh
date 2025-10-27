# PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG FORUM THẢO LUẬN

**Đồ án:** Hệ Thống Thông Minh  
**Tên đề tài:** Forum Thảo Luận Trực Tuyến  
**Ngày:** Tháng 10, 2025

---

## MỤC LỤC

1. [GIỚI THIỆU TỔNG QUAN](#1-giới-thiệu-tổng-quan)
2. [PHÂN TÍCH YÊU CẦU HỆ THỐNG](#2-phân-tích-yêu-cầu-hệ-thống)
3. [THIẾT KẾ KIẾN TRÚC HỆ THỐNG](#3-thiết-kế-kiến-trúc-hệ-thống)
4. [THIẾT KẾ CƠ SỞ DỮ LIỆU](#4-thiết-kế-cơ-sở-dữ-liệu)
5. [THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG](#5-thiết-kế-giao-diện-người-dùng)
6. [THIẾT KẾ API VÀ ENDPOINTS](#6-thiết-kế-api-và-endpoints)
7. [CÁC USE CASE CHÍNH](#7-các-use-case-chính)
8. [SƠ ĐỒ HOẠT ĐỘNG](#8-sơ-đồ-hoạt-động)
9. [BẢO MẬT VÀ PHÂN QUYỀN](#9-bảo-mật-và-phân-quyền)
10. [KẾT LUẬN](#10-kết-luận)

---

## 1. GIỚI THIỆU TỔNG QUAN

### 1.1. Mục tiêu hệ thống

Xây dựng một nền tảng forum thảo luận trực tuyến tương tự VOZ Forum và Reddit, cho phép người dùng:

- Tạo và quản lý bài viết theo chủ đề
- Trao đổi, thảo luận thông qua hệ thống comments
- Tương tác xã hội (upvote/downvote, follow, save posts)
- Nhắn tin trực tiếp giữa các users
- Quản trị nội dung bởi admin/moderator

### 1.2. Phạm vi dự án

**Bao gồm:**

- Hệ thống đăng ký/đăng nhập (Email + Google OAuth)
- Quản lý bài viết với media (ảnh, video)
- Hệ thống comment nested (lồng nhau)
- Voting system (upvote/downvote)
- Social features (follow users, follow categories, save posts)
- Direct messaging (1-1 và group chat)
- Report và moderation system
- Admin dashboard với audit trail
- Notification system
- User profile với badge system

**Không bao gồm trong phạm vi hiện tại:**

- Tính năng AI (sẽ tích hợp sau): Toxic detection, Spam detection, Emotion analysis
- Payment/Premium features
- Mobile apps (chỉ responsive web)

### 1.3. Công nghệ sử dụng

**Frontend:**

- React.js (v18+)
- React Router (routing)
- Axios (HTTP client)
- TailwindCSS/Material-UI (styling)
- React Hook Form (forms)
- Socket.io-client (real-time)

**Backend:**

- Node.js + Express.js
- MongoDB (database)
- Mongoose (ODM)
- JWT (authentication)
- Bcrypt (password hashing)
- Cloudinary (media storage)
- Socket.io (WebSocket)

**Tools & DevOps:**

- Git/GitHub (version control)
- Postman (API testing)
- MongoDB Compass (database GUI)

---

## 2. PHÂN TÍCH YÊU CẦU HỆ THỐNG

### 2.1. Yêu cầu chức năng

#### 2.1.1. Quản lý người dùng

**UC-01: Đăng ký tài khoản**

- User có thể đăng ký bằng email/password
- User có thể đăng ký bằng Google OAuth
- Validation: username (3-30 ký tự), email valid, password mạnh
- Gửi email xác thực (optional)

**UC-02: Đăng nhập**

- Đăng nhập bằng email/password
- Đăng nhập bằng Google
- Remember me (session dài hạn)
- Forgot password flow

**UC-03: Quản lý profile**

- Xem và chỉnh sửa thông tin cá nhân (avatar, bio, location, website)
- Xem thống kê cá nhân (posts, comments, karma/điểm)
- Badge system tự động (Newbie, Người từng trải, Chuyên gia, Xem chùa)
- Cài đặt preferences (theme, notifications, privacy)

**UC-04: Follow/Unfollow users**

- Follow người dùng khác
- Xem danh sách followers/following
- Notification khi được follow
- Mute notifications từ user đang follow

**UC-05: Block users**

- Block người dùng không mong muốn
- Ẩn tất cả nội dung từ user bị block
- Quản lý danh sách blocked users

#### 2.1.2. Quản lý categories

**UC-06: Xem categories**

- Hiển thị danh sách categories
- Categories có thể có subcategories (hierarchy)
- Thống kê: số posts, số followers, last activity

**UC-07: Follow categories**

- Follow category để nhận updates
- Settings riêng cho mỗi category follow:
  - Notify on new post
  - Notify on hot post
  - Mute all

**UC-08: Quản trị categories (Admin only)**

- Tạo/sửa/xóa categories
- Thiết lập moderators cho category
- Cấu hình rules và settings
- Set min karma để post

#### 2.1.3. Quản lý bài viết

**UC-09: Tạo bài viết**

- Điều kiện: đăng ký ≥ 1 tiếng + ≥ 3 comments
- Nhập title (10-300 ký tự), content (20-50,000 ký tự)
- Upload ảnh/video (max 25MB)
- Chọn category
- Thêm tags
- Mention users (@username)
- Mark NSFW nếu cần

**UC-10: Xem bài viết**

- View bài viết với full content
- Xem comments (nested, sorted by best/new/top)
- Tăng view count
- Hiển thị author info, stats (upvotes, comments, views)

**UC-11: Tương tác với bài viết**

- Upvote/Downvote
- Comment
- Share
- Save to collection
- Report vi phạm

**UC-12: Sắp xếp và lọc posts**

- Sort by: Hot (Reddit algorithm), New, Top, Controversial
- Filter by: category, time range, tags
- Search full-text

**UC-13: Chỉnh sửa/Xóa bài viết**

- Edit: lưu edit history
- Delete: xóa vĩnh viễn (cascade delete comments, votes)

#### 2.1.4. Quản lý comments

**UC-14: Comment vào bài viết**

- Viết comment (1-10,000 ký tự)
- Upload ảnh trong comment
- Reply to comment (nested, max depth 10)
- Mention users

**UC-15: Tương tác với comments**

- Upvote/Downvote comment
- Reply to comment
- Report comment

**UC-16: Chỉnh sửa/Xóa comment**

- Edit comment: lưu history
- Delete comment:
  - Nếu có replies: soft delete (hiển thị "[Bình luận đã bị xóa]")
  - Nếu không có replies: hard delete

#### 2.1.5. Voting system

**UC-17: Vote cho posts/comments**

- Upvote/Downvote
- Change vote (upvote ↔ downvote)
- Remove vote
- Không cho phép duplicate vote

**UC-18: Karma tracking**

- Tính điểm cho author (upvotes - downvotes)
- Hiển thị trên profile
- Dùng cho badge system

#### 2.1.6. Save posts

**UC-19: Lưu bài viết**

- Save post vào collections/folders
- Tạo collections tùy chỉnh
- Thêm notes và tags riêng
- Xem danh sách saved posts

#### 2.1.7. Direct messaging

**UC-20: Nhắn tin 1-1**

- Gửi message cho user khác
- Hỗ trợ text, ảnh, files
- Reply/Quote message
- Edit/Delete message
- Read receipts

**UC-21: Group chat**

- Tạo group chat (≥ 2 người)
- Add/Remove members
- Group admins
- Mute conversation

**UC-22: Quản lý conversations**

- Xem danh sách conversations
- Mark as read
- Unread count tracking
- Search conversations

#### 2.1.8. Notifications

**UC-23: Nhận thông báo**

- Notification khi:
  - Có upvote trên post/comment
  - Có comment mới trên post
  - Có reply vào comment
  - Được mention
  - Được follow
  - Có tin nhắn mới
  - Post/Comment bị remove
  - Report được xử lý
- Mark as read/unread
- Delete notification
- Mark all as read

**UC-24: Cài đặt notifications**

- Bật/tắt từng loại notification
- Email notifications
- Push notifications

#### 2.1.9. Report và moderation

**UC-25: Report vi phạm**

- Report post/comment/user
- Chọn lý do (10 options: spam, harassment, hate speech, etc.)
- Mô tả chi tiết
- Không cho phép report duplicate

**UC-26: Xử lý reports (Moderator/Admin)**

- Xem danh sách reports
- Filter by: status, priority, type
- Accept report:
  - Warning
  - Remove content
  - Ban user (1 day, 7 days, 30 days, permanent)
- Reject report
- Thêm moderator notes

**UC-27: Auto-ban system**

- Auto-ban 1 day nếu ≥ 5 reports được accept
- Update badge thành "Người dùng bị hạn chế"

#### 2.1.10. Admin dashboard

**UC-28: Admin audit trail**

- Log tất cả admin/moderator actions
- Tracking:
  - Action type (25+ actions)
  - Target (post, comment, user, category)
  - Reason
  - Severity level
  - IP address + User Agent
- Revert actions
- Statistics và charts

**UC-29: User management**

- Xem danh sách users
- Ban/Unban users
- Promote to moderator
- View user activity

**UC-30: Content management**

- Moderate posts/comments
- Pin/Feature posts
- Lock posts (disable comments)
- Remove content

### 2.2. Yêu cầu phi chức năng

#### 2.2.1. Performance

- **Response time:** < 2s cho mọi request
- **Database queries:** Optimized với indexes
- **Pagination:** Limit 25-50 items/page
- **Caching:** Redis cho hot posts, categories
- **Real-time:** WebSocket cho notifications, messages

#### 2.2.2. Scalability

- **Database:** MongoDB sharding support
- **Load balancing:** Nginx reverse proxy
- **CDN:** Cloudinary cho static files
- **Horizontal scaling:** Stateless API design

#### 2.2.3. Security

- **Authentication:** JWT with refresh tokens
- **Password:** Bcrypt hashing (10 rounds)
- **Input validation:** Express-validator
- **XSS protection:** Sanitize inputs
- **CSRF protection:** CSRF tokens
- **Rate limiting:** Prevent brute force
- **HTTPS:** SSL/TLS encryption

#### 2.2.4. Usability

- **Responsive:** Mobile-first design
- **Accessibility:** WCAG 2.1 AA
- **Internationalization:** i18n support (Vietnamese)
- **User feedback:** Toast notifications
- **Error handling:** Meaningful error messages

#### 2.2.5. Reliability

- **Uptime:** 99.9% target
- **Backup:** Daily database backups
- **Error logging:** Winston logger
- **Monitoring:** Health checks
- **Recovery:** Disaster recovery plan

---

## 3. THIẾT KẾ KIẾN TRÚC HỆ THỐNG

### 3.1. Tổng quan kiến trúc

Hệ thống sử dụng kiến trúc **3-tier**: Presentation Layer, Business Logic Layer, Data Layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│                     React.js Frontend                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                        │
│                   Load Balancer + SSL/TLS                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Backend)                         │
│                    Node.js + Express.js                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Routes Layer                                            │ │
│  │  - authRoutes, userRoutes, postRoutes, etc.             │ │
│  └─────────────────────────┬────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐ │
│  │  Middleware Layer                                        │ │
│  │  - Authentication (JWT)                                  │ │
│  │  - Authorization (Role-based)                            │ │
│  │  - Validation (Express-validator)                        │ │
│  │  - Error Handler                                         │ │
│  └─────────────────────────┬────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐ │
│  │  Controllers Layer                                       │ │
│  │  - Business logic                                        │ │
│  │  - Request handling                                      │ │
│  │  - Response formatting                                   │ │
│  └─────────────────────────┬────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐ │
│  │  Models Layer (Mongoose)                                 │ │
│  │  - Schemas definition                                    │ │
│  │  - Business methods                                      │ │
│  │  - Hooks & Validations                                   │ │
│  └─────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   MongoDB        │  │   Cloudinary     │  │    Redis     │ │
│  │   (Primary DB)   │  │   (Media CDN)    │  │   (Cache)    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Future)                         │
│  - Google OAuth 2.0                                             │
│  - Email Service (SendGrid/Mailgun)                             │
│  - AI Services (Toxic Detection, Emotion Analysis)              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Design Patterns

#### 3.2.1. MVC (Model-View-Controller)

```
Model (Mongoose Schemas)
  ↓
Controller (Business Logic)
  ↓
View (JSON Response) → Frontend (React)
```

#### 3.2.2. Repository Pattern

- Models handle data access
- Controllers handle business logic
- Separation of concerns

#### 3.2.3. Middleware Pattern

```
Request → Auth Middleware → Validation → Controller → Response
```

#### 3.2.4. Observer Pattern

- WebSocket events for real-time updates
- Notification system
- Live updates

### 3.3. Luồng xử lý request cơ bản

```
1. Client gửi HTTP request
   ↓
2. NGINX forward request tới API server
   ↓
3. Express routes mapping
   ↓
4. Authentication middleware (JWT verify)
   ↓
5. Authorization middleware (check permissions)
   ↓
6. Validation middleware (input validation)
   ↓
7. Controller xử lý business logic
   ↓
8. Model tương tác với MongoDB
   ↓
9. Controller format response
   ↓
10. Response trả về client
```

### 3.4. Real-time architecture (WebSocket)

```
Client                    Socket.io Server              MongoDB
  │                              │                          │
  ├──── Connect ────────────────▶│                          │
  │                              │                          │
  │◀──── Socket ID ──────────────┤                          │
  │                              │                          │
  ├──── Join Room ──────────────▶│                          │
  │      (userId)                │                          │
  │                              │                          │
  │                              │◀───── New Event ─────────┤
  │                              │                          │
  │◀──── Emit Event ─────────────┤                          │
  │      (notification)          │                          │
  │                              │                          │
```

**Use cases for real-time:**

- New notification
- New message
- Live upvote/downvote count
- Online users status

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 4.1. Tổng quan

**Database:** MongoDB (NoSQL)  
**ODM:** Mongoose  
**Total Collections:** 13

### 4.2. Collections Schema

#### 4.2.1. Users Collection

**Chức năng:** Quản lý thông tin người dùng

**Fields chính:**

```javascript
{
  _id: ObjectId,
  username: String (unique, 3-30 chars),
  email: String (unique),
  password: String (hashed with bcrypt),
  googleId: String (optional, for OAuth),

  avatar: String (Cloudinary URL),
  bio: String (max 500 chars),
  location: String,
  website: String,

  stats: {
    postsCount: Number,
    commentsCount: Number,
    upvotesReceived: Number,
    downvotesReceived: Number,
    upvotesGiven: Number,
    downvotesGiven: Number,
    viewsReceived: Number,
    reportsReceived: Number,
    reportsAccepted: Number,
    followersCount: Number,
    followingCount: Number
  },

  badge: String [Newbie, Người từng trải, Chuyên gia, Xem chùa, Người dùng bị hạn chế],
  role: String [user, moderator, admin],

  restrictions: {
    canComment: Boolean,
    canPost: Boolean,
    bannedUntil: Date,
    banReason: String
  },

  blockedUsers: [ObjectId],

  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    notifyOnComment: Boolean,
    notifyOnUpvote: Boolean,
    notifyOnMention: Boolean,
    notifyOnFollow: Boolean,
    showEmail: Boolean,
    showOnlineStatus: Boolean,
    allowDirectMessages: Boolean,
    theme: String [light, dark, auto],
    language: String,
    showNSFW: Boolean,
    postsPerPage: Number
  },

  registeredAt: Date,
  lastLoginAt: Date,
  lastActivityAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- username (unique)
- email (unique)
- googleId (unique, sparse)
- stats.upvotesReceived (descending)
- registeredAt (descending)
- lastActivityAt (descending)

**Business Logic:**

- Badge auto-calculated based on stats
- canPost = true nếu: registered > 1h AND commentsCount >= 3
- Auto-ban 1 day nếu reportsAccepted >= 5

#### 4.2.2. Categories Collection

**Chức năng:** Quản lý chủ đề/danh mục

**Fields chính:**

```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (unique, auto-generated),
  description: String,

  icon: String,
  color: String (hex color),
  coverImage: String,

  parentCategory: ObjectId (ref: Category),

  stats: {
    postsCount: Number,
    commentsCount: Number,
    viewsCount: Number,
    followersCount: Number
  },

  settings: {
    isActive: Boolean,
    requireApproval: Boolean,
    allowImages: Boolean,
    allowVideos: Boolean,
    minKarmaToPost: Number
  },

  moderators: [ObjectId],
  rules: [{title, description}],
  displayOrder: Number,

  createdBy: ObjectId,
  lastPostAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Relationships:**

- Self-referencing: parentCategory → subcategories
- One-to-many: Category → Posts

#### 4.2.3. Posts Collection

**Chức năng:** Quản lý bài viết

**Fields chính:**

```javascript
{
  _id: ObjectId,
  title: String (10-300 chars),
  slug: String (unique, auto-generated),
  content: String (20-50000 chars),

  author: ObjectId (ref: User),
  category: ObjectId (ref: Category),

  media: {
    images: [{url, publicId, size, width, height}],
    videos: [{url, publicId, size, duration, thumbnailUrl}]
  },

  tags: [String],
  mentions: [ObjectId],

  stats: {
    upvotes: Number,
    downvotes: Number,
    commentsCount: Number,
    viewsCount: Number,
    sharesCount: Number
  },

  score: Number (for ranking),
  status: String [draft, published, pending_approval, removed, spam],

  isPinned: Boolean,
  isLocked: Boolean,
  isFeatured: Boolean,
  isNSFW: Boolean,
  allowComments: Boolean,

  removedBy: ObjectId,
  removedReason: String,

  lastActivityAt: Date,
  editedAt: Date,
  editHistory: [{editedBy, editedAt, changes}],

  createdAt: Date,
  updatedAt: Date
}
```

**Score Algorithm (Reddit Hot):**

```javascript
score = (upvotes - downvotes) / Math.pow(hoursAge + 2, 1.5);
```

#### 4.2.4. Comments Collection

**Chức năng:** Comments và replies (nested)

**Fields chính:**

```javascript
{
  _id: ObjectId,
  content: String (1-10000 chars),

  author: ObjectId (ref: User),
  post: ObjectId (ref: Post),
  parentComment: ObjectId (ref: Comment),

  depth: Number (0-10),

  images: [{url, publicId, size}],

  stats: {
    upvotes: Number,
    downvotes: Number,
    repliesCount: Number
  },

  score: Number,

  isDeleted: Boolean,
  deletedMessage: String,

  isEdited: Boolean,
  editHistory: [{content, editedAt}],

  createdAt: Date,
  updatedAt: Date
}
```

**Tree Structure:**

```
Comment (depth=0)
├── Reply 1 (depth=1)
│   ├── Reply 1.1 (depth=2)
│   └── Reply 1.2 (depth=2)
└── Reply 2 (depth=1)
```

#### 4.2.5. Votes Collection

**Chức năng:** Track upvotes/downvotes

**Fields chính:**

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  targetType: String [Post, Comment],
  targetId: ObjectId (refPath: targetType),
  voteType: String [upvote, downvote],

  createdAt: Date,
  updatedAt: Date
}
```

**Unique Constraint:** (user, targetType, targetId)

#### 4.2.6. Reports Collection

**Chức năng:** Quản lý reports

**Fields chính:**

```javascript
{
  _id: ObjectId,
  reporter: ObjectId (ref: User),

  targetType: String [Post, Comment, User],
  targetId: ObjectId (refPath: targetType),

  reason: String [spam, harassment, hate_speech, violence, ...],
  description: String,

  status: String [pending, reviewing, accepted, rejected, resolved],

  reviewedBy: ObjectId,
  reviewedAt: Date,

  action: String [none, warning, content_removed, user_banned_*],
  moderatorNotes: String,

  priority: String [low, medium, high, urgent],

  createdAt: Date,
  updatedAt: Date
}
```

#### 4.2.7. Notifications Collection

**Chức năng:** Hệ thống thông báo

**Fields chính:**

```javascript
{
  _id: ObjectId,
  recipient: ObjectId (ref: User),
  sender: ObjectId (ref: User),

  type: String [
    post_upvote, post_comment, post_mention,
    comment_upvote, comment_reply, comment_mention,
    user_followed,
    new_message,
    post_removed, comment_removed,
    user_banned, user_unbanned,
    report_accepted, report_rejected,
    welcome, badge_earned, achievement
  ],

  message: String,
  link: String,

  targetType: String,
  targetId: ObjectId,

  isRead: Boolean,
  readAt: Date,

  priority: String [low, normal, high, urgent],
  metadata: Mixed,

  createdAt: Date,
  updatedAt: Date
}
```

#### 4.2.8. Conversations Collection

**Chức năng:** Quản lý conversations (DM)

**Fields chính:**

```javascript
{
  _id: ObjectId,
  type: String [direct, group],

  name: String (for group),
  avatar: String (for group),

  participants: [{
    user: ObjectId,
    unreadCount: Number,
    lastReadAt: Date,
    isMuted: Boolean
  }],

  admins: [ObjectId],

  lastMessage: {
    content: String,
    sender: ObjectId,
    sentAt: Date
  },

  createdBy: ObjectId,
  lastActivityAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

#### 4.2.9. DirectMessages Collection

**Chức năng:** Tin nhắn trong conversations

**Fields chính:**

```javascript
{
  _id: ObjectId,
  conversation: ObjectId (ref: Conversation),
  sender: ObjectId (ref: User),

  type: String [text, image, file, system],
  content: String,

  attachments: [{type, url, filename, size}],
  replyTo: ObjectId (ref: DirectMessage),
  mentions: [ObjectId],

  readBy: [{user, readAt}],

  isEdited: Boolean,
  editHistory: [{content, editedAt}],

  isDeleted: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

#### 4.2.10. SavedPost Collection

**Chức năng:** Lưu bài viết yêu thích

**Fields chính:**

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  post: ObjectId (ref: Post),

  collection: String (folder name),
  notes: String,
  tags: [String],

  createdAt: Date,
  updatedAt: Date
}
```

**Unique Constraint:** (user, post)

#### 4.2.11. UserFollow Collection

**Chức năng:** Quan hệ follow giữa users

**Fields chính:**

```javascript
{
  _id: ObjectId,
  follower: ObjectId (ref: User),
  following: ObjectId (ref: User),

  metadata: {
    muteNotifications: Boolean
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Unique Constraint:** (follower, following)

#### 4.2.12. CategoryFollow Collection

**Chức năng:** Follow categories

**Fields chính:**

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  category: ObjectId (ref: Category),

  settings: {
    notifyOnNewPost: Boolean,
    notifyOnHotPost: Boolean,
    muteAll: Boolean
  },

  createdAt: Date,
  updatedAt: Date
}
```

#### 4.2.13. AdminLog Collection

**Chức năng:** Audit trail cho admin actions

**Fields chính:**

```javascript
{
  _id: ObjectId,
  admin: ObjectId (ref: User),

  action: String [ban_user, remove_post, accept_report, ...],

  targetType: String [User, Post, Comment, Category, Report],
  targetId: ObjectId,

  description: String,
  reason: String,
  metadata: Mixed,

  severity: String [low, medium, high, critical],

  ipAddress: String,
  userAgent: String,

  status: String [active, reverted, expired],

  createdAt: Date,
  updatedAt: Date
}
```

### 4.3. Relationships Diagram

```
User
  ├─> Post (author)
  ├─> Comment (author)
  ├─> Vote (user)
  ├─> Report (reporter)
  ├─> Notification (recipient, sender)
  ├─> DirectMessage (sender)
  ├─> SavedPost (user)
  ├─> UserFollow (follower, following)
  ├─> CategoryFollow (user)
  ├─> AdminLog (admin)
  └─> Conversation (participants)

Category
  ├─> Post (category)
  └─> CategoryFollow (category)

Post
  ├─> Comment (post)
  ├─> Vote (targetId)
  ├─> Report (targetId)
  └─> SavedPost (post)

Comment
  ├─> Comment (parentComment) - self-referencing
  ├─> Vote (targetId)
  └─> Report (targetId)

Conversation
  └─> DirectMessage (conversation)
```

### 4.4. Indexing Strategy

**Performance Indexes:**

- Unique indexes cho fields unique
- Compound indexes cho queries thường xuyên
- Text indexes cho full-text search
- TTL indexes cho auto-cleanup

**Total:** 95+ indexes across 13 collections

---

## 5. THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG

### 5.1. Sitemap

```
/ (Home)
├── /register
├── /login
├── /forgot-password
│
├── /c/:categorySlug (Category page)
│   └── /c/:categorySlug/:postSlug (Post detail)
│
├── /user/:username (User profile)
│   ├── /user/:username/posts
│   ├── /user/:username/comments
│   ├── /user/:username/saved
│   ├── /user/:username/followers
│   └── /user/:username/following
│
├── /settings (User settings)
│   ├── /settings/profile
│   ├── /settings/account
│   ├── /settings/notifications
│   └── /settings/privacy
│
├── /messages (Direct messages)
│   └── /messages/:conversationId
│
├── /notifications
│
├── /submit (Create post)
│
├── /search?q=... (Search results)
│
└── /admin (Admin dashboard)
    ├── /admin/users
    ├── /admin/posts
    ├── /admin/reports
    ├── /admin/categories
    └── /admin/logs
```

### 5.2. Layouts chính

#### 5.2.1. Main Layout

```
┌────────────────────────────────────────────────────────────┐
│                      HEADER                                │
│  [Logo] [Search]  [Notifications] [Messages] [User Menu]  │
├────────────────────────────────────────────────────────────┤
│ Sidebar    │              Main Content                     │
│            │                                                │
│ Categories │  Posts List / Post Detail / User Profile      │
│ Popular    │                                                │
│ Trending   │                                                │
│            │                                                │
│            │                                                │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│                      FOOTER                                │
│            About | Terms | Privacy | Contact               │
└────────────────────────────────────────────────────────────┘
```

#### 5.2.2. Home Page

**Components:**

- Header với search bar
- Sidebar với categories list
- Posts feed:
  - Sort tabs (Hot, New, Top)
  - Filter dropdown (time, category)
  - Post cards (thumbnail, title, stats, author)
  - Infinite scroll

**Post Card:**

```
┌─────────────────────────────────────────┐
│ ▲ 124  [Thumbnail]  Title of Post      │
│ ▼  23                                   │
│        Category • by Username • 2h ago  │
│        💬 45 comments  👁 1.2k views    │
└─────────────────────────────────────────┘
```

#### 5.2.3. Post Detail Page

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Category > Title                            │
│                                             │
│ [Post Content]                              │
│ - Rich text                                 │
│ - Images/Videos                             │
│ - Tags                                      │
│                                             │
│ ▲ Upvote   💬 Comment   💾 Save   ⚠ Report │
│                                             │
├─────────────────────────────────────────────┤
│ Comments (Sort by: Best ▼)                 │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Comment 1                           │   │
│ │ ▲ ▼  👤 Username • 1h ago          │   │
│ │                                     │   │
│ │ ┌───────────────────────────────┐ │   │
│ │ │ Reply 1.1                     │ │   │
│ │ │ ▲ ▼  👤 User2 • 30m ago      │ │   │
│ │ └───────────────────────────────┘ │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### 5.2.4. User Profile Page

**Tabs:**

- Overview (stats, badge, bio)
- Posts
- Comments
- Saved (chỉ owner)
- Followers
- Following

**Stats Section:**

```
┌─────────────────────────────────────────┐
│  [Avatar]  Username                     │
│            Badge: Chuyên gia            │
│            Karma: 1,234                 │
│            Joined: 2 years ago          │
│                                         │
│  📝 50 posts  💬 1.2k comments          │
│  👥 150 followers  125 following        │
│                                         │
│  [Follow] [Message] [•••]               │
└─────────────────────────────────────────┘
```

#### 5.2.5. Messages Page

```
┌─────────────────────────────────────────────┐
│ Conversations │ Chat                        │
│               │                             │
│ [Search]      │ ┌─────────────────────────┐│
│               │ │ User Name          [⋮]  ││
│ □ User1       │ └─────────────────────────┘│
│   Last msg... │                             │
│   2m ago      │ Message 1 (left)           │
│               │                             │
│ □ User2       │         Message 2 (right)  │
│   Last msg... │                             │
│   1h ago  [2] │ Message 3 (left)           │
│               │                             │
│ □ Group Chat  │                             │
│   Last msg... │ [Type message...]  [Send]  │
└─────────────────────────────────────────────┘
```

### 5.3. UI Components

**Core Components:**

1. PostCard
2. CommentItem (nested)
3. UserCard
4. CategoryCard
5. NotificationItem
6. MessageBubble
7. Modal
8. Toast
9. Dropdown
10. InfiniteScroll

**Form Components:**

1. RichTextEditor (Quill.js)
2. ImageUploader
3. TagsInput
4. SearchBar
5. FormInput
6. FormTextarea
7. FormSelect

**Navigation:**

1. Header
2. Sidebar
3. BottomNav (mobile)
4. Breadcrumb
5. Tabs

### 5.4. Responsive Design

**Breakpoints:**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**

- Collapsible sidebar
- Bottom navigation
- Simplified post cards
- Touch-friendly buttons
- Swipe gestures

---

## 6. THIẾT KẾ API VÀ ENDPOINTS

### 6.1. API Conventions

**Base URL:** `/api/v1`

**Response Format:**

```javascript
// Success
{
  success: true,
  data: {...} | [...],
  message: "Success message"
}

// Error
{
  success: false,
  error: {
    message: "Error message",
    code: "ERROR_CODE",
    details: {...}
  }
}

// Paginated
{
  success: true,
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 25,
    pages: 4
  }
}
```

**HTTP Status Codes:**

- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

### 6.2. Authentication Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/refresh-token
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email/:token
```

### 6.3. User Endpoints

```
GET    /api/users/:username
PUT    /api/users/:userId
DELETE /api/users/:userId

GET    /api/users/:userId/posts
GET    /api/users/:userId/comments
GET    /api/users/:userId/stats

POST   /api/users/:userId/follow
DELETE /api/users/:userId/unfollow
GET    /api/users/:userId/followers
GET    /api/users/:userId/following

POST   /api/users/:userId/block
DELETE /api/users/:userId/unblock
GET    /api/users/:userId/blocked

GET    /api/users/:userId/preferences
PUT    /api/users/:userId/preferences
```

### 6.4. Category Endpoints

```
GET    /api/categories
GET    /api/categories/:slug
POST   /api/categories (admin)
PUT    /api/categories/:categoryId (admin)
DELETE /api/categories/:categoryId (admin)

POST   /api/categories/:categoryId/follow
DELETE /api/categories/:categoryId/unfollow
GET    /api/categories/:categoryId/followers

PUT    /api/categories/:categoryId/follow/settings
```

### 6.5. Post Endpoints

```
GET    /api/posts
GET    /api/posts/:slug
POST   /api/posts
PUT    /api/posts/:postId
DELETE /api/posts/:postId

GET    /api/posts?sort=hot|new|top&category=&time=
GET    /api/posts/search?q=query

POST   /api/posts/:postId/views
```

### 6.6. Comment Endpoints

```
GET    /api/posts/:postId/comments
POST   /api/posts/:postId/comments
PUT    /api/comments/:commentId
DELETE /api/comments/:commentId

GET    /api/comments/:commentId/replies
POST   /api/comments/:commentId/reply
```

### 6.7. Vote Endpoints

```
POST   /api/votes/upvote
POST   /api/votes/downvote
DELETE /api/votes

GET    /api/users/:userId/votes
```

### 6.8. SavedPost Endpoints

```
POST   /api/users/:userId/saved
DELETE /api/users/:userId/saved/:postId
GET    /api/users/:userId/saved
GET    /api/users/:userId/saved/collections
```

### 6.9. Report Endpoints

```
POST   /api/reports
GET    /api/reports (moderator)
GET    /api/reports/:reportId (moderator)
PUT    /api/reports/:reportId/accept (moderator)
PUT    /api/reports/:reportId/reject (moderator)
```

### 6.10. Notification Endpoints

```
GET    /api/notifications
PUT    /api/notifications/:notificationId/read
PUT    /api/notifications/mark-all-read
DELETE /api/notifications/:notificationId
```

### 6.11. Message Endpoints

```
GET    /api/conversations
GET    /api/conversations/:conversationId
POST   /api/conversations (create DM)
POST   /api/conversations/group (create group)
DELETE /api/conversations/:conversationId

GET    /api/conversations/:conversationId/messages
POST   /api/conversations/:conversationId/messages
PUT    /api/messages/:messageId
DELETE /api/messages/:messageId

PUT    /api/conversations/:conversationId/read
```

### 6.12. Admin Endpoints

```
GET    /api/admin/users
PUT    /api/admin/users/:userId/ban
PUT    /api/admin/users/:userId/unban
PUT    /api/admin/users/:userId/promote
PUT    /api/admin/users/:userId/demote

GET    /api/admin/posts
PUT    /api/admin/posts/:postId/pin
PUT    /api/admin/posts/:postId/feature
DELETE /api/admin/posts/:postId

GET    /api/admin/logs
GET    /api/admin/logs/:logId
POST   /api/admin/logs/:logId/revert
GET    /api/admin/logs/statistics
```

### 6.13. Upload Endpoints

```
POST   /api/upload/image
POST   /api/upload/video
POST   /api/upload/file
DELETE /api/upload/:publicId
```

---

## 7. CÁC USE CASE CHÍNH

### 7.1. UC-01: Đăng ký tài khoản

**Actor:** Guest User

**Pre-conditions:** User chưa có tài khoản

**Flow:**

1. User truy cập trang đăng ký
2. User nhập thông tin:
   - Username (3-30 ký tự, unique)
   - Email (valid format, unique)
   - Password (min 8 ký tự, có chữ hoa, số, ký tự đặc biệt)
3. System validate input
4. System hash password với bcrypt
5. System tạo user record trong database
6. System generate JWT token
7. System trả về token và user info
8. Frontend lưu token vào localStorage
9. Redirect user đến home page

**Alternative Flow:**

- 3a. Validation lỗi → hiển thị error messages
- 3b. Username/Email đã tồn tại → thông báo lỗi
- OAuth: User chọn "Sign up with Google" → redirect to Google → callback với token

**Post-conditions:** User được tạo với role=user, canPost=false

### 7.2. UC-02: Tạo bài viết

**Actor:** Registered User

**Pre-conditions:**

- User đã đăng nhập
- User đã đăng ký ≥ 1 tiếng
- User đã comment ≥ 3 lần

**Flow:**

1. User click "Create Post"
2. System kiểm tra điều kiện:
   - `user.canCreatePost()` → {allowed: true}
3. System hiển thị form tạo post
4. User nhập:
   - Title (10-300 chars)
   - Content (20-50,000 chars, rich text)
   - Category (select)
   - Tags (optional)
   - Media (optional, max 25MB)
   - NSFW checkbox (optional)
5. User click "Submit"
6. System validate input
7. System upload media to Cloudinary (if any)
8. System create post record
9. System increment:
   - `user.stats.postsCount++`
   - `category.stats.postsCount++`
10. System update `user.badge()` if needed
11. System notify category followers
12. System redirect to post detail page

**Alternative Flow:**

- 2a. Điều kiện không đủ → hiển thị thông báo yêu cầu
- 6a. Validation lỗi → hiển thị errors
- 7a. Upload lỗi → thông báo lỗi
- Draft: User click "Save Draft" → status=draft

**Post-conditions:** Post được tạo với status=published

### 7.3. UC-03: Comment vào bài viết

**Actor:** Registered User

**Pre-conditions:**

- User đã đăng nhập
- User không bị ban
- Post cho phép comments (allowComments=true)

**Flow:**

1. User mở post detail
2. User scroll đến comment section
3. User nhập comment (1-10,000 chars)
4. User có thể:
   - Upload ảnh
   - Mention users (@username)
5. User click "Comment"
6. System validate:
   - `user.canCreateComment()` → {allowed: true}
   - Content length
7. System create comment record
8. System increment:
   - `post.stats.commentsCount++`
   - `user.stats.commentsCount++`
   - `category.stats.commentsCount++`
9. System update:
   - `post.lastActivityAt`
   - `user.badge()` if needed
10. System create notification:
    - For post author (if not self)
    - For mentioned users
11. System hiển thị comment mới

**Reply Flow:**

- User click "Reply" trên comment
- System check depth < 10
- System create comment với `parentComment` set
- System increment `parentComment.stats.repliesCount++`
- System notify parent comment author

**Post-conditions:** Comment được tạo, stats updated

### 7.4. UC-04: Upvote bài viết

**Actor:** Registered User

**Pre-conditions:** User đã đăng nhập

**Flow:**

1. User click upvote button trên post
2. System check existing vote:
   - Case 1: Chưa vote → create upvote
   - Case 2: Đã upvote → remove upvote
   - Case 3: Đã downvote → change to upvote
3. System update:
   - `post.stats.upvotes` (+1 hoặc -1)
   - `post.score` (recalculate)
   - `author.stats.upvotesReceived` (+1 hoặc -1)
   - `user.stats.upvotesGiven` (+1 hoặc -1)
4. System create/update/delete vote record
5. System update UI (button state, count)
6. System create notification for author (if upvote)

**Alternative Flow:**

- Same logic for downvote
- Same logic for comment vote

**Post-conditions:** Vote record updated, stats updated

### 7.5. UC-05: Follow user

**Actor:** Registered User

**Pre-conditions:**

- User đã đăng nhập
- Target user khác current user

**Flow:**

1. User visit target user profile
2. User click "Follow" button
3. System validate: follower ≠ following
4. System check existing follow:
   - Nếu đã follow → unfollow
   - Nếu chưa → follow
5. System create UserFollow record
6. System increment:
   - `follower.stats.followingCount++`
   - `following.stats.followersCount++`
7. System create notification for target user
8. System update UI

**Alternative Flow:**

- Unfollow: Delete UserFollow, decrement counts

**Post-conditions:** Follow relationship created

### 7.6. UC-06: Gửi tin nhắn

**Actor:** Registered User

**Pre-conditions:**

- User đã đăng nhập
- Target user cho phép DM (preferences.allowDirectMessages=true)
- Target user không block current user

**Flow:**

1. User click "Message" on target user profile
2. System tìm hoặc tạo conversation:
   - `Conversation.findOrCreateDirectConversation(user1, user2)`
3. System mở conversation
4. User nhập message
5. User có thể:
   - Attach files
   - Mention users
   - Reply to message
6. User click "Send"
7. System create DirectMessage record
8. System update:
   - `conversation.lastMessage`
   - `conversation.lastActivityAt`
   - Increment unread count cho recipient
9. System create notification for recipient
10. System emit WebSocket event
11. Recipient nhận real-time update

**Post-conditions:** Message gửi thành công

### 7.7. UC-07: Report vi phạm

**Actor:** Registered User

**Pre-conditions:** User đã đăng nhập

**Flow:**

1. User click "Report" trên post/comment/user
2. System hiển thị report form
3. User chọn reason:
   - Spam
   - Harassment
   - Hate speech
   - Violence
   - Sexual content
   - Misinformation
   - Copyright
   - Personal information
   - Self harm
   - Other
4. User nhập description (optional)
5. User click "Submit Report"
6. System validate:
   - Check duplicate (user chỉ report 1 lần cho 1 target)
7. System create Report record
8. System calculate priority:
   - Count reports cho target
   - Set priority (low/medium/high/urgent)
9. System notify moderators nếu high/urgent
10. System increment `target.author.stats.reportsReceived`
11. System hiển thị success message

**Post-conditions:** Report được tạo với status=pending

### 7.8. UC-08: Moderator xử lý report

**Actor:** Moderator/Admin

**Pre-conditions:**

- User có role=moderator hoặc admin
- Report tồn tại với status=pending

**Flow:**

1. Moderator mở admin dashboard
2. Moderator xem danh sách reports
3. Moderator filter/sort reports
4. Moderator click vào report để xem chi tiết
5. Moderator review target content
6. Moderator quyết định:
   - **Accept:**
     - Chọn action:
       - Warning
       - Remove content
       - Ban user 1/7/30 days or permanent
     - Nhập moderator notes
     - Click "Accept Report"
     - System execute action
     - System update target author stats
     - System check auto-ban (if ≥ 5 accepted)
     - System create AdminLog
     - System create notification for reporter & target
   - **Reject:**
     - Nhập moderator notes
     - Click "Reject Report"
     - System update report status
     - System create notification for reporter
7. System hiển thị updated report list

**Post-conditions:** Report processed, action executed

---

## 8. SƠ ĐỒ HOẠT ĐỘNG

### 8.1. Sequence Diagram: Đăng nhập

```
User          Frontend        Backend         Database        JWT
 │               │               │               │             │
 ├──Login Form──▶│               │               │             │
 │               ├──POST /login─▶│               │             │
 │               │               ├──Find User───▶│             │
 │               │               │◀──User Data───┤             │
 │               │               ├──Compare PWD──┤             │
 │               │               │               │             │
 │               │               ├──Generate────────────────▶│
 │               │               │◀─────Token────────────────┤
 │               │               ├──Update────────▶│          │
 │               │               │   lastLoginAt   │          │
 │               │◀─────Token───┤                 │          │
 │               │     +User     │                 │          │
 │               ├─Save Token───┤                 │          │
 │               │  localStorage │                 │          │
 │◀──Redirect────┤               │                 │          │
 │   to Home     │               │                 │          │
```

### 8.2. Activity Diagram: Tạo bài viết

```
[Start]
   │
   ▼
[User clicks "Create Post"]
   │
   ▼
<Check permissions>
   │
   ├─(Not allowed)──▶[Show error message]──▶[End]
   │
   ├─(Allowed)
   │
   ▼
[Display post form]
   │
   ▼
[User fills form]
   │
   ▼
<Upload media?>
   │
   ├─(Yes)──▶[Upload to Cloudinary]
   │             │
   │             ▼
   │          <Success?>
   │             │
   │             ├─(No)──▶[Show error]──▶[End]
   │             │
   │             ▼
   │          [Get media URLs]
   │             │
   ├─────────────┘
   │
   ▼
[Validate input]
   │
   ├─(Invalid)──▶[Show validation errors]──▶[Back to form]
   │
   ▼
[Create post in DB]
   │
   ▼
[Update user stats]
   │
   ▼
[Update category stats]
   │
   ▼
[Update user badge if needed]
   │
   ▼
[Notify category followers]
   │
   ▼
[Redirect to post detail]
   │
   ▼
[End]
```

### 8.3. State Diagram: Post Status

```
          ┌──────────┐
  [New]──▶│  DRAFT   │◀────┐
          └────┬─────┘     │
               │            │
               │ publish    │ save draft
               ▼            │
          ┌──────────┐     │
          │PUBLISHED │─────┘
          └────┬─────┘
               │
               ├──────────┐
               │          │
               │ remove   │ moderate
               ▼          ▼
          ┌─────────┐  ┌───────────────┐
          │ REMOVED │  │PENDING_APPROVAL│
          └─────────┘  └───────┬───────┘
                               │
                               │ approve
                               ▼
                          ┌──────────┐
                          │PUBLISHED │
                          └──────────┘
```

### 8.4. State Diagram: Report Status

```
          ┌─────────┐
  [New]──▶│ PENDING │
          └────┬────┘
               │
               │ moderator review
               ▼
          ┌──────────┐
          │REVIEWING │
          └────┬─────┘
               │
        ┌──────┴──────┐
        │             │
        │ accept      │ reject
        ▼             ▼
   ┌─────────┐   ┌─────────┐
   │ACCEPTED │   │REJECTED │
   └────┬────┘   └────┬────┘
        │             │
        │ execute     │
        ▼             │
   ┌─────────┐       │
   │RESOLVED │◀──────┘
   └─────────┘
```

### 8.5. Component Diagram: Frontend

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                    │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Pages                                         │   │
│  │  - HomePage                                    │   │
│  │  - PostDetailPage                              │   │
│  │  - UserProfilePage                             │   │
│  │  - MessagesPage                                │   │
│  │  - SettingsPage                                │   │
│  │  - AdminDashboard                              │   │
│  └─────────────────┬──────────────────────────────┘   │
│                    │                                    │
│  ┌─────────────────▼──────────────────────────────┐   │
│  │  Components                                    │   │
│  │  - PostCard, CommentItem                       │   │
│  │  - UserCard, Header                            │   │
│  │  - Modals, Toasts                              │   │
│  │  - Forms, Inputs                               │   │
│  └─────────────────┬──────────────────────────────┘   │
│                    │                                    │
│  ┌─────────────────▼──────────────────────────────┐   │
│  │  Services/API                                  │   │
│  │  - authService                                 │   │
│  │  - postService                                 │   │
│  │  - userService                                 │   │
│  │  - messageService                              │   │
│  │  - axios instance                              │   │
│  └─────────────────┬──────────────────────────────┘   │
│                    │                                    │
│  ┌─────────────────▼──────────────────────────────┐   │
│  │  State Management (Context/Redux)              │   │
│  │  - AuthContext                                 │   │
│  │  - NotificationContext                         │   │
│  │  - SocketContext                               │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
                  ┌────────────────┐
                  │  Backend API   │
                  └────────────────┘
```

---

## 9. BẢO MẬT VÀ PHÂN QUYỀN

### 9.1. Authentication

**JWT (JSON Web Token):**

```javascript
// Token structure
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "...",
    username: "...",
    role: "user",
    iat: 1234567890,
    exp: 1234567890
  },
  signature: "..."
}
```

**Token Strategy:**

- Access Token: 15 phút (lưu trong memory)
- Refresh Token: 7 ngày (lưu trong httpOnly cookie)
- Auto refresh khi access token hết hạn

**Password Security:**

- Bcrypt hashing (10 salt rounds)
- Min 8 characters
- Require: uppercase, number, special char
- Password never exposed in API responses

### 9.2. Authorization (RBAC)

**Roles:**

1. **User (default):**

   - Create posts (if eligible)
   - Create comments
   - Vote
   - Follow users/categories
   - Send messages
   - Report violations

2. **Moderator:**

   - All user permissions
   - Review reports
   - Remove content
   - Ban users (temporary)
   - Access moderation dashboard

3. **Admin:**
   - All moderator permissions
   - User management
   - Category management
   - Permanent bans
   - System configuration
   - View admin logs

**Permission Middleware:**

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }
    next();
  };
};

// Usage
router.delete(
  "/posts/:id",
  authenticate,
  authorize("moderator", "admin"),
  deletePost
);
```

### 9.3. Input Validation & Sanitization

**Express Validator:**

```javascript
const validatePost = [
  body("title").trim().isLength({ min: 10, max: 300 }).escape(),
  body("content").trim().isLength({ min: 20, max: 50000 }),
  body("categoryId").isMongoId(),
  // ...
];
```

**XSS Protection:**

- Sanitize user inputs
- Escape HTML entities
- Content Security Policy headers

### 9.4. CSRF Protection

```javascript
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);
```

### 9.5. Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// Login rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  message: "Too many login attempts",
});

// API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### 9.6. File Upload Security

**Cloudinary:**

- File type validation (images: jpg, png, gif; videos: mp4, webm)
- File size limit (max 25MB)
- Virus scanning
- Malware detection

**Validation:**

```javascript
const validateImage = (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  const maxSize = 25 * 1024 * 1024; // 25MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }

  if (file.size > maxSize) {
    throw new Error("File too large");
  }
};
```

### 9.7. Database Security

**MongoDB:**

- Authentication enabled
- Role-based access control
- SSL/TLS connection
- Regular backups
- No exposed ports

**Mongoose:**

- Input sanitization (mongo-sanitize)
- Query injection prevention
- Schema validation

### 9.8. Privacy & Data Protection

**User Data:**

- Email không hiển thị public (trừ khi user cho phép)
- Password never stored in plain text
- Sensitive data encrypted
- GDPR compliance: user có thể xóa data

**Blocked Users:**

- Ẩn tất cả content từ blocked users
- Không thể message blocked users
- Không thể tag blocked users

---

## 10. KẾT LUẬN

### 10.1. Tóm tắt

Hệ thống Forum Thảo Luận được thiết kế với:

- **Kiến trúc:** 3-tier architecture (Presentation, Business Logic, Data)
- **Công nghệ:** MERN stack (MongoDB, Express, React, Node.js)
- **Database:** 13 collections với quan hệ rõ ràng
- **Tính năng:** 30+ use cases covering social forum functionalities
- **Bảo mật:** JWT authentication, RBAC, input validation, rate limiting

### 10.2. Điểm mạnh của thiết kế

1. **Scalability:**

   - Stateless API
   - MongoDB sharding support
   - CDN for static files
   - Caching strategy

2. **Performance:**

   - 95+ optimized indexes
   - Efficient query patterns
   - Pagination
   - Real-time với WebSocket

3. **Maintainability:**

   - Clean code structure (MVC)
   - Mongoose schemas with validation
   - Comprehensive error handling
   - Admin audit trail

4. **Security:**

   - Multi-layer security
   - JWT + Bcrypt
   - Input sanitization
   - Rate limiting

5. **User Experience:**
   - Intuitive UI
   - Real-time updates
   - Responsive design
   - Rich features

### 10.3. Roadmap (Future Enhancements)

**Phase 1 (Current):** Core forum features ✅

**Phase 2 (AI Integration):**

- Toxic content detection
- Spam detection
- Emotion analysis
- Auto-moderation

**Phase 3 (Advanced Features):**

- Advanced search with Elasticsearch
- Recommendation system
- Gamification (achievements, levels)
- Premium features

**Phase 4 (Scale):**

- Mobile apps (React Native)
- Microservices architecture
- CDN optimization
- Performance monitoring

### 10.4. Kết luận

Thiết kế hệ thống đã đầy đủ để triển khai một forum thảo luận chuyên nghiệp với:

- Tính năng phong phú (30+ use cases)
- Database hoàn chỉnh (13 collections, 95+ indexes)
- Bảo mật tốt (multi-layer security)
- Khả năng mở rộng cao
- Code maintainable và scalable

Hệ thống sẵn sàng cho việc implement và có thể scale lên hàng triệu users.

---

**HẾT PHẦN PHÂN TÍCH THIẾT KẾ**
