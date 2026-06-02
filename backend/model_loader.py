"""Model loading and image prediction utilities for EcoSortAI."""

from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "saved_model" / "best_model.pth"
MODEL_LOAD_ERROR = None

CLASSES = [
    "battery",
    "biological",
    "cardboard",
    "clothes",
    "glass",
    "metal",
    "paper",
    "plastic",
    "shoes",
    "trash",
]

NUM_CLASSES = len(CLASSES)
IMAGE_SIZE = 224
CONFIDENCE_THRESHOLD = 0.70


def get_device() -> torch.device:
    """Use GPU when available, otherwise run on CPU."""
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


DEVICE = get_device()


INFERENCE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


def build_model() -> nn.Module:
    """Create the ResNet50 architecture used by the production backend model."""
    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)
    return model


def load_model() -> nn.Module | None:
    """Load model weights if available. Missing weights should not crash the API."""
    global MODEL_LOAD_ERROR
    MODEL_LOAD_ERROR = None

    if not MODEL_PATH.exists():
        MODEL_LOAD_ERROR = "Model file missing. Please place best_model.pth in backend/saved_model/."
        print(f"[EcoSortAI] {MODEL_LOAD_ERROR}")
        return None

    model = build_model()

    try:
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(state_dict)
    except RuntimeError as error:
        MODEL_LOAD_ERROR = (
            "Model file found, but it does not match ResNet50. "
            "Please place a ResNet50 best_model.pth in backend/saved_model/."
        )
        print(f"[EcoSortAI] {MODEL_LOAD_ERROR}")
        print(f"[EcoSortAI] Load error: {error}")
        return None

    model.to(DEVICE)
    model.eval()

    print(f"[EcoSortAI] ResNet50 model loaded on {DEVICE}")
    return model


def get_model_load_message() -> str:
    """Return the current model-loading problem, if any."""
    return MODEL_LOAD_ERROR or "Model is not loaded."


def predict_image(model: nn.Module, image: Image.Image) -> dict:
    """Run inference and return the best class plus top-3 softmax scores."""
    tensor = INFERENCE_TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    top_values, top_indices = probabilities.topk(3)
    top_3_predictions = [
        {
            "class": CLASSES[index.item()],
            "confidence": round(score.item(), 4),
        }
        for score, index in zip(top_values, top_indices)
    ]

    predicted_class = top_3_predictions[0]["class"]
    confidence = top_3_predictions[0]["confidence"]

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "top_3_predictions": top_3_predictions,
        "low_confidence": confidence < CONFIDENCE_THRESHOLD,
    }
