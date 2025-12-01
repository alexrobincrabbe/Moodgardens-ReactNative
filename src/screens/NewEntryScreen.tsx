// src/screens/NewEntryScreen.tsx
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
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@apollo/client/react";

import {
  CreateDiaryEntry,
  TodayMetaQuery,
  RequestGenerateGarden,
  GetGarden,
} from "../graphql/diary";

type GardenType = "CLASSIC" | "UNDERWATER" | "GALAXY";
type GardenStatus = "PENDING" | "READY" | "FAILED";

interface TodayMetaData {
  currentDiaryDayKey: string | null;
}

interface CreateDiaryEntryData {
  createDiaryEntry: {
    id: string;
    createdAt: string;
  };
}

interface RequestGenerateGardenData {
  requestGenerateGarden: {
    id: string;
    status: GardenStatus;
    period: string;
    periodKey: string;
    imageUrl?: string | null;
    publicId?: string | null;
    shareUrl?: string | null;
    progress?: number | null;
    updatedAt: string;
  };
}

interface GardenData {
  garden: {
    id: string;
    status: GardenStatus;
    imageUrl?: string | null;
    publicId?: string | null;
    shareUrl?: string | null;
    summary?: string | null;
    period: string;
    periodKey: string;
    progress?: number | null;
    updatedAt: string;
  } | null;
}

export function NewEntryScreen() {
  const navigation: any = useNavigation();

  const [text, setText] = useState("");
  const [selectedType, setSelectedType] = useState<GardenType>("CLASSIC");
  const [isGenerating, setIsGenerating] = useState(false);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  // 1) Get today's diary day key
  const {
    data: todayMetaData,
    loading: todayMetaLoading,
    error: todayMetaError,
  } = useQuery<TodayMetaData>(TodayMetaQuery, {
    fetchPolicy: "network-only",
  });

  // 2) Mutations for creating entry + requesting garden
  const [createEntry, { loading: creating, error: createError }] =
    useMutation<CreateDiaryEntryData>(CreateDiaryEntry);

  const [requestGarden, { loading: requesting, error: requestError }] =
    useMutation<RequestGenerateGardenData>(RequestGenerateGarden);

  // 3) Poll garden status once we've started generation
  const {
    data: gardenData,
    loading: gardenLoading,
    error: gardenError,
  } = useQuery<GardenData>(GetGarden, {
    variables: {
      period: "DAY",
      periodKey: todayKey as string,
    },
    skip: !todayKey || !isGenerating,
    fetchPolicy: "network-only",
    pollInterval: 2000,
    notifyOnNetworkStatusChange: true,
  });

  const garden = gardenData?.garden ?? null;
  const status = garden?.status;
  const progress =
    typeof garden?.progress === "number"
      ? Math.round(garden.progress as number)
      : null;

  // When garden becomes READY, go back to Today (Home)
  useEffect(() => {
    if (!isGenerating || !status) return;

    if (status === "READY") {
      // small delay is optional; remove if you prefer instant jump
      setTimeout(() => {
        navigation.navigate("TodayMain");

      }, 500);
    }
  }, [isGenerating, status, navigation]);

  async function handleGenerate(forType: GardenType) {
    if (!text.trim()) {
      Alert.alert(
        "Entry text required",
        "Write a little about your day before generating a garden."
      );
      return;
    }

    const dayKey =
      todayMetaData?.currentDiaryDayKey ??
      null;

    if (!dayKey) {
      Alert.alert(
        "Could not determine today",
        "We couldn’t determine today’s diary key. Please try again in a moment."
      );
      return;
    }

    try {
      setSelectedType(forType);

      // 1) Create diary entry
      await createEntry({
        variables: { text: text.trim() },
      });

      // 2) Store todayKey locally
      setTodayKey(dayKey);

      // 3) Request garden generation
      await requestGarden({
        variables: {
          period: "DAY",
          periodKey: dayKey,
          gardenType: forType,
        },
      });

      // 4) Switch into "generating" mode (polling kicks in)
      setIsGenerating(true);
    } catch (err) {
      console.error("[new-entry] error in handleGenerate:", err);
      Alert.alert(
        "Error",
        "There was a problem creating your entry or starting the garden. Please try again."
      );
    }
  }

  // While we don't have today's key at all
  if (todayMetaLoading && !todayMetaData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Preparing today’s entry…</Text>
      </View>
    );
  }

  if (todayMetaError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          Could not load today’s date info: {todayMetaError.message}
        </Text>
      </View>
    );
  }

  // STEP 1: Entry form (before generating)
  if (!isGenerating) {
    const submitting = creating || requesting;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Today’s entry</Text>
        <Text style={styles.subtitle}>
          Write about your day. We’ll grow a Mood Garden from your words.
        </Text>

        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={6}
          placeholder="How are you feeling? What happened today?"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        {/* garden type buttons */}
        <View style={styles.typeRow}>
          <GardenTypeButton
            label="Classic"
            active={selectedType === "CLASSIC"}
            onPress={() => setSelectedType("CLASSIC")}
          />
          <GardenTypeButton
            label="Underwater"
            active={selectedType === "UNDERWATER"}
            onPress={() => setSelectedType("UNDERWATER")}
          />
          <GardenTypeButton
            label="Galaxy"
            active={selectedType === "GALAXY"}
            onPress={() => setSelectedType("GALAXY")}
          />
        </View>

        <View style={styles.submitWrap}>
          <Button
            title={submitting ? "Generating…" : "Generate garden"}
            onPress={() => handleGenerate(selectedType)}
            disabled={submitting}
          />
        </View>

        {(createError || requestError) && (
          <Text style={styles.error}>
            {createError?.message || requestError?.message}
          </Text>
        )}
      </View>
    );
  }

  // STEP 2: Generating view (after requestGenerateGarden)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Growing your garden… 🌱</Text>
      <Text style={styles.subtitle}>
        This might take a little moment. You can leave this screen – your
        garden will appear on Today when it’s ready.
      </Text>

      <View style={styles.statusBox}>
        {gardenLoading && !garden && <ActivityIndicator />}

        {status && (
          <Text style={styles.statusText}>
            Status: <Text style={styles.statusBold}>{status}</Text>
          </Text>
        )}

        {typeof progress === "number" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Growing…</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressOuter}>
              <View
                style={[styles.progressInner, { width: `${progress}%` }]}
              />
            </View>
          </View>
        )}

        {gardenError && (
          <Text style={styles.error}>
            Error checking garden: {gardenError.message}
          </Text>
        )}
      </View>

      <View style={styles.submitWrap}>
        <Button
          title="Back to Today"
           onPress={() => navigation.navigate("TodayMain")}

        />
      </View>
    </View>
  );
}

// small helper component for garden type buttons
type GTButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function GardenTypeButton({ label, active, onPress }: GTButtonProps) {
  return (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Button
        title={label}
        onPress={onPress}
        color={active ? "#2ecc71" : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  muted: {
    fontSize: 14,
    color: "#666",
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    minHeight: 140,
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  submitWrap: {
    marginTop: 4,
  },
  error: {
    marginTop: 10,
    fontSize: 14,
    color: "#c0392b",
  },
  statusBox: {
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBold: {
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
  },
  progressPercent: {
    fontSize: 12,
    color: "#333",
  },
  progressOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: "#2ecc71",
  },
});
