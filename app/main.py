import io
import json
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from torchvision import models, transforms

# ── Config ────────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent

if torch.backends.mps.is_available():
    DEVICE = torch.device("mps")
elif torch.cuda.is_available():
    DEVICE = torch.device("cuda")
else:
    DEVICE = torch.device("cpu")

with open(BASE / "labels.json") as f:
    IDX_TO_LABEL: dict[int, str] = {int(k): v for k, v in json.load(f).items()}

NUM_CLASSES = len(IDX_TO_LABEL)

# ── Model ─────────────────────────────────────────────────────────────────────
model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)
model.load_state_dict(torch.load(BASE / "model.pth", map_location=DEVICE))
model.eval().to(DEVICE)

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Disposal guide ────────────────────────────────────────────────────────────
DISPOSAL: dict[str, dict] = {
    "battery":    {"emoji": "🔋", "bin": "Hazardous Waste",     "color": "#ef4444",
                   "tip": "Take to a certified battery drop-off or electronics store."},
    "biological": {"emoji": "🍃", "bin": "Organic / Green Bin", "color": "#22c55e",
                   "tip": "Compost at home or place in the organic waste bin."},
    "cardboard":  {"emoji": "📦", "bin": "Recycling Bin",       "color": "#3b82f6",
                   "tip": "Flatten the box and place in the blue recycling bin."},
    "clothes":    {"emoji": "👕", "bin": "Textile Recycling",   "color": "#a855f7",
                   "tip": "Donate or drop at a textile recycling collection point."},
    "glass":      {"emoji": "🫙", "bin": "Glass Recycling",     "color": "#06b6d4",
                   "tip": "Rinse and place in the dedicated glass container."},
    "metal":      {"emoji": "🥫", "bin": "Metal / Recycling",   "color": "#f59e0b",
                   "tip": "Rinse cans and place in the metal or recycling bin."},
    "paper":      {"emoji": "📄", "bin": "Recycling Bin",       "color": "#3b82f6",
                   "tip": "Place loose paper in the blue recycling bin."},
    "plastic":    {"emoji": "♻️", "bin": "Plastic Recycling",   "color": "#eab308",
                   "tip": "Rinse the container and place in the yellow/plastic bin."},
    "shoes":      {"emoji": "👟", "bin": "Textile Recycling",   "color": "#a855f7",
                   "tip": "Donate wearable shoes or drop at a textile recycling point."},
    "trash":      {"emoji": "🗑️", "bin": "General Waste",       "color": "#6b7280",
                   "tip": "Place in the general waste (black or grey) bin."},
}

# ── API ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="EcoSortAI")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
        confidence, pred_idx = probs.max(0)

    label = IDX_TO_LABEL[pred_idx.item()]
    info  = DISPOSAL[label]

    return {
        "label":      label,
        "confidence": round(confidence.item() * 100, 1),
        "emoji":      info["emoji"],
        "bin":        info["bin"],
        "color":      info["color"],
        "tip":        info["tip"],
    }


# ── Static frontend (must be last) ───────────────────────────────────────────
app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="static")
