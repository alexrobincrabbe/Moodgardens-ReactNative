// src/screens/AccountScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useApolloClient } from "@apollo/client/react";
import { useQuery, useMutation } from "@apollo/client/react";
import * as SecureStore from "expo-secure-store";

import { CURRENT_USER_QUERY } from "../graphql/auth";
import { UpdateUserProfile, ChangePassword } from "../graphql/user";

interface CurrentUserData {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    isPremium?: boolean | null;
    premiumSince?: string | null;
    createdAt?: string | null;
  } | null;
}

interface UpdateUserProfileData {
  updateUserProfile: {
    id: string;
    displayName: string;
    email: string;
  };
}

interface ChangePasswordData {
  changePassword: boolean;
}

export function AccountScreen() {
  const navigation: any = useNavigation();
  const client = useApolloClient();

  const { data, loading, error, refetch } = useQuery<CurrentUserData>(
    CURRENT_USER_QUERY,
    {
      fetchPolicy: "cache-and-network",
    }
  );

  const user = data?.user ?? null;

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Messages
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [updateProfile, { loading: savingProfile }] =
    useMutation<UpdateUserProfileData>(UpdateUserProfile);
  const [changePassword, { loading: savingPassword }] =
    useMutation<ChangePasswordData>(ChangePassword);

  const [loggingOut, setLoggingOut] = useState(false);

  // Fill form fields when user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setEmail(user.email);
    }
  }, [user?.id]); // only when user changes

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await SecureStore.deleteItemAsync("mg_token");
      await client.clearStore();

      const rootNav = navigation.getParent()?.getParent();
      if (rootNav) {
        rootNav.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      } else {
        navigation.navigate("Welcome");
      }
    } catch (e) {
      console.error("[logout] error:", e);
      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleSaveProfile() {
    setProfileMessage(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setProfileMessage("Display name and email cannot be empty.");
      return;
    }

    try {
      const result = await updateProfile({
        variables: {
          displayName: trimmedName,
          email: trimmedEmail,
        },
      });

      const updated = result.data?.updateUserProfile;
      if (updated) {
        setProfileMessage("Saved ✔ Your profile was updated.");
        // Make sure other screens see the change
        await refetch();
      } else {
        setProfileMessage("Profile update did not return data.");
      }
    } catch (e: any) {
      console.error("[updateProfile] error", e);
      setProfileMessage(e.message || "Could not update profile.");
    }
  }

  async function handleChangePassword() {
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill out all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    try {
      const result = await changePassword({
        variables: {
          currentPassword,
          newPassword,
        },
      });

      if (result.data?.changePassword) {
        setPasswordMessage("Password changed successfully ✔");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage("Password change did not succeed.");
      }
    } catch (e: any) {
      console.error("[changePassword] error", e);
      setPasswordMessage(e.message || "Could not change password.");
    }
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your account…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>
          Could not load account: {error.message}
        </Text>
        <View style={{ marginTop: 12 }}>
          <Button title="Retry" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.muted}>You’re not logged in right now.</Text>
        <View style={{ marginTop: 12 }}>
          <Button
            title="Go to login"
            onPress={() => {
              const rootNav = navigation.getParent()?.getParent();
              rootNav?.navigate("Login");
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isPremium = !!user.isPremium;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Account</Text>

      {/* PROFILE SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        {profileMessage && (
          <Text
            style={[
              styles.message,
              profileMessage.includes("✔") ? styles.messageSuccess : styles.messageError,
            ]}
          >
            {profileMessage}
          </Text>
        )}

        <View style={{ marginTop: 8 }}>
          <Button
            title={savingProfile ? "Saving…" : "Save profile"}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          />
        </View>
      </View>

      {/* PASSWORD SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change password</Text>

        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />

        <Text style={styles.label}>New password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm new password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {passwordMessage && (
          <Text
            style={[
              styles.message,
              passwordMessage.includes("✔")
                ? styles.messageSuccess
                : styles.messageError,
            ]}
          >
            {passwordMessage}
          </Text>
        )}

        <View style={{ marginTop: 8 }}>
          <Button
            title={savingPassword ? "Changing…" : "Change password"}
            onPress={handleChangePassword}
            disabled={savingPassword}
          />
        </View>
      </View>

      {/* PLAN + LOGOUT SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan</Text>
        <Text style={styles.label}>Status</Text>
        <Text style={[styles.value, isPremium && styles.premiumValue]}>
          {isPremium ? "Premium 🌟" : "Free"}
        </Text>
        <Text style={[styles.muted, { marginTop: 4 }]}>
          Managing upgrade/cancellation can stay on the web app for now.
        </Text>
      </View>

      <View style={styles.logoutWrap}>
        <Button
          title={loggingOut ? "Logging out…" : "Log out"}
          color="#c0392b"
          onPress={handleLogout}
          disabled={loggingOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    color: "#222",
  },
  premiumValue: {
    color: "#27ae60",
    fontWeight: "600",
  },
  muted: {
    fontSize: 14,
    color: "#666",
  },
  error: {
    fontSize: 14,
    color: "#c0392b",
    textAlign: "center",
  },
  message: {
    marginTop: 6,
    fontSize: 12,
  },
  messageSuccess: {
    color: "#27ae60",
  },
  messageError: {
    color: "#c0392b",
  },
  logoutWrap: {
    marginTop: 8,
  },
});
