// src/screens/LoginScreen.tsx
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons"; // 👈 add this
import { GoogleButton } from "../components/GoogleButton";
import { MGGradientScreen } from "../components/MGGradientScreen";
import { MGText } from "../components/MGText";
import { MGButton } from "../components/button";
import { SafeAreaView } from "react-native-safe-area-context";

let GoogleSignin: any = null;
let statusCodes: any = null;
let isSuccessResponse: any = null;

if (Constants.appOwnership !== "expo") {
  const googleModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleModule.GoogleSignin;
  statusCodes = googleModule.statusCodes;
  isSuccessResponse = googleModule.isSuccessResponse;

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}

import { LOGIN_MUTATION } from "../graphql/auth";
import Constants from "expo-constants";

if (Constants.appOwnership !== "expo") {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}

const LOGIN_WITH_GOOGLE = gql`
  mutation LoginWithGoogle($idToken: String!) {
    loginWithGoogle(idToken: $idToken) {
      token
      user {
        id
        email
        displayName
      }
    }
  }
`;

interface LoginData {
  login: {
    token: string;
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  };
}

interface LoginWithGoogleData {
  loginWithGoogle: {
    token: string;
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  };
}

type Props = {
  navigation: any;
};

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading, error }] = useMutation<LoginData>(LOGIN_MUTATION);
  const [loginWithGoogle, { loading: googleLoading }] =
    useMutation<LoginWithGoogleData>(LOGIN_WITH_GOOGLE);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      const { data } = await login({
        variables: { email: email.trim(), password },
      });

      const token = data?.login?.token;
      if (!token) {
        Alert.alert("Login failed", "No token returned from server.");
        return;
      }

      await SecureStore.setItemAsync("mg_token", token);
      navigation.replace("App");
    } catch (e: any) {
      Alert.alert(
        "Login failed",
        "Please check your credentials and try again."
      );
    }
  }

  async function handleGoogleLogin() {
    if (Constants.appOwnership === "expo") {
      Alert.alert(
        "Google login not available",
        "Google login only works in the installed test build, not in Expo Go."
      );
      return;
    }

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const result = await GoogleSignin.signIn();

      if (!isSuccessResponse(result)) {
        // user cancelled
        return;
      }

      const idToken = result.data.idToken;

      if (!idToken) {
        Alert.alert("Google login failed", "No ID token returned from Google.");
        return;
      }

      const { data } = await loginWithGoogle({
        variables: { idToken },
      });

      const token = data?.loginWithGoogle?.token;
      if (!token) {
        Alert.alert(
          "Login failed",
          "The server did not return a session token."
        );
        return;
      }

      await SecureStore.setItemAsync("mg_token", token);
      navigation.replace("App");
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error("[google-login] error", err);
      Alert.alert(
        "Google login failed",
        "There was a problem logging in with Google."
      );
    }
  }

  return (
      <MGGradientScreen>
        <View style={styles.center}>
          <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(94, 165, 162, 1)"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(94, 165, 162, 1)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24} // 👈 bigger icon
                  color="rgba(94, 165, 162, 1)"
                />
              </Pressable>
            </View>

            {error && (
              <Text style={styles.error}>
                {error.message.includes("Invalid credentials")
                  ? "Invalid email or password."
                  : error.message}
              </Text>
            )}

            <View style={styles.buttonWrap}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Logging in…</Text>
                </View>
              ) : (
                <MGButton title="Log in" onPress={handleSubmit} />
              )}
            </View>

            <MGText style={styles.orText}>or</MGText>

            <View style={styles.buttonWrap}>
              <GoogleButton
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                loading={googleLoading}
              />
            </View>

            {Platform.OS === "ios" && (
              <View style={{ marginTop: 12 }}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={8}
                  style={{ width: "100%", height: 44 }}
                  onPress={async () => {
                    try {
                      const credential = await AppleAuthentication.signInAsync({
                        requestedScopes: [
                          AppleAuthentication.AppleAuthenticationScope
                            .FULL_NAME,
                          AppleAuthentication.AppleAuthenticationScope.EMAIL,
                        ],
                      });

                      const idToken = credential.identityToken;
                      if (!idToken) {
                        Alert.alert(
                          "Apple login failed",
                          "No identity token returned from Apple."
                        );
                        return;
                      }

                      // TODO: call a future loginWithApple mutation here
                      // const { data } = await loginWithApple({ variables: { idToken } });
                    } catch (e: any) {
                      if (e.code === "ERR_REQUEST_CANCELED") {
                        return;
                      }
                      console.error("[apple-login] error", e);
                      Alert.alert(
                        "Apple login failed",
                        "There was a problem logging in with Apple."
                      );
                    }
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </MGGradientScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    fontFamily: "ZenLoop",
    fontSize: 54,
    color: "rgba(94, 165, 162, 1)",
    marginTop: 4,
    marginBottom: 24,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  orText: {
    textAlign: "center",
    marginVertical: 12,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  showPasswordButton: {
    marginLeft: 8,
    color: "#007AFF",
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  container: {
    justifyContent: "center",
    width: 300,
    height: 450,
    borderRadius: 20,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    paddingRight: 40,
  },
  buttonWrap: {
    alignItems: "center",
    marginTop: 16,
  },
  error: {
    textAlign: "center",
    color: "#c0392b",
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 20,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%", // stretch to full height of input
    justifyContent: "center", // 👈 perfect vertical centering
    alignItems: "center", // horizontal centering
    width: 40,
    paddingBottom: 10,
  },
});
