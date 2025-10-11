# Database Design - Forum Thảo Luận

## Overview

Database: **MongoDB**  
Architecture: **Document-based NoSQL**

---

## Collections & Schemas

### 1. Users Collection

**Purpose:** Quản lý thông tin người dùng

```javascript
{
  _id: ObjectId,

  // Authentication
  username: String (unique, 3-30 chars),
  email: String (unique),
  password: String (hashed),
  googleId: String (unique, optional),

  // Profile
  avatar: String (Cloudinary URL),
  bio: String (max 500 chars),
  location: String,
  website: String,

  // Statistics
  stats: {
    postsCount: Number (default 0),
    commentsCount: Number (default 0),
    upvotesReceived: Number (default 0),
    downvotesReceived: Number (default 0),
    upvotesGiven: Number (default 0),
    downvotesGiven: Number (default 0),
    viewsReceived: Number (default 0),
    reportsReceived: Number (default 0),
    reportsAccepted: Number (default 0)
  },

  // Badge
  badge: String [Newbie, Người từng trải, Chuyên gia, Xem chùa],

  // Role
  role: String [user, moderator, admin],

  // Restrictions
  restrictions: {
    canComment: Boolean (default true),
    canPost: Boolean (default false),
    bannedUntil: Date (null if not banned),
    banReason: String
  },

  // Tracking
  registeredAt: Date,
  lastLoginAt: Date,

  // Verification
  isVerified: Boolean,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `username` (unique)
- `email` (unique)
- `googleId` (unique, sparse)
- `stats.upvotesReceived` (descending)
- `registeredAt` (descending)

**Business Logic:**

- Badge auto-calculated based on stats
- `canPost = true` if registered > 1 hour AND commentsCount >= 3
- Ban user for 1 day if reportsAccepted >= 5

---

### 2. Categories Collection

**Purpose:** Quản lý các chủ đề/danh mục

```javascript
{
  _id: ObjectId,

  name: String (unique, max 100 chars),
  slug: String (unique, auto-generated),
  description: String (max 500 chars),

  // UI
  icon: String (icon name),
  color: String (hex color),
  coverImage: String (Cloudinary URL),

  // Hierarchy
  parentCategory: ObjectId (ref: Category, null if root),

  // Statistics
  stats: {
    postsCount: Number (default 0),
    commentsCount: Number (default 0),
    viewsCount: Number (default 0),
    followersCount: Number (default 0)
  },

  // Settings
  settings: {
    isActive: Boolean (default true),
    requireApproval: Boolean (default false),
    allowImages: Boolean (default true),
    allowVideos: Boolean (default true),
    minKarmaToPost: Number (default 0)
  },

  // Moderators
  moderators: [ObjectId] (ref: User),

  // Rules
  rules: [{
    title: String,
    description: String
  }],

  displayOrder: Number (default 0),

  // Tracking
  createdBy: ObjectId (ref: User),
  lastPostAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `slug` (unique)
- `parentCategory`
- `displayOrder`
- `stats.postsCount` (descending)
- `createdAt` (descending)

**Relationships:**

- Self-referencing: parentCategory → subcategories
- One-to-many: Category → Posts

---

### 3. Posts Collection

**Purpose:** Quản lý bài viết

```javascript
{
  _id: ObjectId,

  title: String (10-300 chars),
  slug: String (unique, auto-generated),
  content: String (20-50000 chars, rich text),

  // Relations
  author: ObjectId (ref: User),
  category: ObjectId (ref: Category),

  // Media
  media: {
    images: [{
      url: String,
      publicId: String,
      size: Number,
      width: Number,
      height: Number,
      uploadedAt: Date
    }],
    videos: [{
      url: String,
      publicId: String,
      size: Number (max 25MB),
      duration: Number,
      thumbnailUrl: String,
      uploadedAt: Date
    }]
  },

  // Tags
  tags: [String],

  // Statistics
  stats: {
    upvotes: Number (default 0),
    downvotes: Number (default 0),
    commentsCount: Number (default 0),
    viewsCount: Number (default 0),
    sharesCount: Number (default 0)
  },

  // Score (for ranking)
  score: Number (indexed),

  // Status
  status: String [draft, published, pending_approval, removed, spam],

  // AI Analysis
  aiAnalysis: {
    isToxic: Boolean (default false),
    toxicScore: Number (0-1),
    isSpam: Boolean (default false),
    spamScore: Number (0-1),
    analyzedAt: Date
  },

  // Moderation
  isPinned: Boolean (default false),
  isLocked: Boolean (default false),
  isFeatured: Boolean (default false),
  removedBy: ObjectId (ref: User),
  removedReason: String,
  removedAt: Date,

  // Tracking
  lastActivityAt: Date,
  editedAt: Date,

  // Edit History
  editHistory: [{
    editedBy: ObjectId (ref: User),
    editedAt: Date,
    changes: String
  }],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `slug` (unique)
- `author, createdAt` (compound, descending)
- `category, createdAt` (compound, descending)
- `score` (descending) - for hot posts
- `stats.upvotes` (descending) - for top posts
- `createdAt` (descending) - for new posts
- `status`
- `tags`
- `aiAnalysis.isToxic`
- Text index: `title, content, tags`

**Score Calculation:**

```javascript
// Hot score (Reddit algorithm)
score = (netVotes / (hoursAge + 2)) ^ 1.5;

// Controversial score
controversialScore = min(upvotes, downvotes) * totalVotes;
```

---

### 4. Comments Collection

**Purpose:** Quản lý comments và replies

```javascript
{
  _id: ObjectId,

  content: String (1-10000 chars),

  // Relations
  author: ObjectId (ref: User),
  post: ObjectId (ref: Post),
  parentComment: ObjectId (ref: Comment, null if top-level),

  // Nesting
  depth: Number (0-10),

  // Media
  images: [{
    url: String,
    publicId: String,
    size: Number,
    uploadedAt: Date
  }],

  // Statistics
  stats: {
    upvotes: Number (default 0),
    downvotes: Number (default 0),
    repliesCount: Number (default 0)
  },

  score: Number,

  // AI - Emotion Detection
  emotion: {
    label: String [joy, sadness, anger, fear, surprise, neutral, love, disgust],
    confidence: Number (0-1),
    analyzedAt: Date
  },

  // AI - Toxic Detection
  aiAnalysis: {
    isToxic: Boolean (default false),
    toxicScore: Number (0-1),
    analyzedAt: Date
  },

  // Soft Delete
  isDeleted: Boolean (default false),
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),
  deletedMessage: String (default "[Bình luận này đã bị xóa]"),

  // Edit
  isEdited: Boolean (default false),
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: Date
  }],

  // Moderation
  isRemoved: Boolean (default false),
  removedBy: ObjectId (ref: User),
  removedReason: String,
  removedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `post, createdAt` (compound)
- `author, createdAt` (compound, descending)
- `parentComment`
- `score` (descending)
- `stats.upvotes` (descending)
- `isDeleted`
- `emotion.label`

**Tree Structure:**

```
Comment (depth=0)
├── Reply 1 (depth=1)
│   ├── Reply 1.1 (depth=2)
│   └── Reply 1.2 (depth=2)
└── Reply 2 (depth=1)
```

---

### 5. Votes Collection

**Purpose:** Tracking upvotes/downvotes

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

**Indexes:**

- `user, targetType, targetId` (compound, unique) - prevent duplicate votes
- `user, createdAt` (compound, descending)
- `targetType, targetId` (compound)

**Business Logic:**

- One user can only vote once per target
- Can change vote (upvote ↔ downvote)
- Can remove vote

---

### 6. Reports Collection

**Purpose:** Quản lý reports và moderation

```javascript
{
  _id: ObjectId,

  // Reporter
  reporter: ObjectId (ref: User),

  // Target
  targetType: String [Post, Comment, User],
  targetId: ObjectId (refPath: targetType),

  // Reason
  reason: String [
    spam,
    harassment,
    hate_speech,
    violence,
    sexual_content,
    misinformation,
    copyright,
    personal_information,
    self_harm,
    other
  ],
  description: String (max 1000 chars),

  // Status
  status: String [pending, reviewing, accepted, rejected, resolved],

  // Review
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,

  // Action
  action: String [
    none,
    warning,
    content_removed,
    user_banned_1day,
    user_banned_7days,
    user_banned_30days,
    user_banned_permanent
  ],

  moderatorNotes: String (max 2000 chars),

  // Priority
  priority: String [low, medium, high, urgent],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `reporter, createdAt` (compound, descending)
- `targetType, targetId` (compound)
- `status, createdAt` (compound)
- `reviewedBy`
- `priority, createdAt` (compound)
- `reporter, targetType, targetId` (compound, unique) - prevent duplicate reports

**Priority Calculation:**

- 1 report: low
- 2-4 reports: medium
- 5-9 reports: high
- 10+ reports: urgent

---

### 7. Notifications Collection

**Purpose:** Quản lý thông báo cho users - Real-time ready với WebSocket

```javascript
{
  _id: ObjectId,

  // Người nhận
  recipient: ObjectId (ref: User, indexed),

  // Người gửi (null nếu từ system)
  sender: ObjectId (ref: User),

  // Loại thông báo
  type: String [
    post_upvote, post_comment, post_mention,
    comment_upvote, comment_reply, comment_mention,
    new_message,
    post_removed, comment_removed,
    user_banned, user_unbanned,
    report_accepted, report_rejected,
    welcome, badge_earned, achievement, system_announcement
  ],

  title: String (max 200 chars),
  message: String (max 500 chars, required),

  // Target reference
  targetType: String [Post, Comment, DirectMessage, User, null],
  targetId: ObjectId (refPath: targetType),

  link: String (URL to navigate),

  // Status
  isRead: Boolean (default false, indexed),
  readAt: Date,

  // ✨ NEW: Priority
  priority: String [low, normal, high, urgent] (default: normal),

  metadata: Mixed (custom data),

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `recipient, createdAt` (compound, descending)
- `recipient, isRead, createdAt` (compound)
- ✨ `targetType, targetId` (compound) - Query notifications theo target
- ✨ `type, recipient` (compound) - Filter theo type

**Methods:**

- `markAsRead()` - Đánh dấu đã đọc
- `createNotification(data)` - Static method tạo notification (support priority)
- `markAllAsRead(userId)` - Đánh dấu tất cả đã đọc
- `deleteOldNotifications(days)` - Xóa notifications cũ (background job)

**Features:**

- Support priority để sort notifications quan trọng
- Ready for WebSocket emit (real-time)
- Auto cleanup old notifications

---

### 8. Conversations Collection

**Purpose:** Quản lý conversations (direct messages) - Support 1-1 và group chat

```javascript
{
  _id: ObjectId,

  // Loại
  type: String [direct, group],

  // Group info (nếu là group)
  name: String (max 100 chars),
  avatar: String (URL),

  // Participants
  participants: [{
    user: ObjectId (ref: User, required),
    unreadCount: Number (default 0),
    lastReadAt: Date,
    isMuted: Boolean (default false),
    joinedAt: Date
  }],

  // Admins (cho group)
  admins: [ObjectId] (ref: User),

  // Last message preview
  lastMessage: {
    content: String,
    sender: ObjectId (ref: User),
    sentAt: Date
  },

  // Settings
  settings: {
    whoCanMessage: String [all, admins_only]
  },

  // ✨ NEW: Track người tạo
  createdBy: ObjectId (ref: User),

  lastActivityAt: Date,
  isDeleted: Boolean (default false),

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `participants.user, lastActivityAt` (compound, descending)
- `lastActivityAt` (descending)
- `isDeleted` (ascending)

**Methods:**

- `addParticipant(userId, addedBy)` - Thêm thành viên (tạo system message)
- `removeParticipant(userId, removedBy)` - Xóa thành viên (tạo system message)
- `updateLastMessage(message)` - Update preview
- `incrementUnreadCount(senderId)` - Tăng unread cho tất cả trừ sender (✨ OPTIMIZED with for...of)
- `markAsRead(userId)` - Reset unread count

**Static Methods:**

- `findOrCreateDirectConversation(user1Id, user2Id)` - Tìm hoặc tạo 1-1 chat
- `createGroupConversation(data)` - Tạo group chat (✨ WITH VALIDATION: min 2 users, ensure createdBy in participants)

**Business Logic:**

- Group phải có ít nhất 2 người
- Người tạo (createdBy) tự động là admin
- Người tạo phải có trong participants

---

### 9. DirectMessages Collection

**Purpose:** Quản lý tin nhắn trong conversations - Support text, ảnh, file, @mention

```javascript
{
  _id: ObjectId,

  conversation: ObjectId (ref: Conversation, required, indexed),
  sender: ObjectId (ref: User, required),

  // Loại
  type: String [text, image, file, system],

  content: String (max 5000 chars),

  // Attachments
  attachments: [{
    type: String [image, file],
    url: String,
    publicId: String,
    filename: String,
    size: Number,
    mimeType: String
  }],

  // Reply to (quote)
  replyTo: ObjectId (ref: DirectMessage),

  // ✨ NEW: Mentions (@username)
  mentions: [ObjectId] (ref: User),

  // AI Analysis
  aiAnalysis: {
    isToxic: Boolean (default false),
    toxicScore: Number (0-1),
    analyzedAt: Date
  },

  // Read status
  readBy: [{
    user: ObjectId (ref: User),
    readAt: Date
  }],

  // Edit
  isEdited: Boolean (default false),
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: Date
  }],

  // Delete
  isDeleted: Boolean (default false),
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `conversation, createdAt` (compound, descending)
- `sender, createdAt` (compound, descending)
- ✨ `replyTo` (ascending) - Query replies nhanh
- ✨ `conversation, isDeleted, createdAt` (compound) - Filter messages chưa xóa

**Methods:**

- `markAsRead(userId)` - Đánh dấu đã đọc
- `softDelete(userId)` - Xóa message (clear content & attachments)
- `editMessage(newContent)` - Sửa message (save to history)

**Post-save Hook (✨ OPTIMIZED):**

- Auto update conversation lastMessage
- Auto increment unread count
- ✨ **Batch insert notifications** (insertMany thay vì loop) - **10-25x faster!**
- Ready for WebSocket emit (real-time)

**Performance:**

- Gửi message cho 10 người: ~50ms (before: ~500ms)
- Gửi message cho 100 người: ~200ms (before: ~5s)

---

## Relationships

### One-to-Many

- User → Posts
- User → Comments
- User → Votes
- User → Reports
- User → Notifications (recipient)
- User → DirectMessages (sender)
- Category → Posts
- Post → Comments
- Comment → Replies (nested)
- Conversation → DirectMessages

### Many-to-Many

- Users ↔ Categories (followers)
- Users ↔ Posts (votes)
- Users ↔ Comments (votes)
- Users ↔ Conversations (participants)

### Special

- Notification: sender → recipient (User → User)
- DirectMessage: replyTo (self-referencing)
- Conversation: direct (User ↔ User), group (Users ↔ Users)

---

## Data Flow

### Creating a Post

1. User creates post → POST /api/posts
2. Validate: user.canCreatePost() = true
3. Upload media to Cloudinary (if any)
4. Call AI service to analyze toxic/spam
5. Set status based on AI result
6. Save post to DB
7. Increment category.stats.postsCount
8. Increment author.stats.postsCount
9. Update author.badge if needed

### Creating a Comment

1. User creates comment → POST /api/comments
2. Validate: user.canCreateComment() = true
3. Call AI services:
   - Toxic detection
   - Emotion detection
4. Save comment to DB
5. Increment post.stats.commentsCount
6. Increment author.stats.commentsCount
7. If reply: increment parentComment.stats.repliesCount
8. Update post.lastActivityAt

### Voting

1. User votes → POST /api/votes/upvote
2. Check existing vote
3. If exists:
   - Same type: remove vote
   - Different type: change vote
4. If not exists: create new vote
5. Update target (Post/Comment) stats
6. Update target author stats
7. Recalculate score

### Reporting

1. User reports → POST /api/reports
2. Validate: not duplicate
3. Calculate priority based on total reports for target
4. Notify moderators if high/urgent
5. Moderator reviews → PUT /api/reports/:id/accept
6. Execute action (remove content, ban user)
7. Update target author.stats.reportsAccepted
8. Auto-update restrictions if >= 5 accepted reports

---

## Performance Optimization

### Indexes

- Create compound indexes for common queries
- Use text indexes for search
- Sparse indexes for optional fields (googleId)

### Caching (Redis)

- Cache hot posts (top 100)
- Cache category list
- Cache user sessions

### Aggregation Pipelines

```javascript
// Top posts today
db.posts.aggregate([
  {
    $match: {
      createdAt: { $gte: startOfDay },
      status: "published",
    },
  },
  { $sort: { "stats.upvotes": -1 } },
  { $limit: 50 },
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "authorDetails",
    },
  },
]);
```

### Pagination

- Cursor-based pagination for infinite scroll
- Limit results per query (max 100)

---

## Data Integrity

### Referential Integrity

- Soft delete comments if has replies
- Hard delete posts → cascade delete comments/votes
- Delete user → anonymize posts/comments

### Transactions

Use MongoDB transactions for:

- Creating post + updating stats
- Voting + updating stats
- Accepting report + banning user

### Validation

- Mongoose schema validation
- Express-validator middleware
- Client-side validation (React Hook Form)

---

## Backup & Recovery

### Backup Strategy

- Daily full backup
- Hourly incremental backup
- Keep last 30 days

### MongoDB Atlas

- Point-in-time recovery
- Automated backups
- Multi-region replication

---

## Security

### Data Protection

- Hash passwords (bcrypt)
- Sanitize user input (mongo-sanitize)
- Validate file uploads
- Rate limiting

### Privacy

- Email not exposed in public API
- Soft delete preserves data for investigation
- GDPR compliance: user can request data deletion

---

## Monitoring

### Metrics

- Query performance (slow query log)
- Collection sizes
- Index usage
- Connection pool stats

### Alerts

- High latency queries
- Failed authentication attempts
- Spike in reports
- AI service downtime
