// src/screens/EntryDetailScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";
import { RegenerateGarden, GetGarden } from "../graphql/gardens";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";

type GardenStatus = "PENDING" | "READY" | "FAILED";

type Garden = {
  id: string;
  status: GardenStatus;
  imageUrl?: string | null;
  publicId?: string | null;
  shareUrl?: string | null;
  progress?: number | null;
  periodKey: string;
  updatedAt: string;
  version?: number | null;
};

interface GardenQueryData {
  garden: Garden | null;
}

export function EntryDetailScreen({ route, navigation }: any) {
  const { entry } = route.params as {
    entry: {
      id: string;
      text: string;
      dayKey: string;
      createdAt: string;
      garden?: Garden | null;
    };
  };

  // --- regeneration state ---
  const [isRegenerating, setIsRegenerating] = useState(false);
  const hasSeenNonReady = useRef(false);

  const [regenerateGardenMutation, { loading: regenLoading }] =
    useMutation(RegenerateGarden);

  // Poll garden status for this dayKey only while regenerating
  const {
    data: liveGardenData,
    loading: gardenLoading,
    error: gardenError,
    stopPolling,
  } = useQuery<GardenQueryData>(GetGarden, {
    variables: { period: "DAY", periodKey: entry.dayKey },
    skip: !isRegenerating,
    fetchPolicy: "network-only",
    pollInterval: 2000,
    notifyOnNetworkStatusChange: true,
  });

  const liveGarden = liveGardenData?.garden ?? null;
  const liveStatus = liveGarden?.status as GardenStatus | undefined;
  const liveProgress =
    typeof liveGarden?.progress === "number"
      ? Math.round(liveGarden.progress)
      : null;

  // Prefer the live garden from polling, fall back to the one from navigation
  const initialGarden = entry.garden ?? null;
  const garden = liveGarden ?? initialGarden;

  // Versioned Cloudinary URL from the *effective* garden
  const imageUrl = garden?.publicId
    ? getOptimizedCloudinaryUrl(garden.publicId, 1200, garden.version ?? null)
    : null;

  const shareUrl = garden?.shareUrl ?? null;
  const baseUrlToShare = shareUrl || imageUrl;

  // Watch status changes while regenerating
  useEffect(() => {
    if (!isRegenerating || !liveStatus) return;

    if (liveStatus !== "READY") {
      hasSeenNonReady.current = true;
    }

    if (liveStatus === "READY" && hasSeenNonReady.current) {
      stopPolling?.();
      setIsRegenerating(false);
      Alert.alert("Garden ready", "Your garden has been regenerated.");
    }

    if (liveStatus === "FAILED") {
      stopPolling?.();
      setIsRegenerating(false);
      Alert.alert(
        "Generation failed",
        "We could not regenerate your garden. Please try again later."
      );
    }
  }, [isRegenerating, liveStatus, stopPolling]);

  async function actuallyRegenerate() {
    if (!garden?.id) {
      Alert.alert(
        "No garden yet",
        "This entry does not have a garden to regenerate."
      );
      return;
    }

    try {
      await regenerateGardenMutation({
        variables: { gardenId: garden.id },
      });

      hasSeenNonReady.current = false;
      setIsRegenerating(true);
    } catch (e: any) {
      console.error("[entry-detail] regenerate error", e);
      Alert.alert(
        "Regeneration failed",
        "There was a problem starting the regeneration."
      );
    }
  }

  function handleRegeneratePress() {
    Alert.alert(
      "Regenerate garden?",
      "This will permanently replace your current garden image with a new one. The original version cannot be restored.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: () => {
            void actuallyRegenerate();
          },
        },
      ]
    );
  }

  // --- share handlers (unchanged) ---

  async function handleShareNative() {
    if (!baseUrlToShare) {
      Alert.alert("Nothing to share", "No shareable URL is available.");
      return;
    }

    try {
      await Share.share({
        message: `My Mood Garden for ${entry.dayKey} 🌱`,
        url: baseUrlToShare,
      });
    } catch (e: any) {
      console.error("[share-native] error", e);
      Alert.alert(
        "Share failed",
        "There was a problem opening the share menu."
      );
    }
  }

  async function handleShareLink() {
    if (!baseUrlToShare) {
      Alert.alert(
        "No link available",
        "This garden does not have a share link."
      );
      return;
    }

    try {
      await Share.share({
        message: baseUrlToShare,
        url: baseUrlToShare,
      });
    } catch (e: any) {
      console.error("[share-link] error", e);
      Alert.alert("Share failed", "There was a problem sharing the link.");
    }
  }

  async function handleOpenImage() {
    if (!imageUrl) {
      Alert.alert(
        "No image available",
        "This entry does not have a garden image yet."
      );
      return;
    }

    try {
      await Linking.openURL(imageUrl);
    } catch (e: any) {
      console.error("[open-image] error", e);
      Alert.alert("Open failed", "Could not open the image URL.");
    }
  }

  async function handleShareFacebook() {
    if (!baseUrlToShare) {
      Alert.alert(
        "No link available",
        "This garden does not have a share link."
      );
      return;
    }

    const encoded = encodeURIComponent(baseUrlToShare);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;

    try {
      await Linking.openURL(fbUrl);
    } catch (e: any) {
      console.error("[share-facebook] error", e);
      Alert.alert(
        "Facebook share failed",
        "Could not open Facebook share dialog."
      );
    }
  }

  // --- full-screen "regenerating" view ---
  if (isRegenerating) {
    return (
      <View style={styles.generatingContainer}>
        <Text style={styles.genTitle}>Regenerating your garden…</Text>
        <Text style={styles.genSubtitle}>
          This might take a little moment. You can leave this screen – your
          updated garden will show up on Today when it’s ready.
        </Text>

        {liveStatus && (
          <Text style={styles.genStatus}>
            Status: <Text style={styles.genStatusBold}>{liveStatus}</Text>
          </Text>
        )}

        {typeof liveProgress === "number" && (
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Growing…</Text>
              <Text style={styles.progressPercent}>{liveProgress}%</Text>
            </View>
            <View style={styles.progressOuter}>
              <View
                style={[styles.progressInner, { width: `${liveProgress}%` }]}
              />
            </View>
          </View>
        )}

        {gardenError && (
          <Text style={styles.errorText}>
            Error checking garden: {gardenError.message}
          </Text>
        )}

        <View style={{ marginTop: 24 }}>
          <Button
            title="Back to Today"
            onPress={() => navigation.navigate("TodayMain")}
          />
        </View>
      </View>
    );
  }

  // --- normal detail view ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Garden image */}
      {imageUrl && (
        <View style={styles.imageWrapper}>
          <Image
            key={imageUrl} // 👈 ensure re-render on URL change
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Metadata */}
      <Text style={styles.dateLabel}>{entry.dayKey}</Text>

      {/* Full diary text */}
      <Text style={styles.text}>{entry.text}</Text>

      {/* Sharing / regeneration menu */}
      <View style={styles.menuSection}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonItem}>
            <Button title="Share" onPress={handleShareNative} />
          </View>

          <View style={styles.buttonItem}>
            <Button title="Facebook" onPress={handleShareFacebook} />
          </View>
        </View>
        {garden && (
          <View style={styles.regenSection}>
            <Button
              title={
                regenLoading || gardenLoading
                  ? "Regenerating…"
                  : "Regenerate garden"
              }
              onPress={handleRegeneratePress}
              disabled={regenLoading || gardenLoading}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#C5D7D3",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dateLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    color: "#222",
    marginBottom: 24,
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  buttonItem: {
    flex: 1,
    marginRight: 6,
  },
  regenSection: {
    marginTop: 16,
  },
  // generating view
  generatingContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#9CB7BE",
    justifyContent: "center",
  },
  genTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  genSubtitle: {
    color: "#f5f5f5",
    marginBottom: 16,
  },
  genStatus: {
    fontSize: 14,
    marginBottom: 6,
    color: "#fff",
  },
  genStatusBold: {
    fontWeight: "600",
  },
  progressBox: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#f0f0f0",
  },
  progressPercent: {
    fontSize: 12,
    color: "#fff",
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
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#c0392b",
  },
});
