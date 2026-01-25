import React, { useState, useCallback } from "react";
import { FlatList, View, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { CaseCard } from "@/components/CaseCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { StatCard } from "@/components/Card";
import { CaseCardSkeleton } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, GradientColors, Shadows } from "@/constants/theme";
import { getCases } from "@/lib/storage";
import type { Case } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CasesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const data = await getCases();
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [loadCases])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCases();
    setIsRefreshing(false);
  };

  const handleNewCase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("NewCase");
  };

  const handleCasePress = (caseData: Case) => {
    navigation.navigate("CaseDetail", { caseId: caseData.id });
  };

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCases = cases.filter((c) => c.status === "active").length;
  const closedCases = cases.filter((c) => c.status === "closed").length;
  const totalEvidence = cases.reduce((acc, c) => acc + (c.evidenceCount || 0), 0);

  const renderItem = ({ item, index }: { item: Case; index: number }) => (
    <CaseCard caseData={item} onPress={() => handleCasePress(item)} index={index} />
  );

  const renderHeader = () => {
    if (cases.length === 0) return null;
    
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.headerContent}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Feather name="folder" size={20} color={Colors.dark.primary} />}
            value={activeCases}
            label="Active"
          />
          <StatCard
            icon={<Feather name="check-circle" size={20} color={Colors.dark.success} />}
            value={closedCases}
            label="Closed"
          />
          <StatCard
            icon={<Feather name="image" size={20} color={Colors.dark.accent} />}
            value={totalEvidence}
            label="Evidence"
          />
          <StatCard
            icon={<Feather name="database" size={20} color={Colors.dark.warning} />}
            value={cases.length}
            label="Total"
          />
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={Colors.dark.textTertiary} />
          <Input
            style={styles.searchInput}
            placeholder="Search cases..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="input-search"
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Cases</ThemedText>
          <ThemedText style={styles.sectionCount}>{filteredCases.length}</ThemedText>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        image={require("../../assets/images/empty-cases.png")}
        title="No Cases Yet"
        description="Start your first investigation by creating a new case."
        actionLabel="Create New Case"
        onAction={handleNewCase}
      />
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <CaseCardSkeleton />
      <CaseCardSkeleton />
      <CaseCardSkeleton />
    </View>
  );

  const renderFAB = () => (
    <Pressable
      onPress={handleNewCase}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
    >
      <LinearGradient
        colors={GradientColors.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <Feather name="plus" size={24} color={Colors.dark.text} />
      </LinearGradient>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
        <View style={[styles.listContent, { paddingTop: headerHeight + Spacing.xl }]}>
          {renderLoading()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing["4xl"],
          },
          filteredCases.length === 0 && !isLoading && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary, Colors.dark.accent]}
          />
        }
      />
      {cases.length > 0 ? renderFAB() : null}
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
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyListContent: {
    flex: 1,
  },
  loadingContainer: {
    gap: Spacing.md,
  },
  headerContent: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textTertiary,
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  separator: {
    height: Spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.xl,
    borderRadius: 28,
    overflow: "hidden",
    ...Shadows.primaryGlow,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
