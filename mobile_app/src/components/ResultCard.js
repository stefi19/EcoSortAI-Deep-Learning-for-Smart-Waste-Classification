import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import PredictionBadge from "./PredictionBadge";
import { COLORS } from "../styles/colors";

function formatConfidence(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export default function ResultCard({ imageUri, prediction, onScanAgain }) {
  if (!prediction) return null;

  const confidence = Number(prediction.confidence || 0);

  return (
    <View style={styles.card}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.predictedClass}>{prediction.predicted_class}</Text>
            <Text style={styles.material}>{prediction.material}</Text>
          </View>
          <View style={styles.percentPill}>
            <Text style={styles.percentText}>{formatConfidence(confidence)}</Text>
          </View>
        </View>

        <View style={styles.confidenceHeader}>
          <Text style={styles.sectionTitle}>Confidence</Text>
          <Text style={styles.confidenceValue}>{formatConfidence(confidence)}</Text>
        </View>
        <View style={styles.confidenceTrack}>
          <View style={[styles.confidenceFill, { width: `${Math.min(confidence * 100, 100)}%` }]} />
        </View>

        {prediction.low_confidence ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{prediction.warning || "Low confidence: manual verification recommended."}</Text>
          </View>
        ) : null}

        <View style={styles.infoBox}>
          <Text style={styles.sectionTitle}>Recycling Bin</Text>
          <Text style={styles.binText}>{prediction.bin_category}</Text>
        </View>

        <View style={styles.topPredictions}>
          <Text style={styles.sectionTitle}>Top 3 Predictions</Text>
          {prediction.top_3_predictions.map((item, index) => (
            <PredictionBadge key={`${item.class}-${index}`} prediction={item} index={index} />
          ))}
        </View>

        <View style={styles.adviceBox}>
          <Text style={styles.sectionTitle}>Recycling Advice</Text>
          <Text style={styles.adviceText}>{prediction.recycling_advice}</Text>
        </View>

        <Pressable style={styles.scanAgainButton} onPress={onScanAgain}>
          <Text style={styles.scanAgainText}>Scan Another Item</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  image: {
    width: "100%",
    height: 210,
    backgroundColor: COLORS.softGreen
  },
  body: {
    padding: 18,
    gap: 16
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  titleBlock: {
    flex: 1
  },
  predictedClass: {
    color: COLORS.darkText,
    fontSize: 30,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  material: {
    marginTop: 4,
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  percentPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.softGreen
  },
  percentText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  confidenceValue: {
    color: COLORS.darkText,
    fontSize: 13,
    fontWeight: "800"
  },
  confidenceTrack: {
    height: 10,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: COLORS.background
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.primary
  },
  warningBox: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  infoBox: {
    gap: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.softGreen
  },
  binText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23
  },
  topPredictions: {
    gap: 9
  },
  adviceBox: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.background
  },
  adviceText: {
    color: COLORS.darkText,
    fontSize: 15,
    lineHeight: 22
  },
  scanAgainButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: COLORS.primary
  },
  scanAgainText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900"
  }
});
