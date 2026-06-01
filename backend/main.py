# EcoSortAI FastAPI backend.
# Accepts an image upload, runs EfficientNet-B0 inference,
# and returns the predicted waste class with recycling guidance.
#
# Run with:
#   uvicorn main:app --host 0.0.0.0 --port 8000

import io

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from model_loader import CLASSES, DEVICE, TRANSFORM, load_model
from recycling_rules import CONFIDENCE_THRESHOLD, RECYCLING_RULES

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(title="EcoSortAI", version="1.0")

# Allow all origins so the React Native app (running on a phone) can reach this server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Load the model once at startup so every request reuses the same instance.
model = load_model()


# ── Predict endpoint ──────────────────────────────────────────────────────────

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accept a waste image and return:
    - predicted_class
    - confidence (0-1 float)
    - top_3_predictions
    - material, bin_category, recycling_advice (from RECYCLING_RULES)
    - low_confidence flag and optional warning message
    """
    # Return a clear error if the model file was never placed
    if model is None:
        return {
            "error": (
                "Model file not found. "
                "Place best_model.pth in backend/saved_model/ and restart the server."
            ),
            "predicted_class": None,
            "confidence": None,
            "top_3_predictions": [],
            "material": None,
            "bin_category": None,
            "recycling_advice": None,
            "low_confidence": None,
            "warning": None,
        }

    # Parse the uploaded image
    try:
        raw = await file.read()
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, Exception):
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file.")

    # Preprocess and run inference
    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]

    # Top-3 predictions
    top3_vals, top3_idxs = probs.topk(3)
    top3 = [
        {"class": CLASSES[i.item()], "confidence": round(v.item(), 4)}
        for i, v in zip(top3_idxs, top3_vals)
    ]

    predicted_class = top3[0]["class"]
    confidence = top3[0]["confidence"]
    rule = RECYCLING_RULES[predicted_class]
    low_confidence = confidence < CONFIDENCE_THRESHOLD

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "top_3_predictions": top3,
        "material": rule["material"],
        "bin_category": rule["bin_category"],
        "recycling_advice": rule["advice"],
        "low_confidence": low_confidence,
        "warning": (
            "Low confidence: manual verification recommended."
            if low_confidence else None
        ),
    }


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
