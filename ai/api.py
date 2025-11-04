"""
FILE: ai/api.py
MỤC ĐÍCH: Python Flask API cho AI Models (Toxic Detection + Emotion Detection)
LIÊN QUAN:
  - ai/toxics/v2/ (model toxic detection)
  - ai/emotions/ (model emotion detection - tương lai)
  - web/backend/utils/aiClient.js
  - web/backend/middleware/aiAnalysis.js
CHỨC NĂNG:
  - Nhận text từ backend Node.js
  - Phân tích toxic/spam/hate speech
  - Phân tích cảm xúc (tương lai)
  - Trả về JSON kết quả
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import onnxruntime as ort
from tokenizers import Tokenizer
from transformers import AutoTokenizer

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
MAX_LENGTH = 160
TOXIC_THRESHOLD = 0.5  # Nếu score > threshold thì coi là toxic

# Global variables for models
toxic_model = None
toxic_tokenizer = None
emotion_model = None
emotion_tokenizer = None

# Labels cho toxic detection (binary classification: 0 = clean, 1 = toxic)
TOXIC_LABELS = {
    0: "clean",   # Không độc hại
    1: "toxic"    # Độc hại
}

# Labels cho emotion detection (từ model vinai/phobert-base-v2)
# Model có 7 classes: Anger, Disgust, Enjoyment, Fear, Other, Sadness, Surprise
EMOTION_LABELS = {
    0: "anger",
    1: "disgust",
    2: "enjoyment",  # "joy" trong model
    3: "fear",
    4: "other",      # "neutral" trong model
    5: "sadness",
    6: "surprise"
}


def load_models():
    """
    Load ONNX models và tokenizer khi start server
    """
    global toxic_model, toxic_tokenizer, emotion_model, emotion_tokenizer
    
    try:
        # Load tokenizer
        tokenizer_path = os.path.join(os.path.dirname(__file__), "toxics/v3/tokenizer.json")
        if os.path.exists(tokenizer_path):
            toxic_tokenizer = Tokenizer.from_file(tokenizer_path)
            print("✅ Loaded tokenizer:", tokenizer_path)
        else:
            print("⚠️  Tokenizer not found at:", tokenizer_path)
        
        # Load ONNX model
        model_path = os.path.join(os.path.dirname(__file__), "toxics/v3/model.onnx")
        if os.path.exists(model_path):
            toxic_model = ort.InferenceSession(model_path)
            print("✅ Loaded toxic model:", model_path)
        else:
            print("⚠️  Model not found at:", model_path)
            
        # Load Emotion ONNX và tokenizer (tùy chọn)
        try:
            emotion_dir = os.path.join(os.path.dirname(__file__), "emotions/best")
            emotion_model_path = os.path.join(emotion_dir, "model.onnx")
            
            if os.path.exists(emotion_model_path) and os.path.getsize(emotion_model_path) > 0:
                # Load ONNX model
                emotion_model = ort.InferenceSession(emotion_model_path)
                globals()["emotion_model"] = emotion_model
                print("✅ Loaded emotion model:", emotion_model_path)
                
                # Load tokenizer từ transformers (PhobertTokenizer)
                try:
                    emotion_tokenizer = AutoTokenizer.from_pretrained(emotion_dir)
                    globals()["emotion_tokenizer"] = emotion_tokenizer
                    print("✅ Loaded emotion tokenizer from:", emotion_dir)
                except Exception as e_tokenizer:
                    print(f"⚠️  Could not load emotion tokenizer: {e_tokenizer}")
                    print("⚠️  Emotion model will use toxic tokenizer as fallback")
            else:
                print("ℹ️  Emotion model not found (optional):", emotion_model_path)
        except Exception as e2:
            print(f"❌ Error loading emotion model: {e2}")

        print("🚀 AI Service ready!")
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        print("⚠️  AI Service will continue without models (fallback mode)")


def preprocess_text(text):
    """
    Preprocess text: tokenize và convert sang format cho model
    """
    if not toxic_tokenizer:
        return None
    
    # Tokenize
    encoded = toxic_tokenizer.encode(text)
    
    # Get token IDs
    token_ids = encoded.ids
    
    # Pad or truncate to MAX_LENGTH
    if len(token_ids) > MAX_LENGTH:
        token_ids = token_ids[:MAX_LENGTH]
    else:
        token_ids = token_ids + [0] * (MAX_LENGTH - len(token_ids))
    
    # Convert to numpy array with shape [1, MAX_LENGTH]
    input_ids = np.array([token_ids], dtype=np.int64)
    
    # Attention mask: 1 for real tokens, 0 for padding
    attention_mask = np.array([[1 if i < len(encoded.ids) else 0 for i in range(MAX_LENGTH)]], dtype=np.int64)
    
    return input_ids, attention_mask


def predict_toxic(text):
    """
    Predict toxic score và type
    Returns: (is_toxic, score, type)
    """
    if not toxic_model or not toxic_tokenizer:
        # Fallback: return safe default
        return False, 0.0, "clean"
    
    try:
        # Preprocess
        input_ids, attention_mask = preprocess_text(text)
        
        if input_ids is None:
            return False, 0.0, "clean"
        
        # Predict
        outputs = toxic_model.run(None, {
            "input_ids": input_ids,
            "attention_mask": attention_mask
        })
        
        # Get probabilities (shape: [1, 2]) - binary classification
        logits = outputs[0][0]
        probs = np.exp(logits) / np.sum(np.exp(logits))
        
        # Get predicted class (0 = clean, 1 = toxic)
        predicted_class = int(np.argmax(probs))
        
        # Score for toxic class (probability of being toxic)
        toxic_probability = float(probs[1])  # Probability of class 1 (toxic)
        
        # is_toxic = True nếu predicted_class = 1
        is_toxic = predicted_class == 1
        toxic_type = "toxic" if is_toxic else "clean"
        
        return is_toxic, toxic_probability, toxic_type
        
    except Exception as e:
        print(f"❌ Error predicting toxic: {e}")
        # Fallback
        return False, 0.0, "clean"


def preprocess_emotion_text(text):
    """
    Preprocess text cho emotion model (PhobertTokenizer)
    Returns: (input_ids, attention_mask) với shape [1, MAX_LENGTH]
    """
    if not emotion_tokenizer:
        # Fallback to toxic tokenizer nếu không có emotion tokenizer
        if toxic_tokenizer:
            return preprocess_text(text)
        return None, None
    
    try:
        # Tokenize với emotion tokenizer (PhobertTokenizer)
        encoded = emotion_tokenizer(
            text,
            truncation=True,
            max_length=MAX_LENGTH,
            padding="max_length",
            return_tensors="np"
        )
        
        input_ids = encoded["input_ids"].astype(np.int64)
        attention_mask = encoded["attention_mask"].astype(np.int64)
        
        return input_ids, attention_mask
    except Exception as e:
        print(f"❌ Error preprocessing emotion text: {e}")
        return None, None


def predict_emotion(text):
    """
    Predict emotion bằng ONNX model (PhoBERT-based)
    Model input: input_ids, attention_mask
    Returns: (label, confidence)
    """
    try:
        if emotion_model is None:
            return "other", 0.0  # "other" thay vì "neutral" để match model

        # Preprocess text với emotion tokenizer
        input_ids, attention_mask = preprocess_emotion_text(text)
        
        if input_ids is None:
            return "other", 0.0

        # Get input names từ model
        inputs = emotion_model.get_inputs()
        input_names = [i.name for i in inputs]

        # Map input names (có thể là "input_ids", "input_ids:0", hoặc tên khác)
        feed = {}
        name_map = {n.lower(): n for n in input_names}
        
        # Tìm input_ids input
        if "input_ids" in name_map:
            feed[name_map["input_ids"]] = input_ids
        elif any("input" in n.lower() or "ids" in n.lower() for n in input_names):
            # Tìm input đầu tiên có "input" hoặc "ids"
            for name in input_names:
                if "input" in name.lower() or "ids" in name.lower():
                    feed[name] = input_ids
                    break
        else:
            # Fallback: dùng input đầu tiên
            feed[inputs[0].name] = input_ids

        # Tìm attention_mask input
        if "attention_mask" in name_map:
            feed[name_map["attention_mask"]] = attention_mask
        elif any("mask" in n.lower() or "attention" in n.lower() for n in input_names):
            # Tìm input có "mask" hoặc "attention"
            for name in input_names:
                if "mask" in name.lower() or "attention" in name.lower():
                    feed[name] = attention_mask
                    break

        # Run inference
        outputs = emotion_model.run(None, feed)

        # Get logits (shape: [1, 7] cho 7 classes)
        logits = outputs[0][0] if len(outputs[0].shape) > 1 else outputs[0]
        
        # Softmax
        exp = np.exp(logits - np.max(logits))
        probs = exp / np.sum(exp)
        idx = int(np.argmax(probs))

        # Map label từ EMOTION_LABELS
        label = EMOTION_LABELS.get(idx, "other")
        confidence = float(probs[idx]) if 0 <= idx < len(probs) else 0.0
        
        return label, round(confidence, 4)

    except Exception as e:
        print(f"❌ Error predicting emotion: {e}")
        import traceback
        traceback.print_exc()
        return "other", 0.0


@app.route("/api/ai/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "success": True,
        "message": "AI Service is running",
        "models": {
            "toxic": toxic_model is not None,
            "emotion": emotion_model is not None
        }
    })


@app.route("/api/ai/analyze", methods=["POST"])
def analyze():
    """
    Main endpoint: Nhận text và phân tích toxic + emotion
    Request body:
    {
        "text": "string to analyze"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "isToxic": boolean,
            "toxicScore": float,
            "toxicType": "clean|individual|groups|religion/creed|race/ethnicity|politics",
            "emotion": "string",
            "emotionScore": float
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or "text" not in data:
            return jsonify({
                "success": False,
                "message": "Missing 'text' field in request body"
            }), 400
        
        text = data["text"]
        
        if not text or len(text.strip()) == 0:
            return jsonify({
                "success": False,
                "message": "Text is empty"
            }), 400
        
        # Predict toxic
        is_toxic, toxic_score, toxic_type = predict_toxic(text)
        
        # Predict emotion (placeholder)
        emotion, emotion_score = predict_emotion(text)
        
        # Log kết quả
        print(f"📝 Text: {text[:100]}...")
        print(f"🤖 AI Result: isToxic={is_toxic}, score={toxic_score:.4f}, type={toxic_type}, emotion={emotion}, emotionScore={emotion_score:.4f}")
        
        # Build response
        result = {
            "success": True,
            "data": {
                "isToxic": is_toxic,
                "toxicScore": round(toxic_score, 4),
                "toxicType": toxic_type,
                "emotion": emotion,
                "emotionScore": round(emotion_score, 4)
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error in analyze endpoint: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/api/ai/analyze/batch", methods=["POST"])
def analyze_batch():
    """
    Batch analyze nhiều texts cùng lúc
    Request body:
    {
        "texts": ["text1", "text2", ...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or "texts" not in data:
            return jsonify({
                "success": False,
                "message": "Missing 'texts' array in request body"
            }), 400
        
        texts = data["texts"]
        results = []
        
        for text in texts:
            is_toxic, toxic_score, toxic_type = predict_toxic(text)
            emotion, emotion_score = predict_emotion(text)
            
            results.append({
                "isToxic": is_toxic,
                "toxicScore": round(toxic_score, 4),
                "toxicType": toxic_type,
                "emotion": emotion,
                "emotionScore": round(emotion_score, 4)
            })
        
        return jsonify({
            "success": True,
            "data": results
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


if __name__ == "__main__":
    # Load models on startup
    load_models()
    
    # Get port from env or default to 6000
    port = int(os.environ.get("AI_SERVICE_PORT", 6000))
    
    print(f"\n{'='*50}")
    print("🤖 AI Service Starting...")
    print(f"   Port: {port}")
    print(f"   Models: Toxic Detection, Emotion Detection")
    print(f"{'='*50}\n")
    
    # Run app
    app.run(host="0.0.0.0", port=port, debug=False)