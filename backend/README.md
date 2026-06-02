---
title: EcoSortAI Backend
emoji: ♻️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
---

# EcoSortAI Backend

FastAPI backend for the EcoSortAI waste classification project. It receives one image, runs a ResNet50 PyTorch model, and returns the predicted waste class with recycling guidance.

## Model File

Place the trained model weights here:

```text
backend/saved_model/best_model.pth
```

The backend expects a ResNet50 model with 10 output classes:

```text
battery, biological, cardboard, clothes, glass, metal, paper, plastic, shoes, trash
```

If `best_model.pth` is missing, the API still starts. `/health` reports `model_loaded: false`, and `/predict` returns a clear JSON error.

If using EfficientNet-B0 later, change `model_loader.py` and `saved_model/model_metadata.json` back to EfficientNet-B0 before deploying.

## Run Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7860
```

Health check:

```bash
curl http://localhost:7860/health
```

Prediction request:

```bash
curl -X POST http://localhost:7860/predict \
  -F "file=@/path/to/image.jpg"
```

## Deploy To Hugging Face Spaces

1. Create a new Hugging Face Space.
2. Select Docker as the Space SDK.
3. Use this `backend/` folder as the Space content.
4. Place `best_model.pth` in `backend/saved_model/` before uploading, or upload it through the Space file manager if appropriate.
5. Hugging Face Spaces will build the Docker image and run:

```bash
uvicorn main:app --host 0.0.0.0 --port 7860
```

The deployed backend URL can then be used by the Expo frontend as:

```text
EXPO_PUBLIC_API_URL=https://YOUR_USERNAME-ecosortai-backend.hf.space
```
