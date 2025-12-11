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
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@apollo/client/react";

import {
  CreateDiaryEntry,
  TodayMetaQuery,
  RequestGenerateGarden,
} from "../graphql/diary";
import { GetGarden } from "../graphql/gardens";
import { MGText } from "../components/MGText";
import { MGButton } from "../components/button";
import {
  CURRENT_USER_QUERY,
  type CurrentUserData,
  User,
} from "../graphql/auth";
import { useGardenGeneration } from "../hooks/useGardenGeneration";


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
    version?: number | null;
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
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery<CurrentUserData>(
    CURRENT_USER_QUERY,
    {
      fetchPolicy: "cache-and-network",
    }
  );

  const user = data?.user ?? null;
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

    const [isGenerating, setIsGenerating] = useState(false);

const {
  garden,
  status,
  progress,
  loading: gardenLoading,
  error: gardenError,
} = useGardenGeneration(todayKey, isGenerating);


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

    const dayKey = todayMetaData?.currentDiaryDayKey ?? null;

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
        <MGText style={styles.subtitle}>
          Write about your day. We’ll grow a Mood Garden from your words.
        </MGText>
        <View style={{ position: "relative" }}>
          {text.length === 0 && (
            <Text
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: "rgba(94, 165, 162, 1)",
                fontFamily: "OoohBaby",
                fontSize: 18,
                zIndex: 1,
              }}
            >
              How are you feeling? What happened today?
            </Text>
          )}
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={6}
            placeholder=""
            placeholderTextColor={"rgba(94, 165, 162, 1)"}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
        </View>

        {/* garden type buttons */}
        <View style={styles.typeRow}>
          <GardenTypeButton
            user={user}
            label="Classic"
            active={selectedType === "CLASSIC"}
            onPress={() => setSelectedType("CLASSIC")}
          />
          <GardenTypeButton
            user={user}
            label="Underwater"
            active={selectedType === "UNDERWATER"}
            onPress={() => setSelectedType("UNDERWATER")}
          />
          <GardenTypeButton
            user={user}
            label="Galaxy"
            active={selectedType === "GALAXY"}
            onPress={() => setSelectedType("GALAXY")}
          />
        </View>

        <View style={styles.submitWrap}>
          <MGButton
            title={
              submitting
                ? "Generating…"
                : `Generate ${getGardentype(selectedType)}`
            }
            onPress={() => handleGenerate(selectedType)}
            disabled={submitting}
          />
        </View>

        {(createError || requestError) && (
          <MGText style={styles.error}>
            {createError?.message || requestError?.message}
          </MGText>
        )}
      </View>
    );
  }

  // STEP 2: Generating view (after requestGenerateGarden)
  return (
    <View style={styles.container}>
      <MGText style={styles.title}>
        {selectedType === "CLASSIC" && "Growing your garden…"}
        {selectedType === "UNDERWATER" && "Growing your underwater garden…"}
        {selectedType === "GALAXY" && "Creating your galaxy…"}
      </MGText>
      <MGText style={styles.subtitle}>
        This might take a little moment. You can leave this screen – your garden
        will appear on Today when it’s ready.
      </MGText>

      <View style={styles.statusBox}>
        {gardenLoading && !garden && <ActivityIndicator />}

        {status && (
          <MGText style={styles.statusText}>
            Status: <MGText style={styles.statusBold}>{status}</MGText>
          </MGText>
        )}

        {typeof progress === "number" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <MGText style={styles.progressLabel}>Growing…</MGText>
              <MGText style={styles.progressPercent}>{progress}%</MGText>
            </View>
            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {gardenError && (
          <MGText style={styles.error}>
            Error checking garden: {gardenError.message}
          </MGText>
        )}
      </View>

      <View style={styles.submitWrap}>
        <MGButton
          title="Back to Today"
          onPress={() => navigation.navigate("TodayMain")}
        />
      </View>
    </View>
  );
}

// small helper component for garden type buttons
type GTButtonProps = {
  user: User;
  label: string;
  active: boolean;
  onPress: () => void;
};

function GardenTypeButton({ user, label, active, onPress }: GTButtonProps) {
  return (
    <View
      style={[
        styles.gardenButton,
        label === "Classic" && styles.classicButton,
        label === "Underwater" && user?.isPremium && styles.underwatterButton,
        label === "Galaxy" && user?.isPremium && styles.galaxyButton,
        active && styles.gardenButtonActive,
      ]}
    >
      <Pressable
        style={{ justifyContent: "center", alignItems: "center" }}
        onPress={onPress}
        disabled={
          !user?.isPremium && (label === "Underwater" || label === "Galaxy")
        }
      >
        <Text
          style={[
            styles.gardenButtonText,
            active && styles.GardenButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gardenButton: {
    backgroundColor: "#9f9f9fff",
    borderColor: "#8f8f8fff",
    opacity: 1,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
    marginHorizontal: 4,
    padding: 2,
    borderWidth: 3,
  },
  classicButton: {
    backgroundColor: "#80b595ff",
    borderColor: "#7ba88dff",
  },
  underwatterButton: {
    backgroundColor: "#81cdedff",
    borderColor: "#78bedcff",
  },
  galaxyButton: {
    backgroundColor: "#51517aff",
    borderColor: "#494968ff",
  },
  gardenButtonActive: {
    borderColor: "#fffefeff",
    opacity: 1,
    borderWidth: 3,
    // iOS
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    // Android
    elevation: 0,
  },
  gardenButtonText: {
    textAlign: "center",
    lineHeight: 30,
    fontFamily: "ZenLoop",
    color: "white",
    fontSize: 30,
  },
  GardenButtonTextActive: {
    color: "white",
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    backgroundColor: "#9CB7BE",
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "white",
    marginBottom: 16,
  },
  muted: {
    fontSize: 14,
    color: "#666",
  },
  textarea: {
    borderWidth: 1,
    backgroundColor: "white",
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    minHeight: 300,
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  submitWrap: {
    marginTop: 25,
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

function getGardentype(selectedType: string) {
  if (selectedType === "CLASSIC") return "mood garden";
  else if (selectedType === "UNDERWATER") return "underwater garden";
  else return "mood galaxy";
}
