# 🔐 HƯỚNG DẪN SETUP GOOGLE OAUTH LOGIN

> **LƯU Ý:** Dự án này **CHỈ HỖ TRỢ ĐĂNG NHẬP GOOGLE**, không có đăng ký/đăng nhập bằng email/password.
> Điều này giúp đơn giản hóa authentication và tập trung vào các tính năng AI.

---

## BƯỚC 1: Tạo Google OAuth Credentials

### 1.1. Vào Google Cloud Console

1. Truy cập: https://console.cloud.google.com/
2. Đăng nhập với tài khoản Google của bạn

### 1.2. Tạo Project (nếu chưa có)

1. Click vào dropdown **Select a project** ở top bar
2. Click **NEW PROJECT**
3. Nhập tên project: `Forum App` (hoặc tên bạn muốn)
4. Click **CREATE**

### 1.3. Enable Google+ API

1. Vào **APIs & Services** > **Library**
2. Tìm "Google+ API" hoặc "Google Identity"
3. Click **ENABLE**

### 1.4. Create OAuth Consent Screen

1. Vào **APIs & Services** > **OAuth consent screen**
2. Chọn **External** (cho testing)
3. Click **CREATE**
4. Điền thông tin:
   - **App name**: Forum App
   - **User support email**: email của bạn
   - **Developer contact email**: email của bạn
5. Click **SAVE AND CONTINUE**
6. Skip **Scopes** (click SAVE AND CONTINUE)
7. **Test users**: Thêm email của bạn để test
8. Click **SAVE AND CONTINUE**

### 1.5. Create OAuth 2.0 Client ID

1. Vào **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Chọn **OAuth client ID**
4. **Application type**: Web application
5. **Name**: Forum Web Client
6. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
7. **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   http://localhost:3000
   ```
8. Click **CREATE**
9. 📝 **LƯU LẠI**:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`

---

## BƯỚC 2: Cấu hình Backend

### 2.1. Tạo file `.env` trong `web/backend/`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/forum

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET_HERE

# Cloudinary (optional - cho upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 2.2. Generate JWT Secrets

Chạy trong terminal để tạo JWT secrets ngẫu nhiên:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Node.js (bất kỳ OS nào)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2.3. Cài đặt dependencies

```bash
cd web/backend
npm install
```

---

## BƯỚC 3: Cấu hình Frontend

### 3.1. Tạo file `.env` trong `web/frontend/`

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth Client ID (SAME as backend)
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

⚠️ **LƯU Ý:** `VITE_GOOGLE_CLIENT_ID` phải GIỐNG HỆT với `GOOGLE_CLIENT_ID` trong backend!

### 3.2. Cài đặt dependencies

```bash
cd web/frontend
npm install
```

---

## BƯỚC 4: Khởi động ứng dụng

### 4.1. Start MongoDB

Đảm bảo MongoDB đang chạy:

```bash
# Linux/Mac
sudo systemctl start mongod

# Windows (MongoDB đã cài)
mongod --dbpath="C:\data\db"

# Hoặc dùng MongoDB Compass/Atlas
```

### 4.2. Start Backend Server

```bash
cd web/backend
npm run dev
```

✅ Backend chạy tại: http://localhost:5000

### 4.3. Start Frontend Dev Server

Mở terminal mới:

```bash
cd web/frontend
npm run dev
```

✅ Frontend chạy tại: http://localhost:3000 hoặc http://localhost:5173

---

## BƯỚC 5: Test Google Login

1. Mở trình duyệt: http://localhost:3000/login
2. Bạn sẽ thấy trang đăng nhập đẹp với nút **"Continue with Google"**
3. Click vào nút Google login
4. Chọn tài khoản Google của bạn
5. ✅ **Đăng nhập thành công!** Bạn sẽ được redirect về trang chủ

### Demo Flow:

```
1. User click "Continue with Google"
   ↓
2. Google popup mở ra
   ↓
3. User chọn account & authorize
   ↓
4. Google trả về credential token
   ↓
5. Frontend gửi token đến Backend API
   ↓
6. Backend verify token và tạo/update user
   ↓
7. Backend trả về JWT access + refresh token
   ↓
8. Frontend lưu tokens và user info vào Zustand + localStorage
   ↓
9. Redirect về trang chủ ✅
```

---

## 🔒 BẢO MẬT

### Development (localhost)

- ✅ Dùng HTTP localhost OK
- ✅ Test users: Thêm email vào OAuth consent screen
- ⚠️ **KHÔNG commit file `.env` vào Git**

### Production Deployment

1. **Update Authorized Origins & Redirect URIs:**

   ```
   https://yourdomain.com
   https://api.yourdomain.com/auth/google/callback
   ```

2. **Verify OAuth Consent Screen:**

   - Submit for Google review
   - Remove test mode
   - Add Privacy Policy & Terms of Service URLs

3. **Environment Variables:**

   - Dùng HTTPS (SSL certificate)
   - Store `.env` securely (Railway, Vercel env vars, etc.)
   - Update `CORS_ORIGIN` với domain thật

4. **Database:**
   - Use MongoDB Atlas (production cluster)
   - Enable authentication
   - Whitelist IP addresses

---

## 🆘 TROUBLESHOOTING

### Error: `redirect_uri_mismatch`

**Nguyên nhân:** Redirect URI không khớp với Google Console config

**Giải pháp:**

- Check **Authorized redirect URIs** trong Google Console
- Phải có chính xác: `http://localhost:5000/api/auth/google/callback`
- Không có trailing slash
- Check PORT trong backend .env

---

### Error: `access_denied`

**Nguyên nhân:** Email chưa được add vào Test users

**Giải pháp:**

- Vào **OAuth consent screen** > **Test users**
- Add email của bạn
- Status phải là **"Testing"**

---

### Error: `invalid_client` hoặc `idpiframe_initialization_failed`

**Nguyên nhân:** Client ID hoặc Client Secret sai

**Giải pháp:**

- Check `GOOGLE_CLIENT_ID` trong backend `.env`
- Check `VITE_GOOGLE_CLIENT_ID` trong frontend `.env`
- Phải match với Google Console Credentials
- Restart server sau khi đổi `.env`

---

### Error: `Failed to fetch` hoặc CORS error

**Nguyên nhân:** Backend không chạy hoặc CORS config sai

**Giải pháp:**

- Check backend đang chạy: http://localhost:5000
- Check `VITE_API_URL` trong frontend `.env`
- Check `CORS_ORIGIN` trong backend `.env`
- Clear browser cache

---

### Google button không hiển thị

**Nguyên nhân:**

- Client ID không được set
- Google library chưa load

**Giải pháp:**

```bash
# Check frontend .env
cat web/frontend/.env

# Restart frontend dev server
cd web/frontend
npm run dev
```

---

## 📚 RESOURCES

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth 2.0 Docs:** https://developers.google.com/identity/protocols/oauth2
- **React OAuth Library:** https://www.npmjs.com/package/@react-oauth/google
- **DaisyUI Components:** https://daisyui.com/
- **MongoDB Docs:** https://www.mongodb.com/docs/

---

## ✨ CÁC TÍNH NĂNG ĐÃ IMPLEMENT

✅ **Google OAuth Login** - Đăng nhập nhanh chóng và an toàn  
✅ **Auto User Creation** - Tự động tạo user từ Google account  
✅ **JWT Authentication** - Access + Refresh token  
✅ **Beautiful UI** - Landing page hiện đại với DaisyUI  
✅ **Responsive Design** - Mobile-friendly  
✅ **Persistent Login** - Lưu session với localStorage

---

## 🎯 LỢI ÍCH CỦA GOOGLE-ONLY AUTH

1. ✅ **Đơn giản hơn** - Không cần implement forgot password, email verification
2. ✅ **An toàn hơn** - Google đảm bảo bảo mật
3. ✅ **UX tốt hơn** - 1-click login, không cần nhớ password
4. ✅ **Less bugs** - Ít code hơn = ít bugs hơn
5. ✅ **Focus on AI** - Tập trung vào tính năng AI của đồ án

---

**🚀 Next Steps:** Sau khi setup xong, bạn có thể bắt đầu code các tính năng AI!

- [ ] AI Toxic Comment Detection
- [ ] AI Emotion Detection
- [ ] AI Spam Detection
- [ ] AI Content Recommendation

**Happy Coding!** 🎉
