"""FastAPI backend for EcoSortAI waste image classification."""

import io

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from model_loader import MODEL_PATH, get_model_load_message, load_model, predict_image
from recycling_rules import get_recycling_info

LOW_CONFIDENCE_MESSAGE = "Low confidence: manual verification recommended."

app = FastAPI(title="EcoSortAI Backend", version="1.0.0")

# CORS is enabled so the Expo/Vercel frontend can call this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()


@app.get("/health")
def health() -> dict:
    """Return API status and whether the trained model is available."""
    if model is None:
        return {
            "status": "ok",
            "model_loaded": False,
            "message": get_model_load_message(),
        }

    return {
        "status": "ok",
        "model_loaded": True,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Accept an uploaded image and return class prediction plus recycling advice."""
    if model is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": get_model_load_message(),
                "predicted_class": None,
            },
        )

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image file.")

    prediction = predict_image(model, image)
    recycling_info = get_recycling_info(prediction["predicted_class"])
    warning = LOW_CONFIDENCE_MESSAGE if prediction["low_confidence"] else None

    return {
        "predicted_class": prediction["predicted_class"],
        "confidence": prediction["confidence"],
        "top_3_predictions": prediction["top_3_predictions"],
        "material": recycling_info["material"],
        "bin_category": recycling_info["bin_category"],
        "recycling_advice": recycling_info["advice"],
        "low_confidence": prediction["low_confidence"],
        "warning": warning,
    }


@app.get("/")
def root() -> dict:
    """Small landing response for browser checks on Hugging Face Spaces."""
    return {
        "name": "EcoSortAI Backend",
        "health": "/health",
        "predict": "/predict",
        "model_path": str(MODEL_PATH),
    }
