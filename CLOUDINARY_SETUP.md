# ☁️ CLOUDINARY SETUP - HƯỚNG DẪN CHI TIẾT

## 🎯 MỤC ĐÍCH

Cloudinary dùng để upload và lưu trữ:

- ✅ Avatar người dùng
- ✅ Ảnh trong bài viết
- ✅ Ảnh trong comment
- ✅ Video (max 25MB)

---

## 📝 BƯỚC 1: TẠO TÀI KHOẢN CLOUDINARY

### 1.1. Đăng ký miễn phí

1. Truy cập: https://cloudinary.com/
2. Click **Sign Up for Free**
3. Chọn **Sign up with Google** (nhanh nhất) hoặc điền form
4. Verify email

### 1.2. Free Plan Limits

- ✅ **25 GB Storage** - Đủ cho đồ án
- ✅ **25 GB Bandwidth/tháng** - Đủ cho testing
- ✅ **No credit card required**
- ✅ Transformations, optimizations miễn phí

---

## 🔑 BƯỚC 2: LẤY API CREDENTIALS

### 2.1. Vào Dashboard

Sau khi đăng nhập, bạn sẽ thấy Dashboard với thông tin:

```
Account Details
───────────────────────────────────────
Cloud name:     your_cloud_name
API Key:        123456789012345
API Secret:     AbCdEfGhIjKlMnOpQrStUvWxYz  [Show]
```

### 2.2. Copy 3 giá trị này:

1. **Cloud Name**: Ví dụ `dab12cd3e`
2. **API Key**: Ví dụ `123456789012345`
3. **API Secret**: Click **[Show]** để hiện, copy giá trị

⚠️ **QUAN TRỌNG:** API Secret là bí mật, KHÔNG share công khai!

---

## ⚙️ BƯỚC 3: CẤU HÌNH BACKEND

### 3.1. Mở file `web/backend/.env`

Nếu chưa có file `.env`, tạo mới trong thư mục `web/backend/`

### 3.2. Thêm Cloudinary credentials

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/forum

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_secret

# ☁️ CLOUDINARY (THÊM PHẦN NÀY)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

**Thay thế:**

- `your_cloud_name_here` → Cloud name từ Cloudinary
- `123456789012345` → API Key từ Cloudinary
- `AbCdEfGhIjKlMnOpQrStUvWxYz` → API Secret từ Cloudinary

### 3.3. Restart Backend Server

```bash
# Stop server (Ctrl+C)
# Start lại
cd web/backend
npm run dev
```

---

## ✅ BƯỚC 4: TEST UPLOAD

### 4.1. Test Upload Avatar

1. **Login** vào ứng dụng
2. Vào **Settings** hoặc **Profile**
3. Click **Upload Avatar** hoặc **Change Avatar**
4. Chọn ảnh (JPG, PNG, GIF, WebP)
5. Upload ✅

### 4.2. Check Cloudinary Dashboard

Sau khi upload thành công:

1. Vào https://cloudinary.com/console/media_library
2. Vào folder **forum/avatars**
3. Bạn sẽ thấy ảnh avatar vừa upload!

---

## 🎨 FOLDERS STRUCTURE

Cloudinary sẽ tự động tạo folders:

```
cloudinary.com/your_cloud_name/
├── forum/
│   ├── avatars/          ← User avatars (400x400)
│   ├── posts/            ← Post images (max 1920x1080)
│   ├── comments/         ← Comment images
│   └── videos/           ← Videos (max 25MB)
```

---

## 🔒 BẢO MẬT

### ⚠️ QUAN TRỌNG

1. **KHÔNG commit `.env` vào git**

   - File `.env` đã có trong `.gitignore`
   - Chỉ commit `.env.example`

2. **KHÔNG share API Secret công khai**

   - API Secret như password
   - Nếu bị lộ, regenerate ngay

3. **Enable Unsigned Upload Prevention**
   - Vào Settings > Security
   - Enable **Strict transformations**

### 🔄 Regenerate API Secret (nếu bị lộ)

1. Vào Cloudinary Dashboard
2. Settings > Security > API Keys
3. Click **Regenerate API secret**
4. Update `.env` với secret mới
5. Restart backend

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot read properties of undefined (reading 'upload_stream')"

**Nguyên nhân:** Cloudinary chưa được import đúng hoặc credentials sai

**Giải pháp:**

1. ✅ Check `web/backend/controllers/uploadController.js` line 13:

   ```javascript
   const { cloudinary } = require("../config/cloudinary");
   // Phải có { } để destructure!
   ```

2. ✅ Check `.env` có đủ 3 biến:

   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

3. ✅ Restart backend server

---

### Error: "Invalid credentials"

**Nguyên nhân:** API Key hoặc Secret sai

**Giải pháp:**

1. Double-check credentials trong Cloudinary Dashboard
2. Copy lại chính xác (không thừa space)
3. Update `.env`
4. Restart backend

---

### Error: "File too large"

**Nguyên nhân:** File vượt quá giới hạn

**Giới hạn:**

- ✅ Ảnh: 10MB (auto resize xuống 1920x1080)
- ✅ Video: 25MB strict
- ✅ Avatar: Auto crop 400x400

**Giải pháp:**

- Nén ảnh trước khi upload
- Video dùng online compressor

---

### Upload thành công nhưng không hiển thị

**Nguyên nhân:** URL không được lưu vào database

**Giải pháp:**

1. Check response từ backend (Console Network tab)
2. Verify URL trong database (MongoDB)
3. Check frontend có update state không

---

## 📊 CLOUDINARY FEATURES SỬ DỤNG

### 1. Auto Optimization

```javascript
transformation: [
  { quality: "auto" }, // Auto optimize quality
  { fetch_format: "auto" }, // Auto WebP nếu browser support
];
```

### 2. Avatar Crop

```javascript
transformation: [
  { width: 400, height: 400, crop: "fill", gravity: "face" },
  // Auto detect face và crop
];
```

### 3. Image Resize

```javascript
transformation: [
  { width: 1920, height: 1080, crop: "limit" },
  // Không vượt quá kích thước, giữ aspect ratio
];
```

### 4. Video Thumbnail

```javascript
eager: [{ width: 1280, height: 720, format: "mp4" }];
// Auto generate thumbnail
```

---

## 🎓 LỢI ÍCH CỦA CLOUDINARY

1. ✅ **CDN toàn cầu** - Load nhanh từ server gần nhất
2. ✅ **Auto optimization** - WebP, auto quality
3. ✅ **Image transformation** - Resize, crop, filter on-the-fly
4. ✅ **Video processing** - Transcode, thumbnail
5. ✅ **Free tier generous** - 25GB đủ cho đồ án
6. ✅ **Easy integration** - SDK cho Node.js

---

## 🔗 RESOURCES

- **Dashboard:** https://cloudinary.com/console
- **Media Library:** https://cloudinary.com/console/media_library
- **Documentation:** https://cloudinary.com/documentation
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration

---

## 📝 OPTIONAL: Production Setup

Khi deploy production:

### 1. Environment Variables

```env
# Production .env
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
```

### 2. Security Settings

- Enable **Strict transformations**
- Enable **Resource list**
- Set **Allowed origins** (CORS)

### 3. Upgrade Plan (nếu cần)

- Plus Plan: $89/month → 100GB storage, 100GB bandwidth
- Advanced Plan: $224/month → 200GB storage, 200GB bandwidth

Nhưng **Free plan đủ cho đồ án**! ✅

---

**Created:** 2024-10-27  
**Status:** ✅ Ready to Use

---

## ✨ NEXT STEPS

1. [ ] Tạo tài khoản Cloudinary
2. [ ] Copy credentials vào `.env`
3. [ ] Restart backend
4. [ ] Test upload avatar
5. [ ] Check Cloudinary media library
6. [ ] 🎉 Hoàn thành!
