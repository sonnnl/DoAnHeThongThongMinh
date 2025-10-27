# 🔧 HƯỚNG DẪN SETUP ENVIRONMENT VARIABLES

## Backend (.env)

Tạo file `web/backend/.env` với nội dung:

```env
# ===================================
# SERVER CONFIG
# ===================================
NODE_ENV=development
PORT=5000

# ===================================
# DATABASE
# ===================================
MONGODB_URI=mongodb://localhost:27017/forum

# ===================================
# JWT AUTHENTICATION
# ===================================
# Generate bằng: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_key_min_32_characters_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_characters_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ===================================
# CLOUDINARY (File Upload)
# ===================================
# Đăng ký free tại: https://cloudinary.com/
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ===================================
# EMAIL (Optional)
# ===================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Forum <noreply@forum.com>

# ===================================
# CLIENT URL
# ===================================
CLIENT_URL=http://localhost:3000
```

### 📝 CHI TIẾT CÁC BIẾN

#### 1. MongoDB (BẮT BUỘC)

**Local MongoDB:**

```env
MONGODB_URI=mongodb://localhost:27017/forum
```

**MongoDB Atlas (Cloud - Free):**

1. Đăng ký tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster free
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0` (tất cả IPs - chỉ dùng dev)
5. Copy connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forum?retryWrites=true&w=majority
```

#### 2. JWT Secrets (BẮT BUỘC)

Generate random strings:

```bash
# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Hoặc dùng online: https://randomkeygen.com/
```

Copy 2 chuỗi khác nhau cho JWT_SECRET và JWT_REFRESH_SECRET.

#### 3. Cloudinary (TÙY CHỌN - cần cho upload ảnh/video)

1. Đăng ký free: https://cloudinary.com/users/register/free
2. Vào Dashboard: https://cloudinary.com/console
3. Copy 3 giá trị:
   - Cloud Name
   - API Key
   - API Secret

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwx
```

**Nếu KHÔNG dùng Cloudinary:**

- Tạm thời có thể skip (upload sẽ fail)
- Hoặc comment code upload trong `uploadController.js`

#### 4. Email (TÙY CHỌN - cho password reset)

**Gmail:**

1. Bật 2-Step Verification
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Copy password:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

**Nếu KHÔNG dùng Email:**

- Có thể skip (forgot password sẽ fail)

#### 5. Google OAuth (TÙY CHỌN)

1. Google Cloud Console: https://console.cloud.google.com/
2. Tạo project mới
3. APIs & Services > Credentials > Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID và Secret:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

## Frontend (.env)

Tạo file `web/frontend/.env` với nội dung:

```env
# ===================================
# API URL (BẮT BUỘC)
# ===================================
VITE_API_URL=http://localhost:5000/api

# ===================================
# GOOGLE OAUTH (TÙY CHỌN)
# ===================================
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# ===================================
# FEATURE FLAGS (TÙY CHỌN)
# ===================================
VITE_ENABLE_GOOGLE_AUTH=false
VITE_ENABLE_AI_FEATURES=false
```

### 📝 CHI TIẾT

#### VITE_API_URL (BẮT BUỘC)

URL của backend API (không có trailing slash):

```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://your-api.com/api
```

---

## 🚀 QUICK START (Minimum Config)

Để chạy project cơ bản, chỉ cần:

### Backend (.env):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/forum
JWT_SECRET=please_change_this_to_random_string_min_32_chars
JWT_REFRESH_SECRET=please_change_this_to_another_random_string_min_32_chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### Frontend (.env):

```env
VITE_API_URL=http://localhost:5000/api
```

**Với config này, bạn có thể:**

- ✅ Đăng ký, đăng nhập
- ✅ Tạo, xem, sửa, xóa posts
- ✅ Comment (backend)
- ✅ Vote
- ✅ Xem profile
- ❌ KHÔNG thể upload ảnh/video (cần Cloudinary)
- ❌ KHÔNG thể reset password (cần Email)
- ❌ KHÔNG thể Google login (cần Google OAuth)

---

## ✅ VERIFY SETUP

### 1. Backend

```bash
cd web/backend
npm run dev
```

Xem output:

```
✓ MongoDB connected successfully
✓ Server running on port 5000
```

### 2. Frontend

```bash
cd web/frontend
npm run dev
```

Mở http://localhost:3000

### 3. Test

1. Đăng ký user mới
2. Đăng nhập
3. Tạo bài viết (KHÔNG upload ảnh nếu chưa setup Cloudinary)
4. Xem bài viết

---

## 🔒 SECURITY NOTES

### ⚠️ Development:

- ✅ Có thể dùng JWT secrets đơn giản
- ✅ Có thể dùng `0.0.0.0/0` cho MongoDB whitelist
- ✅ Có thể hardcode values

### 🔐 Production:

- ❌ KHÔNG commit file .env
- ❌ KHÔNG dùng JWT secrets yếu
- ❌ KHÔNG whitelist all IPs
- ✅ Dùng environment variables trên hosting
- ✅ Dùng secrets management service
- ✅ Enable HTTPS
- ✅ Restrict CORS properly

---

## 🆘 TROUBLESHOOTING

### "MongooseError: Operation buffering timed out"

- ✅ Check MongoDB đã chạy: `mongod`
- ✅ Check connection string đúng
- ✅ Check network/firewall

### "JsonWebTokenError: jwt malformed"

- ✅ Check JWT_SECRET đã set
- ✅ Check JWT_SECRET >= 32 characters
- ✅ Restart server sau khi đổi .env

### "Error: Cloudinary config required"

- ✅ Check CLOUDINARY\_\* variables đã set
- ✅ Check credentials đúng
- ⏸️ Tạm thời skip upload ảnh

### "CORS Error"

- ✅ Check CLIENT_URL trong backend .env
- ✅ Check VITE_API_URL trong frontend .env
- ✅ Restart cả backend và frontend

---

## 📚 LINKS

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Cloudinary: https://cloudinary.com/
- Google Cloud Console: https://console.cloud.google.com/
- Random Key Generator: https://randomkeygen.com/

---

**Next:** Xem [SETUP_GUIDE.md](SETUP_GUIDE.md) để hướng dẫn cài đặt đầy đủ
