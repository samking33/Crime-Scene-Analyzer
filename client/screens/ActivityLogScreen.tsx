import React, { useState, useCallback } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ActivityItem } from "@/components/ActivityItem";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";
import { getProfile } from "@/lib/storage";
import type { ActivityLog } from "@/types/case";

export default function ActivityLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      const profile = await getProfile();
      const data = await AsyncStorage.getItem("@activity_log");
      const allLogs: ActivityLog[] = data ? JSON.parse(data) : [];
      const myLogs = allLogs
        .filter((log) => log.officerName === profile.name)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(myLogs);
    } catch (error) {
      console.error("Failed to load activity log:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  const renderItem = ({ item, index }: { item: ActivityLog; index: number }) => (
    <ActivityItem activity={item} isLast={index === activities.length - 1} />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        image={require("../../assets/images/empty-investigation.png")}
        title="No Activity Yet"
        description="Your actions will be logged here for chain of custody documentation."
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          activities.length === 0 && !isLoading && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyListContent: {
    flex: 1,
  },
});
