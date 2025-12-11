import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
  Animated,
  Easing,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { GetDiaryEntry } from "../graphql/diary";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";

export type SelectedGarden = {
  dayKey: string;
  publicId: string;
  summary?: string | null;
  shareUrl?: string | null;
  imageUrl?: string | null;   
  hasDiaryEntry?: boolean;
  version?: number | null;       
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

type Direction = 1 | -1;

export function GardenPreviewModal({
  visible,
  gallery,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>(-1);

  const flipAnim = useRef(new Animated.Value(1)).current;

  // Sync when modal opens on different item
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setPrevIndex(null);
      setIsAnimating(false);
      flipAnim.setValue(1);
      setDirection(-1);
      setImgReady(false);
    }
  }, [initialIndex, visible, flipAnim]);

  const currentGarden = useMemo(() => gallery[index] ?? null, [gallery, index]);
  const prevGarden = useMemo(
    () => (prevIndex != null ? gallery[prevIndex] ?? null : null),
    [gallery, prevIndex]
  );

  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < gallery.length - 1;

  const currentHasDiaryEntry = currentGarden?.hasDiaryEntry ?? true;

  const { data, loading, error } = useQuery<DiaryEntryData>(GetDiaryEntry, {
    variables: { dayKey: currentGarden?.dayKey ?? "" },
    skip: !visible || !currentGarden || !currentHasDiaryEntry,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    setImgReady(false);
  }, [currentGarden?.publicId]);

  const entryText = data?.diaryEntry?.text ?? null;
  const currentShareUrl = currentGarden?.shareUrl ?? null;

  function triggerFlip(dir: Direction, nextIndex: number) {
    setDirection(dir);
    setPrevIndex(index);
    setIsAnimating(true);
    flipAnim.setValue(0);

    // advance index so the new page is the "under" page
    setIndex(nextIndex);

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      setPrevIndex(null);
    });
  }

  const goPrev = useCallback(() => {
    if (!hasPrev || isAnimating) return;
    triggerFlip(-1, index - 1);
  }, [hasPrev, isAnimating, index]);

  const goNext = useCallback(() => {
    if (!hasNext || isAnimating) return;
    triggerFlip(1, index + 1);
  }, [hasNext, isAnimating, index]);

  // swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const VERTICAL_TOLERANCE = 40;

  const handleTouchStart = (e: GestureResponderEvent) => {
    if (isAnimating) return;
    const { locationX, locationY } = e.nativeEvent;
    touchStartX.current = locationX;
    touchStartY.current = locationY;
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (isAnimating) return;
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

  // outgoing + incoming 3D rotations
  const outgoingRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: direction === 1 ? ["0deg", "-90deg"] : ["0deg", "0deg"],
  });

  const incomingRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: direction === 1 ? ["0deg", "0deg"] : ["-90deg", "0deg"],
  });

  const buildPageTransform = (
    angle: Animated.AnimatedInterpolation<string> | string
  ) => {
    if (pageWidth == null) {
      return [{ perspective: 1000 }, { rotateY: angle }];
    }
    return [
      { perspective: 1000 },
      { translateX: -pageWidth / 2 },
      { rotateY: angle },
      { translateX: pageWidth / 2 },
    ];
  };

  if (!currentGarden) return null;

  async function handleShare() {
    if (!currentShareUrl) return;
    try {
      await Share.share({
        message: `My Mood Garden for ${currentGarden.dayKey} 🌱`,
        url: currentShareUrl,
      });
    } catch (e) {
      console.error("[share] error", e);
    }
  }

  async function handleShareLink() {
    if (!currentShareUrl) return;
    try {
      await Share.share({
        message: currentShareUrl,
        url: currentShareUrl,
      });
    } catch (e) {
      console.error("[share-link] error", e);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={styles.backdrop}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (!pageWidth || Math.abs(pageWidth - w) > 1) {
            setPageWidth(w);
          }
        }}
      >
        {pageWidth != null && (
          <View style={styles.pageStack}>
            {/* Incoming (new/current) page */}
            <Animated.View
              style={[
                styles.pageContainer,
                {
                  zIndex: direction === -1 && isAnimating ? 20 : 5,
                  transform: buildPageTransform(
                    isAnimating ? incomingRotateY : "0deg"
                  ),
                },
              ]}
            >
              <GardenModalContent
                selected={currentGarden}
                hasPrev={hasPrev}
                hasNext={hasNext}
                goPrev={goPrev}
                goNext={goNext}
                onClose={onClose}
                imgReady={imgReady}
                setImgReady={setImgReady}
                loading={loading}
                error={error}
                entryText={entryText}
                handleTouchStart={handleTouchStart}
                handleTouchEnd={handleTouchEnd}
                handleShare={handleShare}
                handleShareLink={handleShareLink}
                disableControls={isAnimating}
                pageWidth={pageWidth}
              />
            </Animated.View>

            {/* Outgoing (previous) page */}
            {isAnimating && prevGarden && (
              <Animated.View
                style={[
                  styles.pageContainer,
                  {
                    zIndex: direction === 1 ? 20 : 0,
                    transform: buildPageTransform(outgoingRotateY),
                  },
                ]}
              >
                <GardenModalContent
                  selected={prevGarden}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  goPrev={() => {}}
                  goNext={() => {}}
                  onClose={onClose}
                  imgReady={true}
                  setImgReady={() => {}}
                  loading={false}
                  error={null}
                  entryText={entryText}
                  handleTouchStart={() => {}}
                  handleTouchEnd={() => {}}
                  handleShare={() => {}}
                  handleShareLink={() => {}}
                  disableControls={true}
                  pageWidth={pageWidth}
                />
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

type GardenModalContentProps = {
  selected: SelectedGarden;
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  onClose: () => void;
  imgReady: boolean;
  setImgReady: (v: boolean) => void;
  loading: boolean;
  error: any;
  entryText: string | null;
  handleTouchStart: (e: GestureResponderEvent) => void;
  handleTouchEnd: (e: GestureResponderEvent) => void;
  handleShare: () => void;
  handleShareLink: () => void;
  disableControls: boolean;
  pageWidth: number;
};

function GardenModalContent({
  selected,
  hasPrev,
  hasNext,
  goPrev,
  goNext,
  onClose,
  imgReady,
  setImgReady,
  loading,
  error,
  entryText,
  handleTouchStart,
  handleTouchEnd,
  handleShare,
  handleShareLink,
  disableControls,
  pageWidth,
}: GardenModalContentProps) {
    
  // Build optimized Cloudinary URL from publicId + width
  const optimizedUrl = getOptimizedCloudinaryUrl(selected.publicId, pageWidth, selected.version ?? null);
console.log(
  "[Calendar modal] dayKey:", selected.dayKey,
  "publicId:", selected.publicId,
  "version:", selected.version,
  "url:", optimizedUrl
);

  async function handleOpenImage() {
    try {
      await Linking.openURL(optimizedUrl);
    } catch (e) {
      console.error("[open-image] error", e);
    }
  }

  return (
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
        onPress={disableControls ? undefined : goPrev}
        disabled={!hasPrev || disableControls}
      >
        <Text
          style={[
            styles.arrowText,
            (!hasPrev || disableControls) && { opacity: 0.3 },
          ]}
        >
          ‹
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.arrowButton, styles.arrowRight]}
        onPress={disableControls ? undefined : goNext}
        disabled={!hasNext || disableControls}
      >
        <Text
          style={[
            styles.arrowText,
            (!hasNext || disableControls) && { opacity: 0.3 },
          ]}
        >
          ›
        </Text>
      </TouchableOpacity>

      {/* Content with swipe handling */}
      <View
        style={styles.touchWrapper}
        onTouchStart={disableControls ? undefined : handleTouchStart}
        onTouchEnd={disableControls ? undefined : handleTouchEnd}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          {optimizedUrl ? (
            <>
              <Image
                key={optimizedUrl}
                source={{ uri: optimizedUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoad={() => setImgReady(true)}
              />
              {!imgReady && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator />
                  <Text style={styles.imageLoadingText}>Loading image…</Text>
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

        {/* Diary / summary section */}
        <View style={styles.entrySection}>
          {(() => {
            const hasDiaryEntry = selected.hasDiaryEntry ?? true;
            const sectionTitle = hasDiaryEntry
              ? "Diary entry"
              : "Garden summary";

            let body: React.ReactNode;

            if (!hasDiaryEntry) {
              body = (
                <Text style={styles.entryText}>
                  {selected.summary ?? "No summary text saved for this garden."}
                </Text>
              );
            } else if (loading) {
              body = <Text style={styles.entryMuted}>Loading entry…</Text>;
            } else if (error) {
              body = (
                <Text style={styles.entryError}>
                  Failed to load entry: {error.message}
                </Text>
              );
            } else {
              body = (
                <Text style={styles.entryText}>
                  {entryText ?? "No diary entry saved for this day."}
                </Text>
              );
            }

            return (
              <>
                <Text style={styles.entryTitle}>{sectionTitle}</Text>
                <ScrollView style={styles.entryScroll}>{body}</ScrollView>
              </>
            );
          })()}
        </View>
      </View>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtonsLeft}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={disableControls ? undefined : handleShare}
          >
            <Text style={styles.footerButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={disableControls ? undefined : handleShareLink}
          >
            <Text style={styles.footerButtonText}>Share link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={disableControls ? undefined : handleOpenImage}
          >
            <Text style={styles.footerButtonText}>
              {Platform.OS === "ios" ? "Open / Save" : "Open / Download"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footerButton} onPress={onClose}>
          <Text style={styles.footerButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  pageStack: {
    width: "100%",
    height: "90%",
    maxHeight: "95%",
    position: "relative",
  },
  pageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 50,
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
  touchWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    height: 50,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    zIndex: 20,
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
