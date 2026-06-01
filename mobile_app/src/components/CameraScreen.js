import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";

export default function CameraScreen({ onCapture, active }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);
  const insets    = useSafeAreaInsets();

  // Pulse animation on the shutter ring
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  // Scan-line animation
  const scanAnim   = useRef(new Animated.Value(0)).current;
  // Shutter press scale
  const pressScale = useRef(new Animated.Value(1)).current;

  // Looping scan-line
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Idle pulse on the shutter ring
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Permission pending ─────────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.fill} />;
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.permCenter]}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permBody}>
          EcoSortAI uses the camera to scan waste items and suggest the correct recycling bin.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Capture photo ──────────────────────────────────────────────────────────
  async function handleShutter() {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);

    // Press animation + haptic
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.88, duration: 80,  useNativeDriver: true }),
      Animated.timing(pressScale, { toValue: 1.00, duration: 120, useNativeDriver: true }),
    ]).start();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      onCapture(photo.uri);
    } catch {
      // camera not ready yet — ignore silently
    } finally {
      setCapturing(false);
    }
  }

  // ── Gallery picker ─────────────────────────────────────────────────────────
  async function handleGallery() {
    await Haptics.selectionAsync();
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!picked.canceled && picked.assets.length > 0) {
      onCapture(picked.assets[0].uri);
    }
  }

  // ── Flip camera ────────────────────────────────────────────────────────────
  function handleFlip() {
    Haptics.selectionAsync();
    setFacing((f) => (f === "back" ? "front" : "back"));
  }

  // Scan-line interpolated Y position (0% → 78% of viewfinder height)
  const scanTranslateY = scanAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 260],
  });

  return (
    <View style={styles.fill}>
      {/* ── Full-screen camera ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

      {/* ── Top gradient + header ── */}
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "transparent"]}
        style={[styles.topGradient, { paddingTop: insets.top + 12 }]}
        pointerEvents="none"
      >
        <Text style={styles.appTitle}>EcoSort<Text style={styles.appTitleGreen}>AI</Text></Text>
        <Text style={styles.appSubtitle}>Scan waste. Sort smarter.</Text>
      </LinearGradient>

      {/* ── Viewfinder frame with scan line ── */}
      <View style={styles.frameWrap} pointerEvents="none">
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Animated scan line */}
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]}
        />
      </View>

      {/* ── Hint label ── */}
      <View style={styles.hintWrap} pointerEvents="none">
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>Point at one waste item</Text>
        </View>
      </View>

      {/* ── Bottom gradient + controls ── */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.78)"]}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Gallery button */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleGallery} activeOpacity={0.75}>
          <Text style={styles.sideBtnIcon}>🖼️</Text>
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter button */}
        <Animated.View style={{ transform: [{ scale: pressScale }] }}>
          <Animated.View style={[styles.shutterRing, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable
              style={[styles.shutterInner, capturing && styles.shutterCapturing]}
              onPress={handleShutter}
              android_ripple={{ color: "rgba(255,255,255,0.3)", borderless: true }}
            />
          </Animated.View>
        </Animated.View>

        {/* Flip camera button */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleFlip} activeOpacity={0.75}>
          <Text style={styles.sideBtnIcon}>↺</Text>
          <Text style={styles.sideBtnLabel}>Flip</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const CORNER_SIZE = 26;
const CORNER_THICK = 3;
const CORNER_COLOR = "rgba(255,255,255,0.85)";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Permission screen ──────────────────────────────────────────────────────
  permCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: COLORS.background,
  },
  permIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkText,
    marginBottom: 12,
    textAlign: "center",
  },
  permBody: {
    fontSize: 15,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    zIndex: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  appTitleGreen: {
    color: COLORS.lightGreen,
  },
  appSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },

  // ── Viewfinder ─────────────────────────────────────────────────────────────
  frameWrap: {
    position: "absolute",
    top: "22%",
    left: "8%",
    right: "8%",
    height: 300,
    zIndex: 5,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    background: "transparent",
    backgroundColor: "rgba(163,214,167,0.75)",
    shadowColor: COLORS.lightGreen,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  // ── Hint ──────────────────────────────────────────────────────────────────
  hintWrap: {
    position: "absolute",
    bottom: "26%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 6,
  },
  hintPill: {
    backgroundColor: "rgba(0,0,0,0.52)",
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  hintText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Bottom controls ────────────────────────────────────────────────────────
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingTop: 40,
    zIndex: 10,
  },
  sideBtn: {
    alignItems: "center",
    width: 56,
  },
  sideBtnIcon: {
    fontSize: 26,
    color: "#fff",
  },
  sideBtnLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    fontWeight: "500",
  },

  // ── Shutter ────────────────────────────────────────────────────────────────
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  shutterCapturing: {
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});
