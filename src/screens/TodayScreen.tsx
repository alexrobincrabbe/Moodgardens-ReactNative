import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Button,
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

type GardenStatus = "PENDING" | "READY" | "FAILED";

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
  garden?: {
    id: string;
    status: GardenStatus;
    imageUrl?: string | null;   // still in type, but no longer used
    publicId?: string | null;   // 👈 important for Cloudinary
    shareUrl?: string | null;
    progress?: number | null;
    periodKey: string;
    updatedAt: string;
  } | null;
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

    // 👇 NEW: build Cloudinary thumbnail from publicId
    const thumbUrl =
      status === "READY" && garden?.publicId
        ? getOptimizedCloudinaryUrl(garden.publicId, 800)
        : null;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Text style={styles.entryDate}>{item.dayKey}</Text>
        <Text style={styles.entryText} numberOfLines={3}>
          {item.text}
        </Text>

        {status === "READY" && thumbUrl && (
          <Image
            source={{ uri: thumbUrl }}
            style={styles.gardenImage}
            resizeMode="cover"
          />
        )}

        {status && (
          <View style={styles.gardenStatusRow}>
            <Text style={styles.gardenStatusLabel}>Garden:</Text>
            <Text style={styles.gardenStatusValue}>{status}</Text>
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
          <Text style={styles.title}>Today</Text>
          <ActivityIndicator />
          <Text style={styles.muted}>Checking today’s entry…</Text>
        </View>
      );
    }

    if (todayMetaError) {
      return (
        <View style={styles.todayCard}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.errorText}>
            Could not load today’s date information.
          </Text>
        </View>
      );
    }

    if (!todayKey) {
      return (
        <View style={styles.todayCard}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.muted}>
            We couldn’t determine today’s diary key. Please try again later.
          </Text>
        </View>
      );
    }

    if (!todayEntry) {
      return (
        <View style={styles.todayCard}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>
            What’s on your mind today, {displayName}?
          </Text>
          <Text style={styles.muted}>
            You haven’t written your entry for today yet.
          </Text>

          <View style={styles.todayButtonWrap}>
            <Button title="Write today’s entry" onPress={onPressNewEntry} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.todayCard}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Nice work, {displayName} 🌱</Text>
        <Text style={styles.muted}>
          You already wrote your entry for today ({todayKey}). Scroll down to
          revisit your past gardens.
        </Text>
      </View>
    );
  };

  if (feedLoading && !entries.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your diary…</Text>
      </View>
    );
  }

  if (feedError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Could not load your diary: {feedError.message}
        </Text>
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
    fontSize: 16,
    marginBottom: 4,
  },
  muted: {
    fontSize: 13,
    color: "#666",
  },
  todayButtonWrap: {
    marginTop: 12,
    alignSelf: "flex-start",
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
    fontSize: 14,
    color: "#222",
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
