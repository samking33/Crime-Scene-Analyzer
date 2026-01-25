import React, { useState, useCallback } from "react";
import { FlatList, View, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { CaseCard } from "@/components/CaseCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Colors, Spacing } from "@/constants/theme";
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

  const renderItem = ({ item }: { item: Case }) => (
    <CaseCard caseData={item} onPress={() => handleCasePress(item)} />
  );

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

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          filteredCases.length === 0 && !isLoading && styles.emptyListContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          cases.length > 0 ? (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Feather name="search" size={18} color={Colors.dark.textSecondary} />
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  separator: {
    height: Spacing.md,
  },
});
