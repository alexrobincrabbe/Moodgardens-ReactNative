import React, { ReactNode } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type MGGradientScreenProps = {
  children: ReactNode;
  style?: ViewStyle; // extra styles for inner content
  colors?: string[]; // optional override for gradient colors
};

export function MGGradientScreen({ children, style }: MGGradientScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <LinearGradient
        colors={["#c7d9d3", "#d8f1f4", "#fbe9db"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, style]}
      >
        {children}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
