import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../styles/colors";

export default function LoadingOverlay({ visible }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>Analyzing waste item...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(27, 27, 27, 0.35)"
  },
  box: {
    width: 210,
    alignItems: "center",
    gap: 14,
    padding: 22,
    borderRadius: 18,
    backgroundColor: COLORS.white
  },
  text: {
    color: COLORS.darkText,
    fontSize: 15,
    fontWeight: "700"
  }
});
