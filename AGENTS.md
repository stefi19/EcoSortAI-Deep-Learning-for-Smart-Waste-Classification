# AGENTS.md

## Project: EcoSortAI

EcoSortAI is a deep learning project for smart waste classification and recycling guidance. It contains a training notebook, a FastAPI inference backend, and a React Native + Expo mobile demo app.

The project should remain clean, student-friendly, well-commented, and easy to explain in a deep learning presentation.

---

## Project Goal

EcoSortAI should work as a practical recycling assistant:

1. The user opens the mobile app.
2. The phone camera captures one waste object.
3. The image is sent to the FastAPI backend.
4. The backend runs a trained PyTorch model.
5. The app returns:
   - predicted waste class,
   - material type,
   - recycling bin category,
   - recycling advice,
   - confidence score,
   - top-3 predictions,
   - low-confidence warning when needed.

The project is not only a classifier. It should be presented as a deployment-aware AI recycling system.

---

## Waste Classes

Use exactly these 10 classes unless the full model, notebook, backend, and frontend are updated consistently:

```python
classes = [
    "battery",
    "biological",
    "cardboard",
    "clothes",
    "glass",
    "metal",
    "paper",
    "plastic",
    "shoes",
    "trash"
]
```

---

## Critical Dataset Rule: Avoid Data Leakage

This is the most important rule in the project.

The Kaggle dataset contains multiple folders:

```text
original
standardized_256
standardized_384
```

Do **not** load all folders together. That creates data leakage because the same image may appear in multiple versions. One version could go into training and another into testing, producing artificially high results.

Always use only:

```python
dataset_path = Path(path) / "standardized_256"
```

Never use this for image collection:

```python
dataset_path = Path(path)
```

Never collect images from `original`, `standardized_256`, and `standardized_384` together.

Correct dataset size after leakage fix:

```text
Total images: 12,259
Train images: 8,581
Validation images: 1,839
Test images: 1,839
```

Old references to 36,777 images should appear only when explaining the initial leakage issue.

---

## Dataset Loading Rules

Use KaggleHub:

```python
import kagglehub
from pathlib import Path

path = kagglehub.dataset_download("sumn2u/garbage-classification-v2")
dataset_path = Path(path) / "standardized_256"
```

Create a DataFrame with:

```text
image_path
label
```

Supported image extensions:

```python
image_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]
```

Labels should come from the parent folder name:

```python
label = image_path.parent.name
```

Always print:

- dataset path,
- number of images,
- number of classes,
- class names,
- class distribution.

---

## Data Split Rules

Use stratified splitting:

```text
70% train
15% validation
15% test
```

Use:

```python
random_state = 42
stratify = data["label"]
```

The test set must be used only for final evaluation. Use validation data for tuning, model selection, and early stopping.

---

## Preprocessing Rules

Use image size:

```python
image_size = 224
```

Training transforms:

```python
transforms.Resize((224, 224))
transforms.RandomHorizontalFlip()
transforms.RandomRotation(15)
transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2)
transforms.ToTensor()
transforms.Normalize(mean=[0.485, 0.456, 0.406],
                     std=[0.229, 0.224, 0.225])
```

Validation/test/backend inference transforms:

```python
transforms.Resize((224, 224))
transforms.ToTensor()
transforms.Normalize(mean=[0.485, 0.456, 0.406],
                     std=[0.229, 0.224, 0.225])
```

Do not apply random augmentations to validation, test, or backend inference images.

---

## Model Rules

The notebook should compare these models:

### SimpleCNN

Purpose:

- custom baseline,
- educational model,
- shows why transfer learning matters.

Use Conv2d, ReLU, MaxPool2d, Dropout, and Linear layers.

### MobileNetV3-Small

Purpose:

- lightweight deployment model,
- suitable for mobile apps, smart bins, and edge devices.

Use torchvision pretrained weights and replace the classifier head with 10 output classes.

### ResNet50

Purpose:

- strong classical pretrained CNN benchmark.

Use torchvision pretrained weights and replace the final `fc` layer with 10 output classes.

### EfficientNet-B0

Purpose:

- best single-model candidate,
- strong balance between accuracy and efficiency.

Use torchvision pretrained weights and replace the classifier output layer with 10 output classes.

### Soft-Voting Ensemble

Purpose:

- accuracy-focused experiment,
- combines EfficientNet-B0 and ResNet50.

The ensemble should average softmax probabilities. It is useful for server-side inference but too heavy for real-time edge deployment.

---

## Recommended Final Model Story

| Model | Role |
|---|---|
| SimpleCNN | Educational baseline |
| MobileNetV3-Small | Lightweight smart-bin model |
| ResNet50 | Strong classical CNN benchmark |
| EfficientNet-B0 | Best single model |
| EfficientNet + ResNet ensemble | Accuracy-focused server-side model |
| Multi-task EfficientNet | Smart recycling assistant |

Do not present the project as only “I trained a classifier.” Present it as a deployment-aware smart recycling system.

---

## Training Best Practices

Use:

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

Preferred optimizer:

```python
torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
```

Preferred scheduler:

```python
torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)
```

Use class-weighted loss because the dataset is imbalanced:

```python
class_counts = train_data["label"].value_counts().reindex(classes)
class_weights = len(train_data) / (num_classes * class_counts)
class_weights_tensor = torch.tensor(class_weights.values, dtype=torch.float32).to(device)

criterion = nn.CrossEntropyLoss(
    weight=class_weights_tensor,
    label_smoothing=0.05
)
```

Use early stopping based on validation macro F1. Save and restore the best model weights, not the final epoch.

Track:

- train loss,
- validation loss,
- train accuracy,
- validation accuracy,
- validation macro F1,
- learning rate,
- epoch time.

---

## Evaluation Rules

Evaluate with:

- accuracy,
- macro precision,
- macro recall,
- macro F1-score,
- confusion matrix,
- classification report per class.

Use macro metrics because minority classes matter too.

Use sklearn:

```python
accuracy_score
precision_score
recall_score
f1_score
confusion_matrix
classification_report
```

Use:

```python
average="macro"
zero_division=0
```

Final comparison table columns:

```text
Model
Accuracy
Precision
Recall
F1-score
Total Parameters
Trainable Parameters
Average Time per Epoch
Best Use Case
```

Sort by F1-score descending.

---

## Error Analysis Rules

Include a misclassification analysis section. Show several wrongly classified test images.

For each image, display:

- image,
- true label,
- predicted label,
- confidence score.

Discuss common confusions:

- paper vs cardboard,
- plastic vs trash,
- trash vs other categories,
- metal vs plastic or glass,
- shoes/clothes vs trash in unclear images.

Do not hide model mistakes. Explain them clearly.

---

## Explainability Rules

Use Grad-CAM for EfficientNet-B0 if possible.

Show:

- original image,
- heatmap,
- overlay,
- true label,
- predicted label.

Explain that Grad-CAM helps visualize which image regions influenced the prediction.

If Grad-CAM becomes unstable, keep it simple and only use it for EfficientNet-B0.

---

## Multi-task Smart Recycling Model

Optional but recommended advanced section.

Create a second target label called `bin_category`.

Mapping:

```python
BIN_CATEGORY_MAPPING = {
    "plastic": "recyclable",
    "glass": "recyclable",
    "metal": "recyclable",
    "paper": "recyclable",
    "cardboard": "recyclable",
    "biological": "organic",
    "battery": "hazardous",
    "clothes": "textile",
    "shoes": "textile",
    "trash": "landfill"
}
```

The multi-task model should predict:

1. fine waste class,
2. bin category.

Use one EfficientNet-B0 backbone and two heads:

```text
EfficientNet backbone
shared dense layer
fine_head -> 10 classes
bin_head -> 5 classes
```

Training loss:

```python
loss = fine_loss + 0.4 * bin_loss
```

Evaluate:

- fine class accuracy,
- fine class macro F1,
- bin category accuracy,
- bin category macro F1.

This turns the classifier into a practical recycling assistant.

---

## Recycling Rules

Use this mapping in backend and frontend:

```python
RECYCLING_RULES = {
    "battery": {
        "material": "Battery / hazardous electronic waste",
        "bin_category": "Hazardous waste collection point",
        "advice": "Do not throw batteries in regular trash. Take them to a battery collection box."
    },
    "biological": {
        "material": "Organic biodegradable waste",
        "bin_category": "Organic / compost bin",
        "advice": "Dispose of it in organic waste or compost when possible."
    },
    "cardboard": {
        "material": "Cardboard / paper fiber",
        "bin_category": "Paper and cardboard recycling bin",
        "advice": "Flatten cardboard before recycling."
    },
    "clothes": {
        "material": "Textile material",
        "bin_category": "Textile donation or textile recycling point",
        "advice": "Donate usable clothes or take damaged textiles to a textile collection point."
    },
    "glass": {
        "material": "Glass",
        "bin_category": "Glass recycling bin",
        "advice": "Recycle glass bottles and jars separately when possible."
    },
    "metal": {
        "material": "Metal / aluminum / steel",
        "bin_category": "Metal recycling bin",
        "advice": "Rinse cans before recycling if possible."
    },
    "paper": {
        "material": "Paper",
        "bin_category": "Paper recycling bin",
        "advice": "Keep paper clean and dry before recycling."
    },
    "plastic": {
        "material": "Plastic packaging or synthetic polymer",
        "bin_category": "Plastic recycling bin",
        "advice": "Empty and clean plastic containers before recycling."
    },
    "shoes": {
        "material": "Textile, rubber, leather or synthetic material",
        "bin_category": "Textile/shoe donation or special collection point",
        "advice": "Donate usable shoes or take them to a dedicated collection point."
    },
    "trash": {
        "material": "Mixed or non-recyclable waste",
        "bin_category": "General waste bin",
        "advice": "If the item cannot be cleaned or separated, dispose of it as general waste."
    }
}
```

---

## Backend Rules

Use FastAPI.

Recommended structure:

```text
backend/
  main.py
  model_loader.py
  recycling_rules.py
  requirements.txt
  saved_model/
    best_model.pth
```

Endpoint:

```text
POST /predict
```

The endpoint accepts an image file named `file` and returns JSON:

```json
{
  "predicted_class": "plastic",
  "confidence": 0.92,
  "top_3_predictions": [
    {"class": "plastic", "confidence": 0.92},
    {"class": "trash", "confidence": 0.05},
    {"class": "paper", "confidence": 0.02}
  ],
  "material": "Plastic packaging or synthetic polymer",
  "bin_category": "Plastic recycling bin",
  "recycling_advice": "Empty and clean plastic containers before recycling.",
  "low_confidence": false,
  "warning": null
}
```

If confidence < 0.70:

```json
{
  "low_confidence": true,
  "warning": "Low confidence: manual verification recommended."
}
```

---

## Backend Model Loading Rules

Assume the production model is EfficientNet-B0 unless explicitly changed.

The architecture in `model_loader.py` must match the saved model:

```python
model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()
```

Backend preprocessing must match validation/test preprocessing from the notebook.

Do not use training augmentations in backend inference.

Run backend with:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend dependencies:

```text
fastapi
uvicorn
python-multipart
torch
torchvision
pillow
numpy
```

Enable CORS for local mobile development.

---

## Mobile App Rules

Use React Native + Expo.

Recommended structure:

```text
mobile_app/
  App.js
  package.json
  src/
    components/
      CameraScreen.js
      ResultCard.js
      PredictionBadge.js
      LoadingOverlay.js
    utils/
      recyclingRules.js
      api.js
    styles/
      colors.js
```

Use:

- `expo-camera` for camera capture,
- `expo-image-picker` as gallery fallback,
- `fetch` for backend calls,
- simple React hooks: `useState`, `useEffect`.

Keep the code simple, student-friendly, and commented.

---

## Mobile UI Rules

The mobile app should look polished but simple.

Design style:

- green recycling theme,
- soft background,
- rounded cards,
- large camera preview,
- clear scan button,
- confidence progress bar,
- top-3 predictions,
- recycling advice card,
- low-confidence warning.

Suggested color palette:

```javascript
export const COLORS = {
  background: "#F3FAF4",
  primary: "#2E7D32",
  lightGreen: "#A5D6A7",
  darkText: "#1B1B1B",
  mutedText: "#6B7280",
  warning: "#F59E0B",
  error: "#DC2626",
  white: "#FFFFFF"
};
```

Main screen:

```text
EcoSortAI
Scan waste. Sort smarter.
Camera preview
Scan Waste button
Choose from Gallery button
Point the camera at one waste item for best results.
```

Result screen:

- predicted class,
- material,
- recycling bin category,
- confidence percentage,
- top-3 predictions,
- recycling advice,
- low-confidence warning,
- Scan Another Item button.

---

## Frontend API Rules

The mobile app must send images to:

```text
http://YOUR_LOCAL_IP:8000/predict
```

On a real phone, `localhost` does not point to the laptop. Use the laptop local network IP, for example:

```javascript
const API_URL = "http://192.168.1.100:8000/predict";
```

Image upload should use `FormData`.

The image field name must be:

```text
file
```

---

## Confidence and Top-3 Rules

Always compute softmax probabilities.

Return and display:

- best prediction,
- confidence,
- top-3 predictions.

If confidence < 0.70, display:

```text
Low confidence: manual verification recommended.
```

The system should not pretend to be certain when it is not.

---

## Demo Rules

Notebook should include:

1. random test image demo,
2. optional custom image path demo.

Mobile app should support:

1. camera capture,
2. gallery upload fallback.

Backend should handle invalid image files gracefully.

---

## Code Style Rules

All code should be:

- simple,
- readable,
- well-commented,
- student-friendly,
- easy to explain orally,
- not overly abstract,
- not overly engineered.

Prefer clear functions over clever code.

Good function names:

```python
train_model
evaluate_model
predict_image
show_misclassified_images
get_recycling_info
```

Avoid duplicated code.

Use markdown explanations before major notebook sections.

---

## Notebook Structure

The notebook should run from top to bottom.

Recommended sections:

```text
1. Project Introduction
2. Dataset Loading and Leakage Fix
3. Exploratory Data Analysis
4. Train / Validation / Test Split
5. Image Preprocessing
6. PyTorch Dataset and DataLoaders
7. Baseline CNN
8. Transfer Learning Models
9. Improved Training Pipeline
10. Model Evaluation
11. Model Comparison
12. Ensemble Model
13. Error Analysis
14. Grad-CAM Explainability
15. Demo Prediction
16. Deployment-Aware Discussion
17. Final Conclusions
```

Every major section should have:

1. markdown explanation,
2. code,
3. short interpretation.

---

## README Rules

Create a `README.md` for the full project.

It should include:

- project title,
- short description,
- dataset used,
- leakage warning,
- model comparison,
- mobile app description,
- backend setup,
- frontend setup,
- prediction flow,
- limitations,
- future work.

Prediction flow:

```text
Phone camera
-> image upload
-> FastAPI backend
-> PyTorch EfficientNet model
-> prediction + recycling rules
-> mobile result card
```

---

## Git Rules

Do not commit:

- Kaggle dataset files,
- generated cache folders,
- `__pycache__`,
- `.ipynb_checkpoints`,
- virtual environments,
- local secrets,
- `node_modules`,
- `.expo`,
- local IP-specific config if avoidable.

Recommended `.gitignore` entries:

```text
__pycache__/
.ipynb_checkpoints/
*.pth
*.pt
*.onnx
.env
venv/
.env.local
node_modules/
.expo/
dist/
build/
```

If a model file is needed for demo, mention in README where to place it:

```text
backend/saved_model/best_model.pth
```

---

## Academic Presentation Rules

When explaining the project, emphasize:

1. The data leakage issue was identified and fixed.
2. The final results are realistic and reliable.
3. Transfer learning strongly outperformed the custom CNN.
4. MobileNet is best for lightweight deployment.
5. EfficientNet is the best single high-performance model.
6. Ensemble is best for accuracy but heavy.
7. Multi-task learning makes the model more useful.
8. The mobile app turns the model into a practical recycling assistant.
9. Confidence threshold improves trust and safety.
10. Grad-CAM makes predictions more interpretable.

---

## Final Project Message

EcoSortAI is a deployment-aware deep learning recycling assistant. It classifies waste images, explains what material the item is made of, recommends the correct recycling category, and demonstrates how a trained PyTorch model can be integrated into a mobile camera-based application.

Keep the project clean, honest, practical, and visually polished.
