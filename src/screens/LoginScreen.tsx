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
} from "react-native";
import { useState } from "react";
import { useMutation} from "@apollo/client/react";
import { gql } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { LOGIN_MUTATION } from "../graphql/auth";
import { GoogleButton } from "../components/GoogleButton";

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

// Add this mutation for Google login:
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
      console.error("[login] error:", e);
      Alert.alert(
        "Login failed",
        "Please check your credentials and try again."
      );
    }
  }

  async function handleGoogleLogin() {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const result = await GoogleSignin.signIn();

      // result is SignInResponse (success | cancelled)
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
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled; ignore
        return;
      }
      console.error("[google-login] error", err);
      Alert.alert(
        "Google login failed",
        "There was a problem logging in with Google."
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />
        <Text
          style={styles.showPasswordButton}
          onPress={() => setShowPassword((v) => !v)}
        >
          {showPassword ? "Hide" : "Show"}
        </Text>
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
          <Button title="Log in" onPress={handleSubmit} />
        )}
      </View>

      <Text style={styles.orText}>or</Text>

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
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
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
  );
}

const styles = StyleSheet.create({
  orText: {
    textAlign: "center",
    marginVertical: 12,
    color: "#666",
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
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  buttonWrap: {
    marginTop: 16,
  },
  error: {
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
});
