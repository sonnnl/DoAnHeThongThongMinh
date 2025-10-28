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

# Labels cho toxic detection (binary classification: 0 = clean, 1 = toxic)
TOXIC_LABELS = {
    0: "clean",   # Không độc hại
    1: "toxic"    # Độc hại
}

# Labels cho emotion detection (tương lai)
EMOTION_LABELS = {
    0: "joy",
    1: "sadness",
    2: "anger",
    3: "fear",
    4: "surprise",
    5: "disgust",
    6: "trust",
    7: "neutral"
}


def load_models():
    """
    Load ONNX models và tokenizer khi start server
    """
    global toxic_model, toxic_tokenizer
    
    try:
        # Load tokenizer
        tokenizer_path = os.path.join(os.path.dirname(__file__), "toxics/v2/tokenizer.json")
        if os.path.exists(tokenizer_path):
            toxic_tokenizer = Tokenizer.from_file(tokenizer_path)
            print("✅ Loaded tokenizer:", tokenizer_path)
        else:
            print("⚠️  Tokenizer not found at:", tokenizer_path)
        
        # Load ONNX model
        model_path = os.path.join(os.path.dirname(__file__), "toxics/v2/model.onnx")
        if os.path.exists(model_path):
            toxic_model = ort.InferenceSession(model_path)
            print("✅ Loaded toxic model:", model_path)
        else:
            print("⚠️  Model not found at:", model_path)
            
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


def predict_emotion(text):
    """
    Predict emotion (placeholder cho tương lai)
    Hiện tại return default neutral
    """
    # TODO: Load emotion model khi có
    return "neutral", 0.0


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
            "emotion": False  # Tương lai
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
        print(f"🤖 AI Result: isToxic={is_toxic}, score={toxic_score:.4f}, type={toxic_type}")
        
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
    print(f"   Models: Toxic Detection")
    print(f"{'='*50}\n")
    
    # Run app
    app.run(host="0.0.0.0", port=port, debug=False)

