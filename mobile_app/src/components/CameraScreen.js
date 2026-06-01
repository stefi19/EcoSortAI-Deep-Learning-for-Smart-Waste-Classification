// Camera preview screen.
// Handles permission request, live camera preview, photo capture,
// and gallery fallback via expo-image-picker.

import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../styles/colors";

export default function CameraScreen({ onCapture }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // ── Permission not yet decided ─────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.container} />;
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>
          Camera access is required to scan waste items.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Take a photo with the camera ───────────────────────────────────────────
  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    onCapture(photo.uri);
  }

  // ── Choose from photo gallery ──────────────────────────────────────────────
  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      onCapture(result.assets[0].uri);
    }
  }

  // ── Camera UI ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EcoSortAI</Text>
        <Text style={styles.subtitle}>Scan waste. Sort smarter.</Text>
      </View>

      {/* Camera preview */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Helper text */}
      <Text style={styles.hint}>
        Point the camera at one waste item for best results.
      </Text>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.galleryButton} onPress={handleGallery}>
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanButton} onPress={handleCapture}>
          <Text style={styles.scanButtonText}>Scan Waste</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  permContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 20,
  },
  permText: {
    fontSize: 16,
    color: COLORS.darkText,
    textAlign: "center",
    lineHeight: 24,
  },
  permButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  camera: {
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  hint: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  scanButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  galleryButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  galleryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
