"""
EcoSortAI — FastAPI backend + PWA frontend server.

Serves:
  POST /predict   — waste image classification
  GET  /health    — liveness check
  GET  /*         — PWA static files (index.html, manifest.json, sw.js …)

Run:
  uvicorn main:app --host 0.0.0.0 --port 8000
  uvicorn main:app --host 0.0.0.0 --port 8000 --ssl-keyfile cert/key.pem --ssl-certfile cert/cert.pem
"""

import io
import json
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE        = Path(__file__).parent
MODEL_PATH  = BASE / "saved_model" / "best_model.pth"
LABELS_PATH = BASE / "labels.json"

# ── Device ─────────────────────────────────────────────────────────────────────
if torch.cuda.is_available():
    DEVICE = torch.device("cuda")
elif torch.backends.mps.is_available():
    DEVICE = torch.device("mps")
else:
    DEVICE = torch.device("cpu")

# ── Labels ─────────────────────────────────────────────────────────────────────
with open(LABELS_PATH) as f:
    IDX_TO_LABEL: dict[int, str] = {int(k): v for k, v in json.load(f).items()}

CLASSES     = [IDX_TO_LABEL[i] for i in range(len(IDX_TO_LABEL))]
NUM_CLASSES = len(CLASSES)

CONFIDENCE_THRESHOLD = 0.70

# ── Model ──────────────────────────────────────────────────────────────────────
def _load_model():
    m = models.efficientnet_b0(weights=None)
    m.classifier[1] = nn.Linear(m.classifier[1].in_features, NUM_CLASSES)
    if not MODEL_PATH.exists():
        print(f"[EcoSortAI] WARNING: model not found at {MODEL_PATH}")
        print("[EcoSortAI] Run the notebook (Section 18) to train and export best_model.pth")
        return None
    m.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    m.eval().to(DEVICE)
    print(f"[EcoSortAI] Model loaded  ({DEVICE})")
    return m

model = _load_model()

# ── Inference transform (matches val/test from notebook) ───────────────────────
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Recycling rules ────────────────────────────────────────────────────────────
RECYCLING_RULES = {
    "battery":    {"emoji": "🔋", "material": "Battery / hazardous electronic waste",
                   "bin_category": "Hazardous waste collection point",
                   "advice": "Do not throw batteries in regular trash. Take them to a battery collection box.",
                   "color": "#ef4444"},
    "biological": {"emoji": "🌿", "material": "Organic biodegradable waste",
                   "bin_category": "Organic / compost bin",
                   "advice": "Dispose of it in organic waste or compost when possible.",
                   "color": "#16a34a"},
    "cardboard":  {"emoji": "📦", "material": "Cardboard / paper fiber",
                   "bin_category": "Paper and cardboard recycling bin",
                   "advice": "Flatten cardboard before recycling.",
                   "color": "#3b82f6"},
    "clothes":    {"emoji": "👕", "material": "Textile material",
                   "bin_category": "Textile donation or textile recycling point",
                   "advice": "Donate usable clothes or take damaged textiles to a textile collection point.",
                   "color": "#a855f7"},
    "glass":      {"emoji": "🫙", "material": "Glass",
                   "bin_category": "Glass recycling bin",
                   "advice": "Recycle glass bottles and jars separately when possible.",
                   "color": "#06b6d4"},
    "metal":      {"emoji": "🥫", "material": "Metal / aluminum / steel",
                   "bin_category": "Metal recycling bin",
                   "advice": "Rinse cans before recycling if possible.",
                   "color": "#f59e0b"},
    "paper":      {"emoji": "📄", "material": "Paper",
                   "bin_category": "Paper recycling bin",
                   "advice": "Keep paper clean and dry before recycling.",
                   "color": "#3b82f6"},
    "plastic":    {"emoji": "♻️", "material": "Plastic packaging or synthetic polymer",
                   "bin_category": "Plastic recycling bin",
                   "advice": "Empty and clean plastic containers before recycling.",
                   "color": "#eab308"},
    "shoes":      {"emoji": "👟", "material": "Textile, rubber, leather or synthetic material",
                   "bin_category": "Textile/shoe donation or special collection point",
                   "advice": "Donate usable shoes or take them to a dedicated collection point.",
                   "color": "#a855f7"},
    "trash":      {"emoji": "🗑️", "material": "Mixed or non-recyclable waste",
                   "bin_category": "General waste bin",
                   "advice": "If the item cannot be cleaned or separated, dispose of it as general waste.",
                   "color": "#6b7280"},
}

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(title="EcoSortAI", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None, "device": str(DEVICE)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {
            "error": "Model not loaded. Place best_model.pth in app/saved_model/ and restart.",
            "predicted_class": None,
        }

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except (UnidentifiedImageError, Exception):
        raise HTTPException(status_code=400, detail="Invalid image file.")

    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]

    top3_vals, top3_idxs = probs.topk(3)
    top3 = [
        {"class": CLASSES[i.item()], "confidence": round(v.item(), 4)}
        for i, v in zip(top3_idxs, top3_vals)
    ]

    predicted_class = top3[0]["class"]
    confidence      = top3[0]["confidence"]
    rule            = RECYCLING_RULES[predicted_class]
    low_confidence  = confidence < CONFIDENCE_THRESHOLD

    return {
        "predicted_class":   predicted_class,
        "confidence":        confidence,
        "top_3_predictions": top3,
        "material":          rule["material"],
        "bin_category":      rule["bin_category"],
        "recycling_advice":  rule["advice"],
        "emoji":             rule["emoji"],
        "color":             rule["color"],
        "low_confidence":    low_confidence,
        "warning": "Low confidence: manual verification recommended." if low_confidence else None,
    }


# Static files must be mounted last (catches all unmatched routes)
app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="static")
