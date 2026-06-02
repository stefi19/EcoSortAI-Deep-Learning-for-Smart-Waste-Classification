import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../styles/colors";

function formatConfidence(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export default function PredictionBadge({ prediction, index }) {
  const confidence = Number(prediction?.confidence || 0);

  return (
    <View style={[styles.row, index === 0 && styles.firstRow]}>
      <View style={[styles.rank, index === 0 && styles.firstRank]}>
        <Text style={[styles.rankText, index === 0 && styles.firstRankText]}>{index + 1}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text style={[styles.name, index === 0 && styles.firstText]}>{prediction?.class || "unknown"}</Text>
          <Text style={[styles.percent, index === 0 && styles.firstText]}>{formatConfidence(confidence)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, index === 0 && styles.firstBar, { width: `${Math.min(confidence * 100, 100)}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  firstRow: {
    backgroundColor: COLORS.softGreen,
    borderColor: COLORS.lightGreen
  },
  rank: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.white
  },
  firstRank: {
    backgroundColor: COLORS.primary
  },
  rankText: {
    color: COLORS.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  firstRankText: {
    color: COLORS.white
  },
  content: {
    flex: 1
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  name: {
    color: COLORS.darkText,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  percent: {
    color: COLORS.mutedText,
    fontSize: 14,
    fontWeight: "700"
  },
  firstText: {
    color: COLORS.primary
  },
  barTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: COLORS.white
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: COLORS.lightGreen
  },
  firstBar: {
    backgroundColor: COLORS.primary
  }
});
