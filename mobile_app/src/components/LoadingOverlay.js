import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../styles/colors";

export default function LoadingOverlay({ imageUri }) {
  // Spinning ring
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Pulsing dots
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Staggered dot pulse
    function pulseDot(anim, delay) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    }
    const a = pulseDot(dot1, 0);
    const b = pulseDot(dot2, 200);
    const c = pulseDot(dot3, 400);
    a.start(); b.start(); c.start();
    return () => { a.stop(); b.stop(); c.stop(); };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Blurred background — the captured image shown dimmed */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[StyleSheet.absoluteFill, styles.bgImage]}
          blurRadius={12}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      )}

      {/* Dark scrim */}
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />

      {/* Card */}
      <View style={styles.card}>
        {/* Spinning ring */}
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />

        {/* Green dot in center */}
        <View style={styles.centerDot} />

        <Text style={styles.title}>Analyzing image</Text>

        {/* Pulsing dots */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
          ))}
        </View>

        <Text style={styles.sub}>Running EfficientNet-B0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    opacity: 0.6,
  },
  scrim: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  ring: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.lightGreen,
  },
  centerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.lightGreen,
  },
  sub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
});
