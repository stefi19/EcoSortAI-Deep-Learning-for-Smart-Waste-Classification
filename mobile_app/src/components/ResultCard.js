import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";
import PredictionBadge from "./PredictionBadge";

// Map each waste class to an emoji for quick visual recognition
const CLASS_EMOJI = {
  battery:    "🔋",
  biological: "🌿",
  cardboard:  "📦",
  clothes:    "👕",
  glass:      "🫙",
  metal:      "🥫",
  paper:      "📄",
  plastic:    "♻️",
  shoes:      "👟",
  trash:      "🗑️",
};

// Colour accent per category — matches the bin chip border
const BIN_COLOR = {
  "Hazardous waste collection point": "#EF4444",
  "Organic / compost bin":            "#16A34A",
  "Paper and cardboard recycling bin":"#3B82F6",
  "Textile donation or textile recycling point": "#A855F7",
  "Textile/shoe donation or special collection point": "#A855F7",
  "Glass recycling bin":              "#06B6D4",
  "Metal recycling bin":              "#F59E0B",
  "Paper recycling bin":              "#3B82F6",
  "Plastic recycling bin":            "#EAB308",
  "General waste bin":                "#6B7280",
};

export default function ResultCard({ result, imageUri, onScanAgain }) {
  const {
    predicted_class,
    confidence,
    top_3_predictions,
    material,
    bin_category,
    recycling_advice,
    low_confidence,
    warning,
  } = result;

  const insets          = useSafeAreaInsets();
  const slideAnim       = useRef(new Animated.Value(60)).current;
  const fadeAnim        = useRef(new Animated.Value(0)).current;
  const barAnim         = useRef(new Animated.Value(0)).current;
  const confidencePct   = Math.round(confidence * 100);
  const emoji           = CLASS_EMOJI[predicted_class] ?? "♻️";
  const accentColor     = BIN_COLOR[bin_category] ?? COLORS.primary;

  useEffect(() => {
    Haptics.notificationAsync(
      low_confidence
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();

    // Animate confidence bar after card appears
    setTimeout(() => {
      Animated.timing(barAnim, {
        toValue: confidencePct / 100,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, 200);
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ── Captured image ── */}
        {imageUri && (
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Emoji badge */}
            <View style={styles.emojiBadge}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>
          </View>
        )}

        {/* ── Class name + material ── */}
        <View style={styles.header}>
          <Text style={styles.classLabel}>{predicted_class}</Text>
          <Text style={styles.material}>{material}</Text>
        </View>

        {/* ── Confidence bar ── */}
        <View style={styles.confSection}>
          <View style={styles.confRow}>
            <Text style={styles.confLabel}>Confidence</Text>
            <Text style={[styles.confPct, { color: confidencePct >= 70 ? COLORS.primary : COLORS.warning }]}>
              {confidencePct}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: barWidth,
                  backgroundColor: confidencePct >= 70 ? COLORS.primary : COLORS.warning,
                },
              ]}
            />
          </View>
        </View>

        {/* ── Low confidence warning ── */}
        {low_confidence && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}

        {/* ── Bin category chip ── */}
        <View style={[styles.binCard, { borderLeftColor: accentColor }]}>
          <Text style={styles.binSectionLabel}>RECYCLING BIN</Text>
          <View style={styles.binRow}>
            <Text style={styles.binIcon}>🗑</Text>
            <Text style={[styles.binText, { color: accentColor }]}>{bin_category}</Text>
          </View>
        </View>

        {/* ── Top-3 predictions ── */}
        <Text style={styles.sectionTitle}>Top predictions</Text>
        <View style={styles.badgeList}>
          {top_3_predictions.map((p, i) => (
            <PredictionBadge
              key={p.class}
              rank={i + 1}
              label={p.class}
              confidence={p.confidence}
              isTop={i === 0}
            />
          ))}
        </View>

        {/* ── Recycling advice ── */}
        <Text style={styles.sectionTitle}>Recycling advice</Text>
        <View style={styles.adviceCard}>
          <Text style={styles.adviceText}>{recycling_advice}</Text>
        </View>

        {/* ── Scan again ── */}
        <Pressable
          style={({ pressed }) => [styles.scanAgainBtn, pressed && styles.scanAgainBtnPressed]}
          onPress={onScanAgain}
        >
          <Text style={styles.scanAgainText}>📷  Scan Another Item</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingTop: 0,
  },

  // ── Image ──────────────────────────────────────────────────────────────────
  imageWrap: {
    width: "100%",
    height: 260,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emojiBadge: {
    position: "absolute",
    bottom: 14,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 28,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  classLabel: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.darkText,
    textTransform: "capitalize",
    letterSpacing: -0.5,
  },
  material: {
    fontSize: 14,
    color: COLORS.mutedText,
    marginTop: 4,
    lineHeight: 20,
  },

  // ── Confidence ─────────────────────────────────────────────────────────────
  confSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  confLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
    fontWeight: "500",
  },
  confPct: {
    fontSize: 13,
    fontWeight: "700",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },

  // ── Warning ─────────────────────────────────────────────────────────────────
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
    lineHeight: 19,
  },

  // ── Bin card ────────────────────────────────────────────────────────────────
  binCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  binSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.mutedText,
    letterSpacing: 1,
    marginBottom: 8,
  },
  binRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  binIcon: {
    fontSize: 18,
  },
  binText: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },

  // ── Section titles ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  badgeList: {
    paddingHorizontal: 20,
  },

  // ── Advice ──────────────────────────────────────────────────────────────────
  adviceCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adviceText: {
    fontSize: 14,
    color: COLORS.darkText,
    lineHeight: 22,
  },

  // ── Scan again ──────────────────────────────────────────────────────────────
  scanAgainBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  scanAgainBtnPressed: {
    opacity: 0.82,
  },
  scanAgainText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
