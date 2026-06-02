# EcoSortAI: Smart Waste Classification with Deployment-Aware Deep Learning

A deep learning project that classifies waste images into 10 material categories and recommends the correct recycling bin. The project is designed as a deployment-aware system — not just a classifier — with a FastAPI backend and a React Native mobile demo app.

---

## Dataset

**Source:** [sumn2u/garbage-classification-v2](https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2) via KaggleHub.

**Folder used:** `standardized_256/` only.

> **Data Leakage Warning**
> The dataset ships with three image variants: `original/`, `standardized_256/`, and `standardized_384/`.
> Loading all three together inflates the dataset to ~36,777 images and causes data leakage because the same image may appear in multiple folders, with different versions split across train and test.
> This project uses **only `standardized_256/`**, giving a clean dataset of 12,259 images.

**Split:** 70% train / 15% validation / 15% test (stratified, `random_state=42`).

---

## Classes

```
battery  biological  cardboard  clothes  glass
metal    paper       plastic    shoes    trash
```

---

## Models

| Model | Role | Accuracy | Macro F1 |
|---|---|---|---|
| SimpleCNN | Educational baseline | ~26% | ~20% |
| MobileNetV3-Small | Lightweight edge / smart bin | ~92% | ~92% |
| ResNet50 | Best accuracy model and production backend model | ~94% | ~94% |
| EfficientNet-B0 | Strong single-model candidate | ~95% | ~94% |
| EfficientNet + ResNet50 Ensemble | Accuracy-focused server model | ~95%+ | ~95%+ |
| Multi-task EfficientNet | Predicts class + bin category | ~95% | ~94% |

*Results are approximate and will vary across training runs.*

---

## Project Structure

```
.
├── model.ipynb               Main notebook (run from top to bottom)
├── best_model.pth            Exported ResNet50 weights for backend demo
├── Plastic.jpg               Sample image for the notebook demo
│
├── backend/                  FastAPI inference server
│   ├── main.py
│   ├── model_loader.py
│   ├── recycling_rules.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── README.md
│   └── saved_model/
│       ├── .gitkeep
│       ├── model_metadata.json
│       └── best_model.pth    Place the trained model here (not committed)
│
├── mobile_app/               React Native + Expo mobile demo
│   ├── App.js
│   ├── package.json
│   ├── vercel.json
│   └── src/
│       ├── components/
│       │   ├── CameraScreen.js
│       │   ├── ResultCard.js
│       │   ├── PredictionBadge.js
│       │   └── LoadingOverlay.js
│       ├── utils/
│       │   ├── api.js
│       │   └── recyclingRules.js
│       └── styles/
│           └── colors.js
│
└── app/                      Legacy web demo (single-file HTML + FastAPI)
    ├── main.py
    ├── static/index.html
    └── model.pth
```

---

## Backend Setup

### 1. Place the model file

Run the notebook to train and export the model, then copy the weights:

```bash
cp best_model.pth backend/saved_model/best_model.pth
```

Or the notebook export cell writes directly to `backend/saved_model/best_model.pth`.

The backend currently expects ResNet50 weights at `backend/saved_model/best_model.pth`. If you switch back to EfficientNet-B0 later, update both `backend/model_loader.py` and `backend/saved_model/model_metadata.json`.

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The server starts at `http://localhost:8000`. Use `--host 0.0.0.0` so phones on the same Wi-Fi can reach it.

### 4. Test the endpoint

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/image.jpg"
```

**Response example:**

```json
{
  "predicted_class": "plastic",
  "confidence": 0.92,
  "top_3_predictions": [
    {"class": "plastic",  "confidence": 0.92},
    {"class": "trash",    "confidence": 0.05},
    {"class": "paper",    "confidence": 0.02}
  ],
  "material": "Plastic packaging or synthetic polymer",
  "bin_category": "Plastic recycling bin",
  "recycling_advice": "Empty and clean plastic containers before recycling.",
  "low_confidence": false,
  "warning": null
}
```

If confidence < 0.70, `low_confidence` is `true` and `warning` contains a human review message.

---

## Mobile App Setup

### 1. Install dependencies

```bash
cd mobile_app
npm install
```

### 2. Set your local API URL

Set `EXPO_PUBLIC_API_URL` to your laptop's local network IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000 npx expo start
```

> **Why?** On a real phone, `localhost` points to the phone itself, not your laptop.
> Find your IP: `ipconfig getifaddr en0` (macOS) or `ipconfig` (Windows, look for IPv4 Address).

### 3. Start the app

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone (iOS or Android), or run in a simulator.

---

## Prediction Flow

```
Phone camera (or gallery)
  -> image captured as JPEG
  -> FormData POST to http://<your-ip>:8000/predict  (field name: "file")
  -> FastAPI backend
  -> ResNet50 inference (224x224, ImageNet normalisation)
  -> softmax probabilities
  -> top-3 predictions selected
  -> RECYCLING_RULES lookup for bin category and advice
  -> JSON response
  -> mobile result card with class, confidence bar, top-3, advice, warning
```

---

## Free Deployment Plan

EcoSortAI can be deployed with a free backend on Hugging Face Spaces Docker and a free Expo web frontend on Vercel.

### Backend: Hugging Face Spaces Docker

1. Create a new Hugging Face Space.
2. Choose **Docker** as the Space SDK.
3. Use the `backend/` folder as the Space content.
4. Keep the app port set to `7860`.
5. Place the trained model at:

```text
saved_model/best_model.pth
```

Inside this repository, that file lives at:

```text
backend/saved_model/best_model.pth
```

The model file is intentionally ignored by git. Do not commit large `.pth`, `.pt`, or `.onnx` files.

Test the deployed backend:

```text
GET /health
```

Prediction endpoint:

```text
POST /predict
```

The prediction request must upload the image using multipart form data with field name `file`.

### Frontend: Vercel

Deploy the `mobile_app/` folder as the Vercel project root.

Use this build command:

```bash
npm run build:web
```

Use this output directory:

```text
dist
```

Set this Vercel environment variable:

```text
EXPO_PUBLIC_API_URL=https://YOUR_USERNAME-ecosortai-backend.hf.space
```

The frontend reads this variable in `mobile_app/src/utils/api.js` and sends predictions to:

```text
${EXPO_PUBLIC_API_URL}/predict
```

### Local Run Instructions

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd mobile_app
npm install
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000 npx expo start
```

Replace `YOUR_LOCAL_IP` with your laptop's Wi-Fi IP address, for example `192.168.1.100`. Do not use `localhost` when testing from a real phone, because it points to the phone itself.

### Demo Flow

```text
Phone browser / Vercel frontend
  -> camera or gallery image
  -> Hugging Face FastAPI backend
  -> PyTorch model prediction
  -> recycling rules
  -> result card in the app
```

### Cold Start Note

On free hosting, the backend may have a cold start. For live demos, open `/health` a few minutes before presenting.

---

## Notebook Sections

| # | Section |
|---|---|
| 1 | Dataset Download & Loading |
| 2 | Exploratory Data Analysis |
| 3 | Train / Validation / Test Split |
| 4 | Preprocessing & Augmentation |
| 5 | PyTorch Dataset & DataLoaders |
| 6 | Model Architectures |
| 7 | Training & Evaluation Pipeline |
| 8 | Training All Four Models |
| 9 | Model Comparison |
| 10 | Confusion Matrix |
| 11 | Error Analysis |
| 12 | Recycling Rules |
| 13 | Demo Prediction |
| 14 | Soft-Voting Ensemble |
| 15 | Multi-task Smart Recycling Model |
| 16 | Full Model Comparison Table |
| 17 | Grad-CAM Explainability |
| 18 | Export Best Model |
| 19 | Deployment-Aware Discussion |
| 20 | Final Conclusions |

---

## Limitations

- Images in the dataset are clean and well-lit studio photos. Real-world images (outdoor, blurry, occluded) will likely lower accuracy.
- The classifier assumes **one dominant object per image** — it is not an object detector.
- The dataset is moderately imbalanced (`clothes` has ~4x more images than `trash`).
- Training was capped at 10 epochs with early stopping; further training may improve results.

---

## Future Work

- Collect real-world waste images from bins and conveyor belts to close the domain gap.
- Quantise MobileNetV3-Small (INT8) for sub-10 ms inference on embedded hardware / Raspberry Pi.
- Add object detection (YOLO, DETR) for images containing multiple waste items.
- Connect predictions to local recycling rules that vary by city or region.
- Implement continuous learning by logging low-confidence predictions and retraining periodically.
