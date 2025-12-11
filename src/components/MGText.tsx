import { Text, TextProps, StyleSheet } from "react-native";

export function MGText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[styles.default, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: "PoiretOne",   // 👈 your global font
    color: "rgba(94, 165, 162, 1)",
  },
});
