import React, { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../styles/colors";

export default function CameraScreen({ selectedImageUri, onImageSelected, onScan, disabled }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  async function captureImage() {
    if (selectedImageUri) {
      onImageSelected(null);
      return;
    }

    if (!cameraRef.current || !cameraReady || disabled) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      base64: false
    });

    onImageSelected({
      uri: photo.uri,
      mimeType: "image/jpeg"
    });
  }

  async function chooseFromGallery() {
    if (disabled) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      onImageSelected(result.assets[0]);
    }
  }

  const hasPermission = permission?.granted;

  return (
    <View style={styles.wrapper}>
      <View style={styles.previewCard}>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.preview} />
        ) : hasPermission ? (
          <CameraView ref={cameraRef} style={styles.preview} facing="back" onCameraReady={() => setCameraReady(true)} />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Camera permission needed</Text>
            <Text style={styles.permissionText}>Allow camera access to scan a waste item, or choose an image from your gallery.</Text>
            <Pressable style={styles.secondaryButton} onPress={requestPermission}>
              <Text style={styles.secondaryButtonText}>Allow Camera</Text>
            </Pressable>
          </View>
        )}

        <View pointerEvents="none" style={styles.focusFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, (!selectedImageUri || disabled) && styles.disabledButton]}
          disabled={!selectedImageUri || disabled}
          onPress={onScan}
        >
          <Text style={styles.primaryButtonText}>Scan Waste</Text>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable style={[styles.secondaryButton, disabled && styles.disabledButton]} disabled={disabled} onPress={captureImage}>
            <Text style={styles.secondaryButtonText}>{selectedImageUri ? "Retake Photo" : "Take Photo"}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, disabled && styles.disabledButton]} disabled={disabled} onPress={chooseFromGallery}>
            <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.helperText}>Point the camera at one waste item for best results.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16
  },
  previewCard: {
    height: 390,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  preview: {
    width: "100%",
    height: "100%"
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24
  },
  permissionTitle: {
    color: COLORS.darkText,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  permissionText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  focusFrame: {
    position: "absolute",
    left: 32,
    right: 32,
    top: 52,
    bottom: 52
  },
  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: COLORS.lightGreen
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 12
  },
  actions: {
    gap: 10
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  primaryButton: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: COLORS.primary
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900"
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreen
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  disabledButton: {
    opacity: 0.55
  },
  helperText: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  }
});
