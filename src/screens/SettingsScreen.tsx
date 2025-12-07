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
import { useQuery, useMutation } from "@apollo/client/react";

import { CURRENT_USER_QUERY } from "../graphql/auth";
import { UpdateUserSettings } from "../graphql/userProfile";

interface CurrentUserData {
  user: {
    id: string;
    timezone: string | null;
    dayRolloverHour: number | null;
  } | null;
}

interface UpdateUserSettingsData {
  updateUserSettings: {
    id: string;
    timezone: string;
    dayRolloverHour: number;
  };
}

export function SettingsScreen() {
  const navigation: any = useNavigation();

  const { data, loading, error, refetch } =
    useQuery<CurrentUserData>(CURRENT_USER_QUERY, {
      fetchPolicy: "cache-and-network",
    });

  const user = data?.user ?? null;

  const [timezone, setTimezone] = useState("");
  const [rolloverHour, setRolloverHour] = useState("0");
  const [message, setMessage] = useState<string | null>(null);

  const [updateSettings, { loading: saving }] =
    useMutation<UpdateUserSettingsData>(UpdateUserSettings);

  // Initialize form once user data is loaded
  useEffect(() => {
    if (user) {
      setTimezone(user.timezone ?? "");
      setRolloverHour(
        typeof user.dayRolloverHour === "number"
          ? String(user.dayRolloverHour)
          : "0"
      );
    }
  }, [user?.id]);

  function handleUseDeviceTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
      setMessage(`Using device timezone: ${tz}`);
    } catch {
      setMessage("Could not detect device timezone.");
    }
  }

  async function handleSave() {
    setMessage(null);

    const trimmedTz = timezone.trim();
    const parsedHour = Number(rolloverHour);

    if (!trimmedTz) {
      setMessage("Timezone cannot be empty.");
      return;
    }

    if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      setMessage("Rollover hour must be an integer between 0 and 23.");
      return;
    }

    try {
      const result = await updateSettings({
        variables: {
          timezone: trimmedTz,
          dayRolloverHour: parsedHour,
        },
      });

      if (result.data?.updateUserSettings) {
        setMessage("Settings saved ✔");
        await refetch();
      } else {
        setMessage("Settings update did not return data.");
      }
    } catch (e: any) {
      console.error("[updateSettings] error", e);
      setMessage(e.message || "Could not update settings.");
    }
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading settings…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>
          Could not load settings: {error.message}
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
        <Text style={styles.title}>Settings</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Day boundaries</Text>
        <Text style={styles.description}>
          Control how we group your diary entries into “days”.
        </Text>

        <Text style={styles.label}>Timezone (IANA ID, e.g. Europe/Berlin)</Text>
        <TextInput
          style={styles.input}
          value={timezone}
          onChangeText={setTimezone}
          placeholder="Europe/Berlin"
          autoCapitalize="none"
        />

        <View style={{ marginTop: 6, marginBottom: 10 }}>
          <Button
            title="Use device timezone"
            onPress={handleUseDeviceTimezone}
          />
        </View>

        <Text style={styles.label}>Day rollover hour (0 – 23)</Text>
        <TextInput
          style={styles.input}
          value={rolloverHour}
          onChangeText={setRolloverHour}
          keyboardType="number-pad"
          placeholder="0"
        />
        <Text style={styles.helper}>
          Example: 3 means your “day” counts entries from 03:00 to 02:59 the
          next day.
        </Text>

        {message && (
          <Text
            style={[
              styles.message,
              message.includes("✔") ? styles.messageSuccess : styles.messageError,
            ]}
          >
            {message}
          </Text>
        )}

        <View style={{ marginTop: 10 }}>
          <Button
            title={saving ? "Saving…" : "Save settings"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
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
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
    marginTop: 6,
  },
  helper: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
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
});
