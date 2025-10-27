# 🤖 Kiến Trúc AI - Ý Tưởng & Triển Khai

## 📋 Tổng Quan

Hệ thống sử dụng **2 mô hình AI** để nâng cao trải nghiệm và kiểm duyệt tự động:

1. **Toxic Detection** - Phát hiện spam, ngôn từ thù ghét, toxic
2. **Emotion Detection** - Phân tích cảm xúc để tùy chỉnh giao diện

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────┐
│         FORUM BACKEND (Node.js)         │
│                                          │
│  User Post/Comment                      │
│       │                                  │
│       ▼                                  │
│  [AI Middleware]                        │
│       │                                  │
│       │ HTTP Request                     │
└───────┼──────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│       AI SERVICE (Python Flask)         │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Toxic      │  │    Emotion      │ │
│  │  Detection   │  │   Detection     │ │
│  │  (PhoBERT)   │  │   (PhoBERT)     │ │
│  └──────────────┘  └─────────────────┘ │
│                                          │
│  Return: JSON response                  │
└─────────────────────────────────────────┘
```

**Đặc điểm:**

- ✅ **Tách biệt**: AI service riêng, không ảnh hưởng web backend
- ✅ **Async**: Phân tích không block user
- ✅ **Fallback**: Nếu AI lỗi, hệ thống vẫn hoạt động bình thường

---

## 🎯 Ý Tưởng Sử Dụng

### 1. Toxic Detection

**Mục đích:**

- Tự động phát hiện nội dung độc hại (hate speech, spam, offensive)
- Giảm công việc moderator
- Bảo vệ cộng đồng

**Use Cases:**

```
User viết comment: "Mày ngu như heo"
                    ↓
            [AI phân tích]
                    ↓
        Kết quả: Toxic (90%)
                    ↓
        → Tự động pending review
        → Notify moderator
        → Warning cho user
```

**Dataset:** [ViTHSD](https://github.com/bakansm/ViTHSD) - Vietnamese Hate Speech Detection

**Kết quả AI:**

```json
{
  "is_toxic": true,
  "score": 0.92,
  "type": "hate_speech" // hoặc "spam", "offensive"
}
```

**Xử lý:**

- Score > 0.8: Tự động pending review
- Score 0.5-0.8: Warning cho user
- Score < 0.5: Cho phép đăng

---

### 2. Emotion Detection

**Mục đích:**

- Phân tích cảm xúc trong comment
- Tùy chỉnh UI theo cảm xúc (màu nền, icon)
- Đưa ra lời khuyên phù hợp

**8 Cảm Xúc:**

- 😊 Joy (vui vẻ)
- 😢 Sadness (buồn)
- 😠 Anger (tức giận)
- 😨 Fear (sợ hãi)
- 😲 Surprise (ngạc nhiên)
- 🤢 Disgust (ghê tởm)
- 🤝 Trust (tin tưởng)
- 😐 Neutral (trung lập)

**Use Cases:**

```
User viết: "Tôi rất tức giận về vấn đề này!"
                    ↓
            [AI phân tích]
                    ↓
        Kết quả: Anger (85%)
                    ↓
        → Hiển thị nền màu đỏ nhạt
        → Icon 😠
        → Suggestion: "Hãy bình tĩnh và thảo luận văn minh nhé!"
```

**Dataset:** `ai/emotions/dataset/*.xlsx` (sẵn có trong project)

**Kết quả AI:**

```json
{
  "emotion": "anger",
  "confidence": 0.85,
  "all_scores": {
    "anger": 0.85,
    "sadness": 0.1,
    "joy": 0.03,
    "neutral": 0.02
  }
}
```

**UI Tùy Chỉnh:**

- **Joy** → Nền vàng nhạt, khuyến khích chia sẻ thêm
- **Anger** → Nền đỏ nhạt, nhắc nhở bình tĩnh
- **Sadness** → Nền xanh nhạt, gợi ý support
- **Neutral** → Nền xám (default)

---

## 🔄 Luồng Hoạt Động

### Flow Tổng Quát

```
1. User tạo Post/Comment
         ↓
2. Backend nhận request
         ↓
3. AI Middleware gọi AI Service
         ↓
4. AI Service phân tích content
   - Toxic Detection
   - Emotion Detection
         ↓
5. Trả kết quả về Backend
         ↓
6. Lưu kết quả vào DB
   Post/Comment → aiAnalysis: {...}
         ↓
7. Xử lý logic
   - Nếu toxic → pending review
   - Lưu emotion để hiển thị UI
         ↓
8. Response về Frontend
         ↓
9. Frontend hiển thị theo emotion
   - Màu nền
   - Icon
   - Suggestions
```

### Chi Tiết Các Bước

**Backend (Node.js):**

1. Middleware nhận content
2. Gọi AI API qua HTTP
3. Nhận JSON response
4. Lưu vào field `aiAnalysis` của Post/Comment

**AI Service (Python):**

1. Flask API nhận request
2. Load models (PhoBERT)
3. Tokenize text
4. Predict với models
5. Format kết quả JSON
6. Return response

**Database:**

```javascript
// Post/Comment schema
aiAnalysis: {
  // Toxic
  isToxic: Boolean,
  toxicScore: Number,
  toxicType: String,

  // Emotion
  emotion: String,
  emotionScore: Number,

  analyzedAt: Date
}
```

**Frontend (React):**

- Đọc `aiAnalysis.emotion`
- Apply class CSS tương ứng
- Hiển thị icon và suggestion

---

## 🧪 Hướng Training Models

### 1. Môi Trường Training

**Nên dùng:** Google Colab (GPU miễn phí)

**Lý do:**

- ✅ GPU Tesla T4/P100 miễn phí
- ✅ Cài đặt sẵn TensorFlow/PyTorch
- ✅ Không cần cấu hình máy mạnh
- ✅ Share notebook dễ dàng

**Thư viện cần:**

```
tensorflow==2.13.0
transformers==4.30.0
pandas
openpyxl
scikit-learn
```

---

### 2. Quy Trình Training

#### A. Toxic Detection

**Bước 1: Chuẩn bị Dataset**

- Download [ViTHSD](https://github.com/bakansm/ViTHSD)
- Format: CSV với 3 columns (text, label, type)
- Split: 80% train, 20% validation

**Bước 2: Preprocessing**

- Tokenize bằng PhoBERT tokenizer
- Max length: 256 tokens
- Padding & truncation

**Bước 3: Model Architecture**

```
PhoBERT (Pretrained)
        ↓
[CLS] token pooling
        ↓
Dropout (0.3)
        ↓
Dense(3) + Softmax
        ↓
Output: [clean, hate_speech, spam]
```

**Bước 4: Training**

- Optimizer: Adam (lr=2e-5)
- Loss: Sparse Categorical Crossentropy
- Epochs: 5
- Batch size: 16
- Early stopping

**Bước 5: Export**

- Save model: `toxic_detection_v1.h5`
- Save tokenizer: folder riêng

**Target Metrics:**

- Accuracy: 85-90%
- F1-Score: ~0.85
- False Positive: <5%

---

#### B. Emotion Detection

**Bước 1: Dataset**

- Sử dụng: `ai/emotions/dataset/*.xlsx` (đã có)
- 8 emotions: joy, sadness, anger, fear, surprise, disgust, trust, neutral

**Bước 2-5: Tương tự Toxic Detection**

- Chỉ khác output layer: Dense(8) thay vì Dense(3)

**Target Metrics:**

- Accuracy: 75-80%
- F1-Score (macro): ~0.75

---

### 3. Workflow Training

```
1. Upload notebook lên Google Colab
         ↓
2. Mount Google Drive (lưu dataset)
         ↓
3. Install dependencies
         ↓
4. Load & preprocess data
         ↓
5. Build model (PhoBERT base)
         ↓
6. Train (5-10 epochs)
         ↓
7. Evaluate on validation set
         ↓
8. Save model & tokenizer
         ↓
9. Download về local: ai/toxic_detection/checkpoints/
         ↓
10. Deploy với Flask API
```

**Thời gian:**

- Setup: 10 phút
- Training toxic: 30-60 phút
- Training emotion: 30-60 phút
- Total: ~2 giờ

---

## 🚀 Deployment & Tích Hợp

### 1. AI Service (Python Flask)

**File:** `ai/api.py`

**Nhiệm vụ:**

- Load models (1 lần khi start)
- Expose endpoint `/api/ai/analyze`
- Nhận text → trả JSON

**Deploy:**

- Local: `python ai/api.py` (port 5000)
- Docker: Build image, run container
- Cloud: Deploy lên Heroku/Railway/Render

---

### 2. Backend Integration (Node.js)

**File:** `web/backend/utils/aiClient.js`

**Nhiệm vụ:**

- HTTP client gọi AI service
- Handle timeout & errors
- Graceful fallback nếu AI down

**File:** `web/backend/middleware/aiAnalysis.js`

**Nhiệm vụ:**

- Intercept request
- Gọi aiClient.analyze(content)
- Attach kết quả vào req.aiAnalysis

**Sử dụng:**

```javascript
// routes/postRoutes.js
router.post('/', authenticate, aiAnalysis, createPost);
                                    ↑
                             AI middleware
```

---

### 3. Database Schema

**Trong Post/Comment models:**

```javascript
aiAnalysis: {
  isToxic: Boolean,
  toxicScore: Number,
  toxicType: String,
  emotion: String,
  emotionScore: Number,
  analyzedAt: Date
}
```

**Lưu ý:**

- Lưu cả score để có thể tune threshold sau
- analyzedAt để tracking

---

### 4. Frontend Display

**Emotion Colors:**

```javascript
const emotionStyles = {
  joy: "bg-yellow-50 border-yellow-200",
  anger: "bg-red-50 border-red-200",
  sadness: "bg-blue-50 border-blue-200",
  // ...
};
```

**Suggestions:**

```javascript
const emotionAdvice = {
  anger: "Hãy bình tĩnh và thảo luận văn minh nhé!",
  sadness: "Mọi chuyện sẽ ổn thôi, hãy chia sẻ với cộng đồng!",
  // ...
};
```

**Component:**

```jsx
<CommentItem comment={comment}>
  <div className={emotionStyles[comment.aiAnalysis.emotion]}>
    {comment.content}
    {comment.aiAnalysis.emotion === "anger" && (
      <Alert>{emotionAdvice.anger}</Alert>
    )}
  </div>
</CommentItem>
```

---

## ⚙️ Optimization & Best Practices

### 1. Performance

**Caching:**

- Cache kết quả AI trong 1 giờ
- Giống nội dung → dùng cache, không gọi lại AI

**Async Processing:**

- Không block user khi đăng
- Gọi AI bất đồng bộ, update sau

**Batch Processing:**

- Nếu có nhiều comments cùng lúc
- Gọi AI theo batch để tối ưu

### 2. Error Handling

**AI Service Down:**

- Fallback: Cho phép đăng, đánh dấu "chưa phân tích"
- Không block user experience

**Low Confidence:**

- Score < 0.5: Không tin cậy
- → Bỏ qua kết quả, để moderator review

### 3. Privacy & Ethics

**Không lưu:**

- Raw content trong AI service
- Chỉ analyze rồi trả kết quả

**Transparent:**

- Hiển thị cho user biết đang dùng AI
- Cho phép report nếu AI sai

---

## 📊 Monitoring

### Metrics Cần Theo Dõi

**AI Service:**

- Latency (target: <100ms)
- Success rate (target: >99%)
- Error rate

**Accuracy:**

- User reports (AI sai)
- Moderator overrides
- False positive rate

**Usage:**

- Requests per day
- Most common emotions
- Toxic rate (% toxic content)

---

## 🎯 Roadmap

### Phase 1: MVP (Hiện tại)

- [x] 2 models: Toxic + Emotion
- [x] Basic integration
- [x] Simple UI (emotion colors)

### Phase 2: Improvements

- [ ] Fine-tune models với data từ forum
- [ ] Multi-language support
- [ ] Sarcasm detection

### Phase 3: Advanced

- [ ] Real-time suggestions khi typing
- [ ] Context-aware detection (thread history)
- [ ] Personalized emotion analysis

---

## 📝 Tóm Tắt

### ✅ Kiến Trúc

- **Tách biệt**: Web Backend ↔ AI Service (HTTP)
- **Models**: PhoBERT-based (Vietnamese optimized)
- **Deployment**: Flask API + Docker

### ✅ Training

- **Môi trường**: Google Colab (GPU free)
- **Datasets**: ViTHSD + emotions/\*.xlsx
- **Thời gian**: ~2 giờ total

### ✅ Tích Hợp

- **Backend**: Middleware → AI Client → Database
- **Frontend**: Emotion styles + Suggestions
- **Optimization**: Caching + Async + Fallback

### ✅ Features

- **Toxic Detection**: Auto review (>80%), warning (50-80%)
- **Emotion Detection**: 8 emotions, UI colors, advice
- **UX**: Không block user, graceful degradation

---

**Kết luận:** Hệ thống AI đơn giản, dễ triển khai, tập trung vào trải nghiệm người dùng! 🚀
