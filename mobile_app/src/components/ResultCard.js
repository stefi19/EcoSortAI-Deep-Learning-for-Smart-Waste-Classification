// Full result card displayed after a successful prediction.
// Shows predicted class, material, bin category, confidence bar,
// top-3 predictions, recycling advice, and a low-confidence warning.

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../styles/colors";
import PredictionBadge from "./PredictionBadge";

export default function ResultCard({ result, onScanAgain }) {
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

  const confidencePct = Math.round(confidence * 100);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.classLabel}>{predicted_class}</Text>
        <Text style={styles.material}>{material}</Text>
      </View>

      {/* ── Confidence bar ── */}
      <View style={styles.confRow}>
        <Text style={styles.confLabel}>Confidence</Text>
        <Text style={styles.confPct}>{confidencePct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${confidencePct}%` }]} />
      </View>

      {/* ── Bin category ── */}
      <View style={styles.binCard}>
        <Text style={styles.binTitle}>Recycling bin</Text>
        <Text style={styles.binText}>{bin_category}</Text>
      </View>

      {/* ── Low confidence warning ── */}
      {low_confidence && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}

      {/* ── Top-3 predictions ── */}
      <Text style={styles.sectionTitle}>Top 3 predictions</Text>
      {top_3_predictions.map((p, i) => (
        <PredictionBadge
          key={p.class}
          rank={i + 1}
          label={p.class}
          confidence={p.confidence}
        />
      ))}

      {/* ── Recycling advice ── */}
      <Text style={styles.sectionTitle}>Recycling advice</Text>
      <View style={styles.adviceCard}>
        <Text style={styles.adviceText}>{recycling_advice}</Text>
      </View>

      {/* ── Scan again ── */}
      <TouchableOpacity style={styles.button} onPress={onScanAgain}>
        <Text style={styles.buttonText}>Scan Another Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  classLabel: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.darkText,
    textTransform: "capitalize",
  },
  material: {
    fontSize: 15,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  confLabel: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
  confPct: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  barTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  barFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  binCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  binTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  binText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.darkText,
    marginBottom: 12,
    marginTop: 8,
  },
  adviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  adviceText: {
    fontSize: 14,
    color: COLORS.darkText,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
