import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function GoogleButton({ onPress, disabled, loading }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Image
          source={require("../../assets/google.png")}
          style={{ width: 20, height: 20 , marginRight:10}}
          contentFit="contain"
        />
        <Text style={styles.label}>
          {loading ? "Connecting..." : "Continue with Google"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  iconText: {
    fontWeight: "700",
    color: "#4285F4", // Google blue-ish
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
});
