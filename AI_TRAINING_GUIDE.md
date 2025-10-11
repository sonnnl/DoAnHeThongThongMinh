# Hướng Dẫn Train AI Models trên Google Colab

## 📚 Tổng Quan

Bạn cần train 2 models:

1. **Toxic Detection** - Phát hiện spam, hate speech, harassment
2. **Emotion Detection** - Phát hiện 8 cảm xúc

## 🚀 Bước 1: Chuẩn Bị Dataset

### Toxic Detection Dataset

**Option 1: Download từ GitHub**

- Repo: https://github.com/bakansm/ViTHSD
- Download file CSV với format:
  ```csv
  text,label
  "Nội dung bình thường",clean
  "Spam content",spam
  "Hate speech",hate_speech
  "Quấy rối",harassment
  ```

**Option 2: Tự tạo dataset**

- Tạo file `toxic_dataset.csv` với 4 labels: clean, spam, hate_speech, harassment
- Mỗi label nên có ít nhất 500-1000 samples
- Upload lên Google Drive

### Emotion Detection Dataset

Dataset **đã có sẵn** trong `ai/emotions/dataset/`:

- `train_nor_811.xlsx` - Training data
- `test_nor_811.xlsx` - Test data

Format:

```
text,emotion
"Tôi rất vui",joy
"Buồn quá",sadness
```

8 emotions: joy, sadness, anger, fear, surprise, neutral, love, disgust

## 🔧 Bước 2: Setup Google Colab

### 2.1. Tạo Notebook mới

1. Vào https://colab.research.google.com
2. Tạo notebook mới
3. Chọn **Runtime** → **Change runtime type** → **GPU** (T4 hoặc cao hơn)

### 2.2. Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

### 2.3. Tạo Cấu Trúc Thư Mục

```python
BASE_PATH = '/content/drive/MyDrive/DoAnHTTM/ai'

# Tạo thư mục
import os
os.makedirs(f'{BASE_PATH}/toxic_detection/dataset', exist_ok=True)
os.makedirs(f'{BASE_PATH}/toxic_detection/checkpoints', exist_ok=True)
os.makedirs(f'{BASE_PATH}/toxic_detection/logs', exist_ok=True)

os.makedirs(f'{BASE_PATH}/emotions/dataset', exist_ok=True)
os.makedirs(f'{BASE_PATH}/emotions/checkpoints', exist_ok=True)
os.makedirs(f'{BASE_PATH}/emotions/logs', exist_ok=True)
```

## 📝 Bước 3: Train Toxic Detection Model

### 3.1. Copy Code

Copy toàn bộ code từ `ai/toxic_detection/train.py` vào Colab notebook.

### 3.2. Upload Dataset

Upload file `toxic_dataset.csv` vào:

```
/content/drive/MyDrive/DoAnHTTM/ai/toxic_detection/dataset/
```

### 3.3. Chạy Training

```python
# Chạy từng cell theo thứ tự
# Hoặc chạy toàn bộ: Runtime → Run all
```

**Thời gian training:**

- T4 GPU: ~2-3 giờ (10 epochs)
- CPU: ~10-15 giờ

**Kết quả mong đợi:**

- Training Accuracy: ~85-90%
- Validation F1: ~85-90%
- Test Accuracy: ~85-90%

### 3.4. Download Model

Sau khi train xong, model sẽ lưu tại:

```
/content/drive/MyDrive/DoAnHTTM/ai/toxic_detection/checkpoints/best_model.pt
```

Download về máy và đặt vào:

```
DoAnHTTM/ai/toxic_detection/checkpoints/best_model.pt
```

## 🎭 Bước 4: Train Emotion Detection Model

### 4.1. Copy Code

Tương tự như toxic detection, nhưng thay đổi:

```python
# Change num_classes
num_classes = 8  # Instead of 4

# Change labels
emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral', 'love', 'disgust']
label2id = {label: i for i, label in enumerate(emotions)}
id2label = {i: label for i, label in enumerate(emotions)}

# Load from Excel instead of CSV
import pandas as pd
train_data = pd.read_excel(f'{BASE_PATH}/emotions/dataset/train_nor_811.xlsx')
test_data = pd.read_excel(f'{BASE_PATH}/emotions/dataset/test_nor_811.xlsx')
```

### 4.2. Upload Dataset

Upload 2 files Excel vào:

```
/content/drive/MyDrive/DoAnHTTM/ai/emotions/dataset/
```

### 4.3. Chạy Training

**Thời gian:** ~3-4 giờ với T4 GPU

**Kết quả mong đợi:**

- Training Accuracy: ~80-85%
- Validation F1: ~80-85%

### 4.4. Download Model

Download file `best_model.pt` về:

```
DoAnHTTM/ai/emotions/checkpoints/best_model.pt
```

## 🧪 Bước 5: Test Models

### Test Toxic Detection

```python
def predict_toxic(text, model, tokenizer, device):
    model.eval()
    encoding = tokenizer(text, max_length=256, padding='max_length',
                        truncation=True, return_tensors='pt')

    with torch.no_grad():
        outputs = model(encoding['input_ids'].to(device),
                       encoding['attention_mask'].to(device))
        probs = torch.softmax(outputs, dim=1)
        pred_class = torch.argmax(probs, dim=1).item()

    return {
        'label': id2label[pred_class],
        'confidence': probs[0][pred_class].item(),
        'is_toxic': id2label[pred_class] != 'clean'
    }

# Test
test_texts = [
    "Bài viết rất hay và bổ ích!",
    "Spam spam spam",
    "Người này ngu ngốc quá"
]

for text in test_texts:
    result = predict_toxic(text, model, tokenizer, device)
    print(f"Text: {text}")
    print(f"Result: {result}\n")
```

### Test Emotion Detection

```python
def predict_emotion(text, model, tokenizer, device):
    # Similar to toxic detection
    ...

test_texts = [
    "Hôm nay tôi rất vui!",
    "Buồn quá...",
    "Tức giận quá!"
]

for text in test_texts:
    result = predict_emotion(text, model, tokenizer, device)
    print(f"Text: {text}")
    print(f"Emotion: {result['emotion']} (confidence: {result['confidence']:.2f})\n")
```

## 📊 Bước 6: Model Evaluation

### Confusion Matrix

```python
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix

# Get predictions
y_true, y_pred = [], []
for batch in test_loader:
    outputs = model(batch['input_ids'].to(device),
                   batch['attention_mask'].to(device))
    preds = torch.argmax(outputs, dim=1)
    y_true.extend(batch['label'].tolist())
    y_pred.extend(preds.cpu().tolist())

# Plot
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=list(label2id.keys()),
            yticklabels=list(label2id.keys()))
plt.title('Confusion Matrix')
plt.ylabel('True')
plt.xlabel('Predicted')
plt.show()
```

## 🔄 Bước 7: Deploy Models

### 7.1. Copy Models

Copy 2 files `best_model.pt` về máy local vào đúng thư mục:

```
DoAnHTTM/
├── ai/
│   ├── toxic_detection/
│   │   └── checkpoints/
│   │       └── best_model.pt  ← Copy vào đây
│   └── emotions/
│       └── checkpoints/
│           └── best_model.pt  ← Copy vào đây
```

### 7.2. Update .env

```env
TOXIC_MODEL_PATH=./toxic_detection/checkpoints/best_model.pt
EMOTION_MODEL_PATH=./emotions/checkpoints/best_model.pt
```

### 7.3. Start AI Service

```bash
cd ai
python api.py
```

Test API:

```bash
curl -X POST http://localhost:8000/api/ai/toxic \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test text"}'
```

## 💡 Tips & Best Practices

### Training Tips

1. **Batch Size:**

   - T4 GPU: batch_size = 16-32
   - CPU: batch_size = 8-16
   - OOM error → giảm batch size

2. **Learning Rate:**

   - Start với 2e-5 (recommended for PhoBERT)
   - Nếu loss không giảm → tăng lên 3e-5 hoặc 5e-5

3. **Epochs:**

   - 10 epochs thường đủ
   - Nếu val_loss tăng sớm → có thể giảm xuống 5-7 epochs

4. **Early Stopping:**
   - Implement nếu val_loss không improve sau 3 epochs

### Data Augmentation

```python
# Back translation (dịch qua lại)
# Synonym replacement
# Random insertion/deletion
# ...
```

### Model Optimization

**Quantization** (giảm model size):

```python
import torch.quantization as quantization

# Dynamic quantization
model_quantized = quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)

# Save
torch.save(model_quantized.state_dict(), 'model_quantized.pt')
```

**ONNX Export** (faster inference):

```python
# Export to ONNX
dummy_input = torch.randint(0, 1000, (1, 256)).to(device)
dummy_mask = torch.ones(1, 256).to(device)

torch.onnx.export(
    model,
    (dummy_input, dummy_mask),
    'model.onnx',
    input_names=['input_ids', 'attention_mask'],
    output_names=['logits']
)
```

## 🐛 Troubleshooting

### CUDA Out of Memory

```python
# Giảm batch size
BATCH_SIZE = 8  # Instead of 16

# Clear cache
torch.cuda.empty_cache()

# Gradient accumulation
accumulation_steps = 2
for i, batch in enumerate(train_loader):
    loss = loss / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

### Model không học (loss không giảm)

1. Check learning rate (có thể quá nhỏ hoặc quá lớn)
2. Check data (labels có đúng không?)
3. Try unfreeze BERT layers:
   ```python
   for param in model.bert.parameters():
       param.requires_grad = True
   ```

### Overfitting (train acc cao, val acc thấp)

1. Tăng dropout: 0.3 → 0.5
2. Data augmentation
3. Early stopping
4. Regularization (weight decay)

## 📚 Resources

- **PhoBERT Paper:** https://arxiv.org/abs/2003.00744
- **Transformers Docs:** https://huggingface.co/docs/transformers
- **PyTorch Tutorial:** https://pytorch.org/tutorials/
- **Google Colab Tips:** https://colab.research.google.com/notebooks/

## ✅ Checklist

- [ ] Setup Google Colab với GPU
- [ ] Mount Google Drive
- [ ] Upload toxic detection dataset
- [ ] Train toxic detection model (10 epochs)
- [ ] Download toxic model checkpoint
- [ ] Upload emotion detection dataset
- [ ] Train emotion detection model (10 epochs)
- [ ] Download emotion model checkpoint
- [ ] Test both models với examples
- [ ] Copy models về local project
- [ ] Start AI service và test API
- [ ] Integrate AI vào backend

---

**Chúc bạn training thành công! 🚀**

Nếu gặp vấn đề, hãy check logs và error messages để debug.
