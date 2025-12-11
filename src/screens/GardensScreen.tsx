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
import { MGText } from "../components/MGText";
import { CalendarButton } from "../components/button";
import { type Garden } from "./HistoryScreen";

type CalendarDay = {
  dateString: string;
  day: number;
  month: number;
  year: number;
};

type GardensByMonthData = {
  gardensByMonth: Garden[];
};

type GardensByMonthVars = {
  monthKey: string;
};

function setInitialDate() {
  const d = new Date();
  d.setDate(1);
  return d;
}

export function GardensScreen() {
  const [currentMonthDate, setCurrentMonthDate] = useState(setInitialDate);
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth() + 1;
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

 const gallery: SelectedGarden[] = useMemo(
  () =>
    gardens.map((g) => ({
      dayKey: g.periodKey,
      publicId: g.publicId,
      summary: g.summary,
      shareUrl: g.shareUrl ?? null,
      imageUrl: g.imageUrl ?? null,
      hasDiaryEntry: true,
      version: g.version ?? null,   // 👈 add this
    })),
  [gardens]
);


  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const g of gardens) {
      marks[g.periodKey] = {
        selected: true,
        selectedColor:"#C5D7D3"            
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
      <View style={styles.monthSelector}>
        <CalendarButton  title="❮" onPress={() => changeMonth(-1)} />
        <MGText style={styles.monthLabel}>{monthLabel}</MGText>
        <CalendarButton title="❯" onPress={() => changeMonth(1)} />
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
            renderHeader={() => <View />}
            theme={{
                  textSectionTitleColor: "white", // 👈 weekday header color

              dayTextColor: "white",
              calendarBackground: "#B4CDC7",
              dotStyle: { width: 10, height: 10, borderRadius: 5 },
            }}
          />
        )}
      </View>

      {/* Info text */}
      <View style={styles.infoBox}>
        <MGText style={styles.muted}>
          Tap a date with a dot to view that day&apos;s garden and diary entry.
        </MGText>
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
    backgroundColor:"#f2f7f3",
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
    fontFamily: "ZenLoop",
    fontSize: 40,
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
