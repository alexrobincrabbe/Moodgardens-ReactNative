// src/screens/EntryDetailScreen.tsx
import React from "react";
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
  Platform,
} from "react-native";

export function EntryDetailScreen({ route }: any) {
  const { entry } = route.params as {
    entry: {
      id: string;
      text: string;
      dayKey: string;
      createdAt: string;
      garden?: {
        id: string;
        status: "PENDING" | "READY" | "FAILED";
        imageUrl?: string | null;
        publicId?: string | null;
        shareUrl?: string | null;
        progress?: number | null;
        periodKey: string;
        updatedAt: string;
      } | null;
    };
  };

  const garden = entry.garden ?? null;
  const imageUrl = garden?.imageUrl ?? null;
  const shareUrl = garden?.shareUrl ?? null;

  const baseUrlToShare = shareUrl || imageUrl;

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
      Alert.alert("Share failed", "There was a problem opening the share menu.");
    }
  }

  async function handleShareLink() {
    if (!baseUrlToShare) {
      Alert.alert("No link available", "This garden does not have a share link.");
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
      Alert.alert("No image available", "This entry does not have a garden image yet.");
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
      Alert.alert("No link available", "This garden does not have a share link.");
      return;
    }

    const encoded = encodeURIComponent(baseUrlToShare);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;

    try {
      await Linking.openURL(fbUrl);
    } catch (e: any) {
      console.error("[share-facebook] error", e);
      Alert.alert("Facebook share failed", "Could not open Facebook share dialog.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Garden image */}
      {imageUrl && (
        <View style={styles.imageWrapper}>
          <Image
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

      {/* Sharing / download menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Share or save</Text>

        <View style={styles.buttonRow}>
          <View style={styles.buttonItem}>
            <Button title="Share" onPress={handleShareNative} />
          </View>

          <View style={styles.buttonItem}>
            <Button title="Share link" onPress={handleShareLink} />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonItem}>
            <Button
              title={Platform.OS === "ios" ? "Open / Save" : "Open / Download"}
              onPress={handleOpenImage}
            />
          </View>

          <View style={styles.buttonItem}>
            <Button title="Facebook" onPress={handleShareFacebook} />
          </View>
        </View>
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
    aspectRatio: 1, // square image
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#eee",
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
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  buttonItem: {
    flex: 1,
    marginRight: 6,
  },
});
