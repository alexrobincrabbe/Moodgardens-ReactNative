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
import { MGButton } from "../components/button";
import { MGText } from "../components/MGText";
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
        <MGText style={styles.muted}>Loading settings…</MGText>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <MGText style={styles.error}>
          Could not load settings: {error.message}
        </MGText>
        <View style={{ marginTop: 12 }}>
          <MGButton title="Retry" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <MGText style={styles.muted}>You’re not logged in right now.</MGText>
        <View style={{ marginTop: 12 }}>
          <MGButton
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
    <View style={styles.container}>

      <View style={styles.card}>
        <MGText style={styles.cardTitle}>Day boundaries</MGText>
        <MGText style={styles.description}>
          Control how we group your diary entries into “days”.
        </MGText>

        <MGText style={styles.label}>Timezone (IANA ID, e.g. Europe/Berlin)</MGText>
        <TextInput
          style={styles.input}
          value={timezone}
          onChangeText={setTimezone}
          placeholder="Europe/Berlin"
          autoCapitalize="none"
        />

        <View style={{ marginTop: 6, marginBottom: 10 }}>
          <MGButton
            title="Use device timezone"
            onPress={handleUseDeviceTimezone}
          />
        </View>

        <MGText style={styles.label}>Day rollover hour (0 – 23)</MGText>
        <TextInput
          style={styles.input}
          value={rolloverHour}
          onChangeText={setRolloverHour}
          keyboardType="number-pad"
          placeholder="0"
        />
        <MGText style={styles.helper}>
          Example: 3 means your “day” counts entries from 03:00 to 02:59 the
          next day.
        </MGText>

        {message && (
          <MGText
            style={[
              styles.message,
              message.includes("✔") ? styles.messageSuccess : styles.messageError,
            ]}
          >
            {message}
          </MGText>
        )}

        <View style={{ marginTop: 10 }}>
          <MGButton
            title={saving ? "Saving…" : "Save settings"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </View>
    </View>
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
    paddingHorizontal: 16,
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
