import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import CameraScreen from "./src/components/CameraScreen";
import LoadingOverlay from "./src/components/LoadingOverlay";
import ResultCard from "./src/components/ResultCard";
import { sendImageForPrediction } from "./src/utils/api";
import { COLORS } from "./src/styles/colors";

export default function App() {
  const [capturedUri, setCapturedUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Animated value for the error toast fade
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer   = useRef(null);

  function showError(msg) {
    setErrorMsg(msg);
    clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setErrorMsg(null));
  }

  // Called by CameraScreen when a photo is captured or chosen from gallery
  const handleCapture = useCallback(async (imageUri) => {
    setCapturedUri(imageUri);
    setLoading(true);
    setResult(null);
    try {
      const prediction = await sendImageForPrediction(imageUri);
      if (prediction.error) {
        showError(prediction.error);
        setLoading(false);
        setCapturedUri(null);
      } else {
        setResult(prediction);
        setLoading(false);
      }
    } catch (err) {
      showError("Could not reach the server.\nMake sure the backend is running.");
      setLoading(false);
      setCapturedUri(null);
    }
  }, []);

  // Called from ResultCard — go back to camera
  const handleScanAgain = useCallback(() => {
    setResult(null);
    setCapturedUri(null);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      {/* Camera is always mounted so the preview is instant on return */}
      <CameraScreen
        onCapture={handleCapture}
        active={!result && !loading}
      />

      {/* Loading overlay — shown over the camera with the captured image */}
      {loading && capturedUri && (
        <LoadingOverlay imageUri={capturedUri} />
      )}

      {/* Result card — slides up over the camera */}
      {result && (
        <ResultCard
          result={result}
          imageUri={capturedUri}
          onScanAgain={handleScanAgain}
        />
      )}

      {/* Error toast */}
      {errorMsg && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{errorMsg}</Text>
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    zIndex: 100,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
});
