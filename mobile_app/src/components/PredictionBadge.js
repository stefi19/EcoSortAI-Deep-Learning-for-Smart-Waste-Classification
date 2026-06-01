// Displays a single prediction row (rank, class name, confidence bar).
// Used inside the top-3 predictions list in ResultCard.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../styles/colors";

export default function PredictionBadge({ rank, label, confidence }) {
  const pct = Math.round(confidence * 100);

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>

      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>

        {/* Confidence bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
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
    gap: 10,
  },
  rank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.lightGreen,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkText,
    textTransform: "capitalize",
  },
  pct: {
    fontSize: 13,
    color: COLORS.mutedText,
  },
  barTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});
