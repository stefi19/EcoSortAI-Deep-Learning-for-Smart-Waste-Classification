import React, { useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import CameraScreen from "./src/components/CameraScreen";
import LoadingOverlay from "./src/components/LoadingOverlay";
import ResultCard from "./src/components/ResultCard";
import { predictWasteImage } from "./src/utils/api";
import { COLORS } from "./src/styles/colors";

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleImageSelected(image) {
    setSelectedImage(image);
    setPrediction(null);
    setErrorMessage("");
  }

  async function handleScan() {
    if (!selectedImage) {
      setErrorMessage("Please take a photo or choose one from your gallery first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await predictWasteImage(selectedImage);
      setPrediction(result);
    } catch (error) {
      setPrediction(null);
      setErrorMessage(error.message || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleScanAgain() {
    setSelectedImage(null);
    setPrediction(null);
    setErrorMessage("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>EcoSortAI</Text>
          <Text style={styles.subtitle}>Scan waste. Sort smarter.</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {prediction ? (
          <ResultCard imageUri={selectedImage?.uri} prediction={prediction} onScanAgain={handleScanAgain} />
        ) : (
          <CameraScreen
            selectedImageUri={selectedImage?.uri}
            onImageSelected={handleImageSelected}
            onScan={handleScan}
            disabled={loading}
          />
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 32,
    gap: 18
  },
  header: {
    gap: 4,
    paddingTop: 6
  },
  title: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: COLORS.darkText,
    fontSize: 17,
    fontWeight: "700"
  },
  errorBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  }
});
