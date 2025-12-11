import { Pressable, Text, StyleSheet } from "react-native";

type MGButtonProps = {
  disabled?: boolean;
  title: string;
  onPress: () => void;
};

export function MGButton({ disabled = false, title, onPress }: MGButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed, // 👈 automatic press effect
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

type CalendarButtonProps = {
  title: string;
  onPress: () => void;
};

export function CalendarButton({ title, onPress }: CalendarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.calendarButton,
        pressed && styles.calendarButtonPressed, // 👈 automatic press effect
      ]}
    >
      <Text style={styles.CalendarButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#9bdcb5ff",
    paddingVertical: 3,
    paddingHorizontal: 20,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",

    // optional subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  // 👇 this applies only while pressed
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  text: {
    fontSize: 30,
    lineHeight:30,
    fontFamily: "ZenLoop",
    color: "white",
  },

  calendarButton: {
    borderRadius: 10,
    color: "white",
    width: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#B4CDC7",
  },
  calendarButtonPressed: {
    backgroundColor: "rgba(208, 218, 216, 1)",
  },
  CalendarButtonText: {
    fontSize: 25,
    fontFamily: "PoiretOne",
    color: "white",
  },
});
