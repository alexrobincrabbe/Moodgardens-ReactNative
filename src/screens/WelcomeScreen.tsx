// src/screens/WelcomeScreen.tsx
import { StyleSheet, Text, View, Button } from "react-native";

type Props = {
  navigation: any; // keep it simple for now; we can type this later
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Gardens 🌱</Text>
      <Text style={styles.subtitle}>Your mood diary on mobile</Text>

      <View style={styles.buttonWrap}>
        <Button
          title="Log in"
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f0f7f5",
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#444",
    marginBottom: 24,
  },
  buttonWrap: {
    marginTop: 12,
    width: "60%",
  },
});
