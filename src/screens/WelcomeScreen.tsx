// src/screens/WelcomeScreen.tsx
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MGButton } from "../components/button";
import { MGText } from "../components/MGText";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  navigation: any;
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#c7d9d3", "#d8f1f4", "#fbe9db"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Top section: logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/MGbadge.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Middle: title + subtitle */}
        <View style={styles.textWrap}>
          <MGText style={styles.title}>Mood Gardens</MGText>
          <MGText style={styles.subtitle}>Your mood diary on mobile</MGText>
        </View>

        {/* Bottom: button */}
        <View style={styles.buttonWrap}>
          <MGButton
            title="Log in"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    color: "white",
    flex: 1,
    paddingHorizontal: 24,
  },

  logoWrap: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrap: {
    flex: 2,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  buttonWrap: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },

  logo: {
    width: "80%",
    maxWidth: 320,
    aspectRatio: 1,
  },
  title: {
    fontFamily: "ZenLoop",
    fontSize: 54,
    color: "rgba(94, 165, 162, 1)",
    marginTop: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 12,
  },
});
