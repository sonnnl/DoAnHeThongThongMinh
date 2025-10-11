# API Documentation

Base URL: `http://localhost:5000/api`

Tất cả requests và responses sử dụng format JSON.

---

## Authentication

Hầu hết endpoints yêu cầu authentication. Sử dụng JWT token trong header:

```
Authorization: Bearer <token>
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional, cho validation errors
}
```

---

## Endpoints

## 🔐 Authentication

### POST /auth/register

Đăng ký user mới.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": null,
      "badge": "Newbie",
      "role": "user",
      "stats": { ... },
      "registeredAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "User registered successfully"
}
```

**Errors:**

- `400` - Validation errors
- `409` - Email/username already exists

---

### POST /auth/login

Đăng nhập.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**

- `400` - Missing fields
- `401` - Invalid credentials
- `403` - User is banned

---

### GET /auth/me

Lấy thông tin user hiện tại.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## 👤 Users

### GET /users/:id

Lấy profile user.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "john_doe",
      "avatar": "https://...",
      "bio": "...",
      "badge": "Chuyên gia",
      "stats": {
        "postsCount": 50,
        "commentsCount": 200,
        "upvotesReceived": 500,
        "downvotesReceived": 10
      },
      "daysJoined": 100,
      "registeredAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### PUT /users/:id

Update profile (chỉ user của chính mình).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "bio": "New bio",
  "location": "Vietnam",
  "website": "https://example.com"
}
```

**Response:** `200 OK`

---

### POST /users/:id/avatar

Upload avatar.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**

```
FormData:
  avatar: File
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "avatar": "https://cloudinary.com/..."
  }
}
```

---

## 📁 Categories

### GET /categories

Lấy tất cả categories.

**Query Params:**

- `includeSubcategories` (boolean) - Include subcategories

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "...",
        "name": "Technology",
        "slug": "technology",
        "description": "...",
        "icon": "laptop",
        "color": "#3B82F6",
        "stats": {
          "postsCount": 100,
          "commentsCount": 500
        },
        "subcategories": [ ... ]
      }
    ]
  }
}
```

---

### POST /categories

Tạo category mới (Admin only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Technology",
  "description": "Tech discussions",
  "icon": "laptop",
  "color": "#3B82F6",
  "parentCategory": null
}
```

**Response:** `201 Created`

---

## 📝 Posts

### GET /posts

Lấy danh sách posts.

**Query Params:**

- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)
- `sort` (string) - Sort by: `hot`, `new`, `top`, `controversial` (default: `hot`)
- `category` (string) - Filter by category ID
- `author` (string) - Filter by author ID
- `time` (string) - Time range for `top` sort: `day`, `week`, `month`, `year`, `all`
- `search` (string) - Search query

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "...",
        "title": "Post title",
        "slug": "post-title-abc123",
        "content": "...",
        "author": {
          "_id": "...",
          "username": "john_doe",
          "avatar": "...",
          "badge": "Chuyên gia"
        },
        "category": {
          "_id": "...",
          "name": "Technology",
          "slug": "technology"
        },
        "media": {
          "images": [ ... ],
          "videos": [ ... ]
        },
        "tags": ["javascript", "nodejs"],
        "stats": {
          "upvotes": 100,
          "downvotes": 5,
          "commentsCount": 50,
          "viewsCount": 1000
        },
        "score": 25.5,
        "status": "published",
        "isPinned": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "hasMore": true
    }
  }
}
```

---

### GET /posts/:slug

Lấy chi tiết post.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "post": { ... },
    "userVote": "upvote" // null, "upvote", hoặc "downvote" (nếu authenticated)
  }
}
```

---

### POST /posts

Tạo post mới.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Post title",
  "content": "Post content in markdown",
  "category": "category_id",
  "tags": ["tag1", "tag2"],
  "media": {
    "images": [
      {
        "url": "https://cloudinary.com/...",
        "publicId": "..."
      }
    ],
    "videos": [ ... ]
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "post": { ... }
  },
  "message": "Post created successfully"
}
```

**Errors:**

- `403` - User không được phép post (chưa đủ 1h hoặc chưa comment 3 lần)
- `400` - Validation errors

---

### PUT /posts/:id

Update post (chỉ author).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["new", "tags"]
}
```

**Response:** `200 OK`

---

### DELETE /posts/:id

Xóa post (chỉ author hoặc moderator).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## 💬 Comments

### GET /comments

Lấy comments của post.

**Query Params:**

- `postId` (string, required) - Post ID
- `sort` (string) - Sort by: `best`, `new`, `top`, `controversial` (default: `best`)
- `page` (number)
- `limit` (number)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "...",
        "content": "Comment content",
        "author": { ... },
        "post": "post_id",
        "parentComment": null,
        "depth": 0,
        "images": [ ... ],
        "stats": {
          "upvotes": 10,
          "downvotes": 1,
          "repliesCount": 5
        },
        "emotion": {
          "label": "joy",
          "confidence": 0.85,
          "color": "bg-yellow-100 text-yellow-800"
        },
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "userVote": null // null, "upvote", "downvote"
      }
    ]
  }
}
```

---

### POST /comments

Tạo comment mới.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "content": "Comment content",
  "postId": "post_id",
  "parentCommentId": null, // Optional, for replies
  "images": [ ... ] // Optional
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "comment": { ... }
  }
}
```

**Note:** Server sẽ tự động phân tích cảm xúc bằng AI và gắn vào comment.

---

### PUT /comments/:id

Update comment (chỉ author).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "content": "Updated content"
}
```

**Response:** `200 OK`

---

### DELETE /comments/:id

Xóa comment (soft delete).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Note:** Nếu comment có replies, sẽ soft delete (content = "[Bình luận này đã bị xóa]"). Nếu không có replies, sẽ hard delete.

---

## 👍 Votes

### POST /votes/upvote

Upvote post hoặc comment.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "targetType": "Post", // "Post" hoặc "Comment"
  "targetId": "target_id"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "action": "created", // "created", "changed", "removed"
    "voteType": "upvote",
    "stats": {
      "upvotes": 101,
      "downvotes": 5
    }
  }
}
```

**Note:**

- Nếu đã upvote rồi: remove upvote
- Nếu đang downvote: change to upvote
- Nếu chưa vote: create upvote

---

### POST /votes/downvote

Downvote post hoặc comment (tương tự upvote).

---

### GET /votes/my-votes

Lấy danh sách votes của user.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Params:**

- `targetType` (string) - Filter by "Post" or "Comment"
- `page` (number)
- `limit` (number)

**Response:** `200 OK`

---

## 🚨 Reports

### POST /reports

Tạo report.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "targetType": "Post", // "Post", "Comment", "User"
  "targetId": "target_id",
  "reason": "spam", // spam, harassment, hate_speech, violence, etc.
  "description": "Optional detailed description"
}
```

**Response:** `201 Created`

**Errors:**

- `409` - Đã report target này rồi

---

### GET /reports

Lấy danh sách reports (Moderator only).

**Headers:**

```
Authorization: Bearer <token>
```

**Query Params:**

- `status` (string) - Filter by: `pending`, `reviewing`, `accepted`, `rejected`
- `priority` (string) - Filter by: `low`, `medium`, `high`, `urgent`
- `page` (number)
- `limit` (number)

**Response:** `200 OK`

---

### PUT /reports/:id/accept

Accept report và thực hiện action (Moderator only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "action": "content_removed", // none, warning, content_removed, user_banned_*
  "notes": "Moderator notes"
}
```

**Response:** `200 OK`

---

### PUT /reports/:id/reject

Reject report (Moderator only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "notes": "Reason for rejection"
}
```

**Response:** `200 OK`

---

## 📤 Upload

### POST /upload/image

Upload ảnh.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**

```
FormData:
  image: File
  folder: "posts" // "posts", "comments", "avatars"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/...",
    "publicId": "...",
    "width": 1920,
    "height": 1080,
    "size": 123456
  }
}
```

---

### POST /upload/video

Upload video (max 25MB).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**

```
FormData:
  video: File
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/...",
    "publicId": "...",
    "duration": 60,
    "size": 24000000,
    "thumbnailUrl": "..."
  }
}
```

**Errors:**

- `400` - File quá lớn (> 25MB)
- `415` - File type không hợp lệ

---

### DELETE /upload/:publicId

Xóa file đã upload.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## 🤖 AI Service

**Base URL:** `http://localhost:8000/api/ai`

**Authentication:** API Key trong header

```
X-API-Key: <api_key>
```

### POST /ai/toxic

Phát hiện toxic content.

**Request Body:**

```json
{
  "text": "Text to analyze"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "is_toxic": false,
    "label": "clean",
    "scores": {
      "clean": 0.95,
      "spam": 0.02,
      "hate_speech": 0.02,
      "harassment": 0.01
    },
    "confidence": 0.95
  }
}
```

---

### POST /ai/emotion

Phát hiện cảm xúc.

**Request Body:**

```json
{
  "text": "Text to analyze"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "emotion": "joy",
    "confidence": 0.85,
    "scores": {
      "joy": 0.85,
      "sadness": 0.05,
      "anger": 0.03,
      "fear": 0.02,
      "surprise": 0.02,
      "neutral": 0.01,
      "love": 0.01,
      "disgust": 0.01
    },
    "color": "bg-yellow-100 text-yellow-800",
    "suggestion": "..." // Chỉ có khi emotion = "anger"
  }
}
```

---

### POST /ai/analyze

Phân tích toàn diện (toxic + emotion).

**Request Body:**

```json
{
  "text": "Text to analyze"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "toxic": { ... },
    "emotion": { ... }
  }
}
```

---

## Rate Limiting

- **Global:** 100 requests / 15 minutes per IP
- **Auth endpoints:** 5 requests / 15 minutes per IP
- **Upload endpoints:** 10 requests / 15 minutes per user

Response khi vượt limit:

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Pagination

Tất cả list endpoints support pagination:

**Query Params:**

- `page` (number) - Default: 1
- `limit` (number) - Default: 20, Max: 100

**Response:**

```json
{
  "data": {
    "items": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "hasMore": true
    }
  }
}
```

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token / invalid token)
- `403` - Forbidden (không có quyền)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `413` - Payload Too Large (file quá lớn)
- `415` - Unsupported Media Type
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service không available)

---

## WebSocket (Future)

Có thể implement WebSocket cho:

- Real-time notifications
- Real-time comment updates
- Typing indicators

---

**Version:** 1.0.0  
**Last Updated:** 2024
