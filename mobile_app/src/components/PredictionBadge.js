import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../styles/colors";

export default function PredictionBadge({ rank, label, confidence, isTop }) {
  const pct = Math.round(confidence * 100);

  return (
    <View style={[styles.row, isTop && styles.rowTop]}>
      {/* Rank badge */}
      <View style={[styles.rankBadge, isTop && styles.rankBadgeTop]}>
        <Text style={[styles.rankText, isTop && styles.rankTextTop]}>{rank}</Text>
      </View>

      {/* Label + bar */}
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, isTop && styles.labelTop]}>{label}</Text>
          <Text style={[styles.pct, isTop && styles.pctTop]}>{pct}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%` },
              isTop && styles.barFillTop,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowTop: {
    borderWidth: 1.5,
    borderColor: COLORS.lightGreen,
    backgroundColor: "#F0FAF1",
  },

  // ── Rank badge ─────────────────────────────────────────────────────────────
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadgeTop: {
    backgroundColor: COLORS.primary,
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.mutedText,
  },
  rankTextTop: {
    color: "#fff",
  },

  // ── Content ─────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkText,
    textTransform: "capitalize",
  },
  labelTop: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  pct: {
    fontSize: 13,
    color: COLORS.mutedText,
  },
  pctTop: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  // ── Bar ─────────────────────────────────────────────────────────────────────
  barTrack: {
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
  },
  barFillTop: {
    backgroundColor: COLORS.primary,
  },
});
