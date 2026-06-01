// EcoSortAI — root component.
// Manages three states: camera, loading, and result.
// Flow: camera -> [user taps Scan] -> loading -> result -> [user taps Scan Again] -> camera

import React, { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import CameraScreen from "./src/components/CameraScreen";
import LoadingOverlay from "./src/components/LoadingOverlay";
import ResultCard from "./src/components/ResultCard";
import { sendImageForPrediction } from "./src/utils/api";
import { COLORS } from "./src/styles/colors";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Called by CameraScreen when a photo is taken or chosen from gallery
  async function handleCapture(imageUri) {
    setLoading(true);
    setError(null);
    try {
      const prediction = await sendImageForPrediction(imageUri);
      setResult(prediction);
    } catch (err) {
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  // Called by ResultCard when the user wants to scan another item
  function handleScanAgain() {
    setResult(null);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Show camera when no result and not loading */}
      {!result && !loading && (
        <CameraScreen onCapture={handleCapture} />
      )}

      {/* Show result card after a successful prediction */}
      {result && !loading && (
        <ResultCard result={result} onScanAgain={handleScanAgain} />
      )}

      {/* Loading overlay sits on top while the request is in flight */}
      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
