import React, { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@apollo/client/react";
import { Calendar } from "react-native-calendars";

import { GardensByMonth } from "../graphql/gardens";
import {
  GardenPreviewModal,
  SelectedGarden,
} from "../components/GardenPreviewModal";

type CalendarDay = {
  dateString: string;
  day: number;
  month: number;
  year: number;
};

type GardensByMonthData = {
  gardensByMonth: {
    id: string;
    period: string;
    periodKey: string; // e.g. "2025-11-03"
    status: "PENDING" | "READY" | "FAILED";
    imageUrl?: string | null;
    publicId: string;
    summary?: string | null;
    progress?: number | null;
    shareUrl?: string | null;
    updatedAt: string;
  }[];
};

type GardensByMonthVars = {
  monthKey: string; // e.g. "2025-11"
};

export function GardensScreen() {
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth() + 1; // 1–12

  const monthKey = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const { data, loading, error, refetch } = useQuery<
    GardensByMonthData,
    GardensByMonthVars
  >(GardensByMonth, {
    variables: { monthKey },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    refetch({ monthKey });
  }, [monthKey, refetch]);

  const gardens = data?.gardensByMonth ?? [];

  // Build gallery for modal
  const gallery: SelectedGarden[] = useMemo(
    () =>
      gardens.map((g) => ({
        dayKey: g.periodKey,
        publicId: g.publicId,
        summary: g.summary,
        shareUrl: g.shareUrl ?? null,
        imageUrl: g.imageUrl ?? null,
        hasDiaryEntry: true, 
      })),
    [gardens]
  );

  // For calendar markers: days that have a garden
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const g of gardens) {
      marks[g.periodKey] = {
        marked: true,
        dotColor: "#2ecc71",
      };
    }
    return marks;
  }, [gardens]);

  function changeMonth(delta: number) {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  function onDayPress(day: CalendarDay) {
    const dayKey = day.dateString; // e.g. "2025-11-03"
    const idx = gallery.findIndex((g) => g.dayKey === dayKey);
    if (idx === -1) {
      // no garden for this day, do nothing or show message
      return;
    }
    setModalIndex(idx);
    setModalVisible(true);
  }

  const monthLabel = currentMonthDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gardens</Text>

      {/* Month/year selector */}
      <View style={styles.monthSelector}>
        <Button title="‹" onPress={() => changeMonth(-1)} />
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Button title="›" onPress={() => changeMonth(1)} />
      </View>

      {/* Calendar */}
      <View style={styles.calendarWrapper}>
        {loading && !data ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading gardens…</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingBox}>
            <Text style={styles.error}>
              Failed to load gardens: {error.message}
            </Text>
            <View style={{ marginTop: 8 }}>
              <Button title="Retry" onPress={() => refetch()} />
            </View>
          </View>
        ) : (
          <Calendar
            key={monthKey}
            current={`${year}-${String(month).padStart(2, "0")}-01`}
            markedDates={markedDates}
            onDayPress={onDayPress}
            hideExtraDays
            disableMonthChange={true}
            hideArrows={true}
            renderHeader={() => <View />} // 👈 hide built-in month label completely
            theme={{
              dotColor: "#2ecc71",
              selectedDotColor: "#2ecc71",
            }}
          />
        )}
      </View>

      {/* Info text */}
      <View style={styles.infoBox}>
        <Text style={styles.muted}>
          Tap a date with a dot to view that day&apos;s garden and diary entry.
        </Text>
      </View>

      {/* Preview modal */}
      <GardenPreviewModal
        visible={modalVisible}
        gallery={gallery}
        initialIndex={modalIndex}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  calendarWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
    textAlign: "center",
  },
  infoBox: {
    marginTop: 10,
  },
});
