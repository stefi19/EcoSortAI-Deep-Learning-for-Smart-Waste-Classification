import { Platform } from "react-native";
import { getLocalRecyclingInfo } from "./recyclingRules";

// Do not hardcode localhost for this app.
// On a real phone, localhost points to the phone itself, not your laptop.
// For local phone testing, use your laptop's local IP, for example:
// EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
// For Vercel, set EXPO_PUBLIC_API_URL to the deployed Hugging Face Spaces backend URL.
// Example deployed value: https://YOUR_USERNAME-ecosortai-backend.hf.space
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://YOUR_LOCAL_IP:8000";

const PREDICTION_URL = `${API_BASE_URL}/predict`;

function getFileName(uri) {
  const cleanUri = uri.split("?")[0];
  const name = cleanUri.split("/").pop();
  return name && name.includes(".") ? name : "waste-image.jpg";
}

function getMimeType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "bmp") return "image/bmp";

  return "image/jpeg";
}

async function appendImageToFormData(formData, image) {
  const fileName = getFileName(image.uri);
  const mimeType = image.mimeType || image.type || getMimeType(fileName);

  if (Platform.OS === "web") {
    const imageResponse = await fetch(image.uri);
    const imageBlob = await imageResponse.blob();
    formData.append("file", imageBlob, fileName);
    return;
  }

  formData.append("file", {
    uri: image.uri,
    name: fileName,
    type: mimeType
  });
}

function getFriendlyErrorMessage(error, status) {
  const rawMessage = String(error?.detail || error?.message || error || "").toLowerCase();

  if (
    rawMessage.includes("model not loaded") ||
    rawMessage.includes("model missing") ||
    rawMessage.includes("model file missing") ||
    rawMessage.includes("does not match efficientnet")
  ) {
    return "The backend is running, but the trained model file is missing. Add best_model.pth and restart the backend.";
  }

  if (rawMessage.includes("invalid image")) {
    return "That file could not be read as an image. Please choose a clear JPG or PNG photo.";
  }

  if (rawMessage.includes("incomplete") || rawMessage.includes("empty")) {
    return "The backend returned an incomplete prediction. Please check that /predict returns class, confidence, top-3 predictions, and recycling fields.";
  }

  if (status && status >= 500) {
    return "The backend could not finish the prediction. Please try again after checking the server.";
  }

  return "Prediction failed. Please try another image or check that the backend is online.";
}

function normalizePrediction(data) {
  if (data?.error) {
    throw new Error(getFriendlyErrorMessage(data.error));
  }

  if (!data || typeof data !== "object") {
    throw new Error("The backend returned an empty prediction response.");
  }

  const predictedClass = data.predicted_class;
  const confidence = Number(data.confidence);
  const top3 = Array.isArray(data.top_3_predictions) ? data.top_3_predictions : [];

  if (!predictedClass || Number.isNaN(confidence) || top3.length === 0) {
    throw new Error("The backend response was incomplete. Please check the /predict endpoint fields.");
  }

  const localRule = getLocalRecyclingInfo(predictedClass);

  return {
    predicted_class: predictedClass,
    confidence,
    top_3_predictions: top3.map((item) => ({
      class: item.class || "unknown",
      confidence: Number(item.confidence || 0)
    })),
    material: data.material || localRule?.material || "Material information is not available.",
    bin_category: data.bin_category || localRule?.bin_category || "Recycling category is not available.",
    recycling_advice: data.recycling_advice || localRule?.advice || "Please verify local recycling guidance.",
    low_confidence: Boolean(data.low_confidence || confidence < 0.7),
    warning: data.warning || (confidence < 0.7 ? "Low confidence: manual verification recommended." : null)
  };
}

export async function predictWasteImage(image) {
  if (!image?.uri) {
    throw new Error("Please capture or choose an image first.");
  }

  const formData = new FormData();
  await appendImageToFormData(formData, image);

  let response;
  let data;

  try {
    response = await fetch(PREDICTION_URL, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error("The backend is offline or unreachable. Check the API URL and make sure the server is running.");
  }

  try {
    data = await response.json();
  } catch {
    throw new Error("The backend returned an unreadable response. Please check the server logs.");
  }

  if (!response.ok) {
    throw new Error(getFriendlyErrorMessage(data, response.status));
  }

  try {
    return normalizePrediction(data);
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export { API_BASE_URL, PREDICTION_URL };
