import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
  GestureResponderEvent,
  Platform,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { GetDiaryEntry } from "../graphql/diary";

export type SelectedGarden = {
  dayKey: string;
  publicId: string;
  summary?: string | null;
  shareUrl?: string | null;
  imageUrl?: string | null;
};

type DiaryEntryData = {
  diaryEntry: {
    id: string;
    dayKey: string;
    text: string;
    createdAt: string;
  } | null;
};

type Props = {
  visible: boolean;
  gallery: SelectedGarden[];
  initialIndex: number;
  onClose: () => void;
};

export function GardenPreviewModal({
  visible,
  gallery,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, visible]);

  const selected = useMemo(() => gallery[index] ?? null, [gallery, index]);

  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < gallery.length - 1;

  const { data, loading, error, refetch } = useQuery<DiaryEntryData>(
  GetDiaryEntry,
  {
    variables: { dayKey: selected?.dayKey ?? "" },
    skip: !visible || !selected,   // 👈 only query when modal is open + we have a garden
    fetchPolicy: "network-only",
  }
);


  useEffect(() => {
    setImgReady(false);
  }, [selected?.publicId]);

  const entryText = data?.diaryEntry?.text ?? null;

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    setIndex((i) => i - 1);
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setIndex((i) => i + 1);
  }, [hasNext]);

  // Simple swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const VERTICAL_TOLERANCE = 40;

  const handleTouchStart = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    touchStartX.current = locationX;
    touchStartY.current = locationY;
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;

    const { locationX, locationY } = e.nativeEvent;
    const deltaX = locationX - touchStartX.current;
    const deltaY = locationY - touchStartY.current;

    if (Math.abs(deltaY) > VERTICAL_TOLERANCE) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0 && hasNext) goNext();
      else if (deltaX > 0 && hasPrev) goPrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!selected) return null;

  const imageUrl = selected.imageUrl;
  const shareUrl = selected.shareUrl ?? imageUrl;

  async function handleShare() {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: `My Mood Garden for ${selected.dayKey} 🌱`,
        url: shareUrl,
      });
    } catch (e) {
      console.error("[share] error", e);
    }
  }

  async function handleShareLink() {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: shareUrl,
        url: shareUrl,
      });
    } catch (e) {
      console.error("[share-link] error", e);
    }
  }

  async function handleOpenImage() {
    if (!imageUrl) return;
    try {
      await Linking.openURL(imageUrl);
    } catch (e) {
      console.error("[open-image] error", e);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                Mood Garden — {selected.dayKey}
              </Text>
              {!!selected.summary && (
                <Text
                  style={styles.headerSummary}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selected.summary}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Left / right arrows */}
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={goPrev}
            disabled={!hasPrev}
          >
            <Text
              style={[
                styles.arrowText,
                !hasPrev && { opacity: 0.3 },
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowRight]}
            onPress={goNext}
            disabled={!hasNext}
          >
            <Text
              style={[
                styles.arrowText,
                !hasNext && { opacity: 0.3 },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          {/* Content with swipe handling */}
          <View
            style={styles.content}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Image */}
            <View style={styles.imageWrapper}>
              {imageUrl ? (
                <>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoad={() => setImgReady(true)}
                  />
                  {!imgReady && (
                    <View style={styles.imageOverlay}>
                      <ActivityIndicator />
                      <Text style={styles.imageLoadingText}>
                        Loading image…
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>
                    No image available for this day.
                  </Text>
                </View>
              )}
            </View>

            {/* Diary entry */}
            <View style={styles.entrySection}>
  <Text style={styles.entryTitle}>Diary entry</Text>
  <ScrollView style={styles.entryScroll}>
    {loading && (
      <Text style={styles.entryMuted}>Loading entry…</Text>
    )}
    {error && (
      <Text style={styles.entryError}>
        Failed to load entry: {error.message}
      </Text>
    )}
    {!loading && !error && (
      <Text style={styles.entryText}>
        {entryText ?? "No diary entry saved for this day."}
      </Text>
    )}
  </ScrollView>
</View>

          </View>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <View style={styles.footerButtonsLeft}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleShare}
              >
                <Text style={styles.footerButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleShareLink}
              >
                <Text style={styles.footerButtonText}>Share link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleOpenImage}
              >
                <Text style={styles.footerButtonText}>
                  {Platform.OS === "ios"
                    ? "Open / Save"
                    : "Open / Download"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.footerButton}
              onPress={onClose}
            >
              <Text style={styles.footerButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "95%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSummary: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 18,
    color: "#666",
  },
  content: {
    flexDirection: "column",
    padding: 12,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  imageLoadingText: {
    marginTop: 6,
    fontSize: 12,
    color: "#444",
  },
  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  noImageText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  entrySection: {
    flex: 1,
    marginTop: 4,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryScroll: {
    maxHeight: 180,
  },
  entryText: {
    fontSize: 13,
    color: "#222",
  },
  entryMuted: {
    fontSize: 13,
    color: "#777",
  },
  entryError: {
    fontSize: 13,
    color: "#c0392b",
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerButtonsLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  footerButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    marginRight: 6,
    marginBottom: 4,
  },
  footerButtonText: {
    fontSize: 12,
    color: "#333",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
  arrowText: {
    fontSize: 24,
    color: "#333",
  },
});
