# 📡 API DATA FLOW - HIỂU RÕ AXIOS INTERCEPTOR

## 🔍 VẤN ĐỀ ĐÃ GẶP

User profile không hiển thị mặc dù backend trả về data đúng. Lỗi: `Cannot read properties of undefined (reading '_id')`.

---

## 🎯 NGUYÊN NHÂN

**Double unwrapping data structure!** Axios interceptor đã unwrap một lần, nhưng code lại cố unwrap thêm lần nữa.

---

## 📊 DATA FLOW CHI TIẾT

### BƯỚC 1: Backend Response

```javascript
// Backend controller (ví dụ: getUserProfile)
res.status(200).json({
  success: true,
  data: {
    _id: "xxx",
    username: "kasizphantom",
    email: "kasizphantom@gmail.com",
    // ... more fields
  },
});
```

### BƯỚC 2: Axios Native Response

```javascript
// Axios trả về object với nhiều properties
{
  data: {                    // ← Backend response ở đây
    success: true,
    data: {
      _id: "xxx",
      username: "kasizphantom",
      // ...
    }
  },
  status: 200,
  statusText: "OK",
  headers: {...},
  config: {...}
}
```

### BƯỚC 3: Axios Interceptor (UNWRAP LẦN 1)

File: `web/frontend/src/services/axios.js`

```javascript
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data; // ← LẦN 1: Unwrap axios wrapper
  }
  // ... error handler
);
```

**Kết quả sau interceptor:**

```javascript
{
  success: true,
  data: {
    _id: "xxx",
    username: "kasizphantom",
    // ...
  }
}
```

### BƯỚC 4: API Service Layer (UNWRAP LẦN 2)

File: `web/frontend/src/services/api/users.js`

```javascript
const usersAPI = {
  getUserProfile: async (username) => {
    const response = await axios.get(`/users/${username}`);
    // response ở đây = kết quả sau interceptor
    // = { success: true, data: {...} }

    return response.data; // ← LẦN 2: Unwrap backend wrapper
    // = { _id, username, ... }
  },
};
```

**Kết quả cuối cùng:**

```javascript
{
  _id: "xxx",
  username: "kasizphantom",
  email: "kasizphantom@gmail.com",
  // ... user fields directly
}
```

### BƯỚC 5: Component Usage (ĐÚNG vs SAI)

#### ❌ SAI (Unwrap thêm lần 3):

```javascript
// Profile.jsx
const { data: profileData } = useQuery(["user", username], () =>
  usersAPI.getUserProfile(username)
);

const user = profileData?.data; // ❌ Unwrap lần 3 - WRONG!
// user = undefined (vì user object không có property "data")
```

#### ✅ ĐÚNG (Dùng trực tiếp):

```javascript
// Profile.jsx
const { data: profileData } = useQuery(["user", username], () =>
  usersAPI.getUserProfile(username)
);

const user = profileData; // ✅ profileData đã là user object
// user = { _id, username, email, ... }
```

---

## 📋 QUY TẮC CHUẨN

### 🔹 Trong API Service Files (`src/services/api/*.js`)

**LUÔN unwrap `.data` để trả về data trực tiếp:**

```javascript
const someAPI = {
  someMethod: async (params) => {
    const response = await axios.get("/endpoint");
    return response.data; // ✅ Unwrap backend wrapper
  },
};
```

**Lý do:** Giúp components đơn giản hơn, không cần quan tâm đến structure `{ success, data }`.

### 🔹 Trong Components

**Dùng data trực tiếp, KHÔNG unwrap thêm:**

```javascript
// ✅ ĐÚNG
const { data } = useQuery(["key"], () => api.getData());
const item = data; // data đã là object/array trực tiếp

// ❌ SAI
const item = data?.data; // Double unwrap!
```

### 🔹 Trong Zustand Store

**Auth store cũng dùng trực tiếp:**

```javascript
// authStore.js
login: async (credentials) => {
  const data = await authAPI.login(credentials);
  // data = { user, accessToken, refreshToken }

  get().setAuth(data); // ✅ Pass trực tiếp
};
```

---

## 🎓 CÁC TRƯỜNG HỢP CỤ THỂ

### 1. User Profile

```javascript
// Backend
{ success: true, data: { _id, username, ... } }

// ↓ Axios interceptor
{ success: true, data: {...} }

// ↓ usersAPI.getUserProfile()
{ _id, username, ... }

// ✅ Component
const user = profileData;  // Trực tiếp
```

### 2. Posts List

```javascript
// Backend
{ success: true, data: { posts: [...], pagination: {...} } }

// ↓ Axios interceptor
{ success: true, data: { posts: [...], pagination: {...} } }

// ↓ postsAPI.getPosts()
{ posts: [...], pagination: {...} }

// ✅ Component
const posts = postsData?.posts;  // Unwrap "posts" array
const pagination = postsData?.pagination;
```

### 3. Authentication

```javascript
// Backend
{
  success: true,
  data: {
    user: {...},
    accessToken: "...",
    refreshToken: "..."
  }
}

// ↓ Axios interceptor
{ success: true, data: { user: {...}, accessToken: "...", ... } }

// ↓ authAPI.login()
{ user: {...}, accessToken: "...", refreshToken: "..." }

// ✅ Auth store
const data = await authAPI.login(credentials);
setAuth(data);  // data.user, data.accessToken, ...
```

---

## 🐛 DEBUG CHECKLIST

Khi gặp lỗi `Cannot read properties of undefined`:

1. ✅ **Check console logs:**

   ```javascript
   console.log("Raw data:", data);
   console.log("Unwrapped:", data?.someProperty);
   ```

2. ✅ **Check API response structure:**

   - Mở Network tab
   - Xem Response của API call
   - Đếm số lần cần unwrap

3. ✅ **Check axios.js interceptor:**

   - Interceptor có unwrap không?
   - Return `response` hay `response.data`?

4. ✅ **Check API service:**

   - Return `response` hay `response.data`?
   - Có unwrap đúng không?

5. ✅ **Check component:**
   - Có unwrap thừa không?
   - Có thiếu optional chaining `?.` không?

---

## 📝 LƯU Ý QUAN TRỌNG

### ⚠️ KHÔNG tự ý thay đổi interceptor

Nếu đổi interceptor từ `return response.data` thành `return response`, **TẤT CẢ API services phải update** (xóa `.data`).

### ⚠️ KHÔNG mix styles

Tất cả API services phải consistent:

- **Hoặc** tất cả return `response`
- **Hoặc** tất cả return `response.data`

**Hiện tại project dùng: `return response.data`** ✅

### ⚠️ LUÔN dùng optional chaining

```javascript
const user = data?.user; // ✅ An toàn
const posts = data?.posts || []; // ✅ Fallback array
const name = user?.profile?.name; // ✅ Deep access
```

---

## 🎯 TÓM TẮT

| Layer            | Input              | Action       | Output                         |
| ---------------- | ------------------ | ------------ | ------------------------------ |
| **Backend**      | Request            | Return JSON  | `{ success, data }`            |
| **Axios Native** | Backend response   | Wrap         | `{ data: {...}, status, ... }` |
| **Interceptor**  | Axios response     | Unwrap 1x    | `{ success, data }`            |
| **API Service**  | Interceptor output | Unwrap 2x    | `{ ... }` actual data          |
| **Component**    | API service output | Use directly | ✅                             |

---

**Created:** 2024-10-27  
**Last Updated:** 2024-10-27  
**Status:** ✅ Production Ready

---

## 🔗 RELATED FILES

- `web/frontend/src/services/axios.js` - Axios interceptor config
- `web/frontend/src/services/api/users.js` - User API example
- `web/frontend/src/services/api/auth.js` - Auth API example
- `web/frontend/src/pages/User/Profile.jsx` - Component usage example
