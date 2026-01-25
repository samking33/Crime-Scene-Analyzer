import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getCategoryStats, CategoryStats, CATEGORIES } from "@/lib/categories";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "CategoryDashboard">["route"];

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.7) return Colors.dark.success;
    if (confidence >= 0.4) return "#F57C00";
    return Colors.dark.error;
  };

  const getLabel = () => {
    if (confidence >= 0.7) return "High";
    if (confidence >= 0.4) return "Medium";
    return "Low";
  };

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: getColor() }]}>
      <ThemedText style={styles.confidenceText}>{getLabel()}</ThemedText>
    </View>
  );
}

function PriorityBadge() {
  return (
    <View style={styles.priorityBadge}>
      <MaterialCommunityIcons name="alert" size={12} color="#FFF" />
    </View>
  );
}

export default function CategoryDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { caseId } = route.params;

  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const stats = await getCategoryStats(caseId);
      setCategoryStats(stats);
    } catch (error) {
      console.error("Failed to load category stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const totalObjects = categoryStats.reduce((sum, s) => sum + s.count, 0);
  const categoriesWithObjects = categoryStats.filter((s) => s.count > 0);

  const handleCategoryPress = (stats: CategoryStats) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CategoryDetails", {
      caseId,
      categoryId: stats.category.id,
      categoryName: stats.category.displayName,
    });
  };

  const renderCategoryCard = ({ item }: { item: CategoryStats }) => (
    <Animated.View entering={FadeIn} layout={Layout.springify()}>
      <Pressable
        onPress={() => handleCategoryPress(item)}
        style={[styles.card, { borderLeftColor: item.category.colorCode }]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name={item.category.iconName as any}
            size={32}
            color={item.category.colorCode}
          />
          {item.category.priority <= 2 && <PriorityBadge />}
        </View>
        <ThemedText style={styles.categoryName}>{item.category.displayName}</ThemedText>
        <ThemedText style={styles.count}>{item.count}</ThemedText>
        {item.count > 0 ? (
          <ConfidenceBadge confidence={item.avgConfidence} />
        ) : (
          <ThemedText style={styles.noObjects}>No objects</ThemedText>
        )}
      </Pressable>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        data={categoryStats}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.category.id.toString()}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Evidence Categories</ThemedText>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryValue}>{totalObjects}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Total Objects</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryValue}>{categoriesWithObjects.length}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Categories</ThemedText>
              </View>
            </View>
          </View>
        }
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    color: Colors.dark.textSecondary,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: Spacing.sm,
  },
  count: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 4,
  },
  noObjects: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
  },
  priorityBadge: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
});
