# Loads the EfficientNet-B0 production model and defines the inference transform.
# The architecture here must exactly match how the model was saved in the notebook.

import torch
import torch.nn as nn
from torchvision import models, transforms
from pathlib import Path

# The 10 waste classes in sorted order (same as training)
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

# Device selection: GPU > MPS (Apple Silicon) > CPU
if torch.cuda.is_available():
    DEVICE = torch.device("cuda")
elif torch.backends.mps.is_available():
    DEVICE = torch.device("mps")
else:
    DEVICE = torch.device("cpu")

# Path to the saved model weights
MODEL_PATH = Path(__file__).parent / "saved_model" / "best_model.pth"

# Inference transform matches val/test preprocessing from the notebook.
# No random augmentations -- deterministic and reproducible.
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def load_model():
    """
    Build EfficientNet-B0 with a 10-class head and load saved weights.
    Returns None (with a warning) if the model file is missing.
    """
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)

    if not MODEL_PATH.exists():
        print(f"WARNING: model file not found at {MODEL_PATH}")
        print("Place best_model.pth in backend/saved_model/ before calling /predict.")
        return None

    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    model.to(DEVICE)
    print(f"Model loaded from {MODEL_PATH}  (device: {DEVICE})")
    return model
