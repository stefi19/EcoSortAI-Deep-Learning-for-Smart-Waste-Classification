// API helper for the EcoSortAI backend.
//
// IMPORTANT — replace YOUR_LOCAL_IP with your laptop's local network IP address.
// On a real phone, "localhost" points to the phone itself, NOT your laptop.
// Find your IP with:
//   macOS: System Settings > Wi-Fi > Details  OR  run: ipconfig getifaddr en0
//   Windows: ipconfig (look for IPv4 Address)
// Example: "http://192.168.1.100:8000/predict"

const API_URL = "http://YOUR_LOCAL_IP:8000/predict";

/**
 * Send a captured or selected image to the EcoSortAI backend for classification.
 *
 * @param {string} imageUri - Local file URI from the camera or image picker.
 * @returns {Promise<Object>} - Prediction result from the backend.
 */
export async function sendImageForPrediction(imageUri) {
  const formData = new FormData();

  // The backend expects the image field to be named "file"
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "waste_image.jpg",
  });

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
    headers: {
      // Do NOT set Content-Type manually — fetch sets it with the multipart boundary
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  return response.json();
}
