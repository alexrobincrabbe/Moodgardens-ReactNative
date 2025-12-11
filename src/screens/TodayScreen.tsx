import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { CURRENT_USER_QUERY } from "../graphql/auth";
import {
  TodayMetaQuery,
  GetDiaryEntry,
  PaginatedDiaryEntries,
} from "../graphql/diary";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary"; // 👈 NEW
import { MGText } from "../components/MGText";
import { MGButton } from "../components/button";
import {type Garden} from "./HistoryScreen"

interface CurrentUserData {
  user: {
    id: string;
    email: string;
    displayName: string;
  } | null;
}

interface TodayMetaData {
  currentDiaryDayKey: string | null;
}

interface DiaryEntry {
  id: string;
  text: string;
  dayKey: string;
  createdAt: string;
  garden?: Garden;
}

interface TodayEntryData {
  diaryEntry: DiaryEntry | null;
}

interface PaginatedEntriesData {
  paginatedDiaryEntries: DiaryEntry[];
}

const PAGE_SIZE = 10;

export function TodayScreen() {
  const navigation: any = useNavigation();

  const { data: userData } = useQuery<CurrentUserData>(CURRENT_USER_QUERY);
  const displayName = userData?.user?.displayName ?? "friend";

  const {
    data: todayMetaData,
    loading: todayMetaLoading,
    error: todayMetaError,
    refetch: refetchTodayMeta,
  } = useQuery<TodayMetaData>(TodayMetaQuery, {
    fetchPolicy: "cache-and-network",
  });

  const todayKey = todayMetaData?.currentDiaryDayKey ?? null;

  const {
    data: todayEntryData,
    loading: todayEntryLoading,
    refetch: refetchTodayEntry,
  } = useQuery<TodayEntryData>(GetDiaryEntry, {
    variables: { dayKey: todayKey as string },
    skip: !todayKey,
    fetchPolicy: "network-only",
  });

  const todayEntry = todayEntryData?.diaryEntry ?? null;

  const {
    data: feedData,
    loading: feedLoading,
    error: feedError,
    fetchMore,
    networkStatus,
    refetch: refetchFeed,
  } = useQuery<PaginatedEntriesData>(PaginatedDiaryEntries, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const entries = feedData?.paginatedDiaryEntries ?? [];
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const handleLoadMore = useCallback(() => {
    if (loadingMore || feedLoading) return;
    if (!entries.length) return;

    fetchMore({
      variables: {
        offset: entries.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult || !fetchMoreResult.paginatedDiaryEntries.length) {
          return prev;
        }
        return {
          ...prev,
          paginatedDiaryEntries: [
            ...prev.paginatedDiaryEntries,
            ...fetchMoreResult.paginatedDiaryEntries,
          ],
        };
      },
    });
  }, [loadingMore, feedLoading, entries.length, fetchMore]);

  const onPressNewEntry = () => {
    navigation.navigate("NewEntry");
  };

  useFocusEffect(
    useCallback(() => {
      refetchTodayMeta();
      refetchTodayEntry();
      refetchFeed();
    }, [refetchTodayMeta, refetchTodayEntry, refetchFeed])
  );

  const renderEntryItem = ({ item }: { item: DiaryEntry }) => {
    const garden = item.garden;
    const status = garden?.status;
    const progress =
      typeof garden?.progress === "number"
        ? Math.round(garden.progress as number)
        : null;

    const onPress = () => {
      navigation.navigate("EntryDetail", { entry: item });
    };

    const thumbUrl =
  status === "READY" && garden?.publicId
    ? getOptimizedCloudinaryUrl(
        garden.publicId,
        800,
        garden.version ?? undefined
      )
    : null;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <MGText style={styles.entryDate}>{item.dayKey}</MGText>
        <MGText style={styles.entryText} numberOfLines={3}>
          {item.text}
        </MGText>

        {status === "READY" && thumbUrl && (
          <Image
              key={thumbUrl}    
            source={{ uri: thumbUrl }}
            style={styles.gardenImage}
            resizeMode="cover"
          />
        )}

        {status && (
          <View style={styles.gardenStatusRow}>
            <MGText style={styles.gardenStatusLabel}>Garden:</MGText>
            <MGText style={styles.gardenStatusValue}>{status}</MGText>
          </View>
        )}

        {status !== "READY" &&
          status !== "FAILED" &&
          typeof progress === "number" && (
            <View style={styles.progressBarOuter}>
              <View
                style={[styles.progressBarInner, { width: `${progress}%` }]}
              />
            </View>
          )}
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => {
    if (todayMetaLoading || todayEntryLoading) {
      return (
        <View style={styles.todayCard}>
          <ActivityIndicator />
          <Text style={styles.muted}>Checking today’s entry…</Text>
        </View>
      );
    }

    if (todayMetaError) {
      return (
        <View style={styles.todayCard}>
          <MGText style={styles.errorText}>
            Could not load today’s date information.
          </MGText>
        </View>
      );
    }

    if (!todayKey) {
      return (
        <View style={styles.todayCard}>
          <MGText style={styles.muted}>
            We couldn’t determine today’s diary key. Please try again later.
          </MGText>
        </View>
      );
    }

    if (!todayEntry) {
      return (
        <View style={styles.todayCard}>
          <MGText style={styles.subtitle}>
            What’s on your mind today, {displayName}?
          </MGText>
          <MGText style={styles.muted}>
            You haven’t written your entry for today yet.
          </MGText>

          <View style={styles.todayButtonWrap}>
            <MGButton title="Write today’s entry" onPress={onPressNewEntry} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.todayCard}>
        <MGText style={styles.subtitle}>Nice work, {displayName}</MGText>
        <MGText style={styles.muted}>
          You already wrote your entry for today ({todayKey}). Scroll down to
          revisit your past gardens.
        </MGText>
      </View>
    );
  };

  if (feedLoading && !entries.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <MGText style={styles.muted}>Loading your diary…</MGText>
      </View>
    );
  }

  if (feedError) {
    return (
      <View style={styles.center}>
        <MGText style={styles.errorText}>
          Could not load your diary: {feedError.message}
        </MGText>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={renderEntryItem}
      ListHeaderComponent={renderListHeader}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator />
          </View>
        ) : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={networkStatus === NetworkStatus.refetch}
          onRefresh={() => {
            refetchTodayMeta();
            refetchTodayEntry();
            refetchFeed();
          }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  gardenImage: {
    width: "100%",
    aspectRatio: 1, // keep square
    borderRadius: 8,
    marginTop: 8,
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  todayCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f2f7f3",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  muted: {
    fontSize: 13,
    color: "#666",
  },
  todayButtonWrap: {
    alignItems:"center",
    justifyContent:"center",
    marginTop: 12,
  },
  entryCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  entryDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  entryText: {
    fontFamily: "OoohBaby",
    fontSize: 20,
    marginBottom: 8,
  },
  gardenStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  gardenStatusLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  gardenStatusValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: "#2ecc71",
  },
  errorText: {
    fontSize: 14,
    color: "#c0392b",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
