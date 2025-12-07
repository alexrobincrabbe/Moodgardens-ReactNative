import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { GetGardensByPeriod } from "../graphql/gardens";
import {
  GardenPreviewModal,
  type SelectedGarden,
} from "../components/GardenPreviewModal";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";

type GardenPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR";

type Garden = {
  id: string;
  period: GardenPeriod;
  periodKey: string;
  status: "PENDING" | "READY" | "FAILED";
  imageUrl?: string | null;   // still in the type, but no longer used
  publicId: string;
  summary?: string | null;
  shareUrl?: string | null;
  updatedAt: string;
  archetype?: string | null;
};

type GardensByPeriodData = {
  gardensByPeriod: Garden[];
};

const PERIOD_LABELS: Record<Exclude<GardenPeriod, "DAY">, string> = {
  WEEK: "Weekly",
  MONTH: "Monthly",
  YEAR: "Yearly",
};

const PERIOD_COLORS: Record<Exclude<GardenPeriod, "DAY">, string> = {
  WEEK: "#3b82f6",
  MONTH: "#a855f7",
  YEAR: "#f97316",
};

export function HistoryScreen() {
  // Multi-select filters, all enabled by default
  const [filters, setFilters] = useState<{
    WEEK: boolean;
    MONTH: boolean;
    YEAR: boolean;
  }>({
    WEEK: true,
    MONTH: true,
    YEAR: true,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  // Fetch non-daily gardens in parallel
  const {
    data: weekData,
    loading: weekLoading,
    error: weekError,
  } = useQuery<GardensByPeriodData>(GetGardensByPeriod, {
    variables: { period: "WEEK" as GardenPeriod },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: monthData,
    loading: monthLoading,
    error: monthError,
  } = useQuery<GardensByPeriodData>(GetGardensByPeriod, {
    variables: { period: "MONTH" as GardenPeriod },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: yearData,
    loading: yearLoading,
    error: yearError,
  } = useQuery<GardensByPeriodData>(GetGardensByPeriod, {
    variables: { period: "YEAR" as GardenPeriod },
    fetchPolicy: "cache-and-network",
  });

  const anyLoading = weekLoading || monthLoading || yearLoading;
  const anyError = weekError || monthError || yearError;

  const allNonDailyGardens: Garden[] = useMemo(() => {
    const all: Garden[] = [];
    if (weekData?.gardensByPeriod) all.push(...weekData.gardensByPeriod);
    if (monthData?.gardensByPeriod) all.push(...monthData.gardensByPeriod);
    if (yearData?.gardensByPeriod) all.push(...yearData.gardensByPeriod);

    // newest → oldest
    return all.slice().sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return a.updatedAt > b.updatedAt ? -1 : 1;
      }
      return a.periodKey > b.periodKey ? -1 : 1;
    });
  }, [weekData, monthData, yearData]);

  const filteredGardens = useMemo(
    () =>
      allNonDailyGardens.filter((g) => {
        if (g.period === "DAY") return false;
        if (g.period === "WEEK" && !filters.WEEK) return false;
        if (g.period === "MONTH" && !filters.MONTH) return false;
        if (g.period === "YEAR" && !filters.YEAR) return false;
        return true;
      }),
    [allNonDailyGardens, filters]
  );

  // Map to SelectedGarden for the flipbook modal
  const gallery: SelectedGarden[] = useMemo(
    () =>
      filteredGardens.map((g) => ({
        dayKey: g.periodKey,
        publicId: g.publicId,
        summary: g.summary,
        shareUrl: g.shareUrl ?? null,
        // we deliberately don't set imageUrl; modal uses publicId + Cloudinary
        hasDiaryEntry: false, // weekly/monthly/yearly have only summary
      })),
    [filteredGardens]
  );

  function toggleFilter(key: "WEEK" | "MONTH" | "YEAR") {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function openModalForGarden(targetId: string) {
    const idx = filteredGardens.findIndex((g) => g.id === targetId);
    if (idx === -1) return;
    setModalInitialIndex(idx);
    setModalVisible(true);
  }

  async function handleOpenShareUrl(url: string | null | undefined) {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.error("[history] open share url error:", e);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          Explore your weekly, monthly and yearly Mood Gardens on a single
          timeline. Tap a card to open the flipbook.
        </Text>

        {/* Filter chips */}
        <View style={styles.filtersRow}>
          {(["WEEK", "MONTH", "YEAR"] as const).map((p) => {
            const active = filters[p];
            const color = PERIOD_COLORS[p];
            return (
              <TouchableOpacity
                key={p}
                onPress={() => toggleFilter(p)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: color },
                ]}
              >
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: active ? "#ffffff" : color },
                  ]}
                />
                <Text
                  style={[
                    styles.filterLabel,
                    active && { color: "#ffffff", fontWeight: "600" },
                  ]}
                >
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {(["WEEK", "MONTH", "YEAR"] as const).map((p) => (
            <View key={p} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: PERIOD_COLORS[p] },
                ]}
              />
              <Text style={styles.legendLabel}>{PERIOD_LABELS[p]}</Text>
            </View>
          ))}
        </View>

        {/* Status */}
        {anyLoading && (
          <View style={styles.statusRow}>
            <ActivityIndicator />
            <Text style={styles.statusText}>Loading gardens…</Text>
          </View>
        )}

        {anyError && (
          <Text style={styles.errorText}>
            Could not load gardens. Please try again.
          </Text>
        )}

        {!anyLoading && !anyError && filteredGardens.length === 0 && (
          <Text style={styles.emptyText}>
            No gardens match the current filter. Try enabling more periods or
            keep writing – your overview gardens will appear here 🌱
          </Text>
        )}

        {/* Timeline list */}
        <View style={styles.timelineList}>
          {filteredGardens.map((g) => {
            const isReady = g.status === "READY";
            const periodLabel =
              g.period === "DAY"
                ? "Daily"
                : PERIOD_LABELS[g.period as Exclude<GardenPeriod, "DAY">];
            const color =
              g.period === "DAY"
                ? "#10b981"
                : PERIOD_COLORS[g.period as Exclude<GardenPeriod, "DAY">];

            // Thumbnail URL → use Cloudinary from publicId
            const thumbUrl = getOptimizedCloudinaryUrl(g.publicId, 144);

            return (
              <View key={g.id} style={styles.timelineItem}>
                {/* Timeline indicator */}
                <View style={styles.timelineIndicator}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: color }]}
                  />
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: "#e5e7eb" },
                    ]}
                  />
                </View>

                {/* Card */}
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() =>
                    isReady
                      ? openModalForGarden(g.id)
                      : handleOpenShareUrl(g.shareUrl)
                  }
                >
                  {/* Left: text */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>
                        {periodLabel} garden · {g.periodKey}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { borderColor: color },
                          !isReady && { opacity: 0.7 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color },
                          ]}
                        >
                          {g.status}
                        </Text>
                      </View>
                    </View>

                    {g.archetype && (
                      <Text style={styles.archetypeText}>{g.archetype}</Text>
                    )}

                    {g.summary && (
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={styles.cardSummary}
                      >
                        {g.summary}
                      </Text>
                    )}

                    {!!g.shareUrl && (
                      <TouchableOpacity
                        onPress={() => handleOpenShareUrl(g.shareUrl)}
                      >
                        <Text style={styles.shareLink}>
                          View shared garden
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right: thumbnail */}
                  {thumbUrl && (
                    <Image
                      source={{ uri: thumbUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Flipbook modal */}
      <GardenPreviewModal
        visible={modalVisible}
        gallery={gallery}
        initialIndex={modalInitialIndex}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ecfdf3",
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    color: "#047857",
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: "#4b5563",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#4b5563",
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  timelineIndicator: {
    alignItems: "center",
    width: 18,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginTop: 2,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#064e3b",
  },
  statusPill: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#ecfdf3",
  },
  statusPillText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  archetypeText: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 2,
  },
  cardSummary: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 4,
  },
  shareLink: {
    fontSize: 11,
    color: "#047857",
    textDecorationLine: "underline",
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
});
