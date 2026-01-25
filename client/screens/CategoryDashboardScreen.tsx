import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows, GradientColors } from "@/constants/theme";
import { getCategoryStats, CategoryStats, CATEGORIES } from "@/lib/categories";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "CategoryDashboard">["route"];

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - Spacing.screenPadding * 2 - Spacing.md) / 2;

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.7) return Colors.dark.success;
    if (confidence >= 0.4) return Colors.dark.warning;
    return Colors.dark.error;
  };

  const getLabel = () => {
    if (confidence >= 0.7) return "High";
    if (confidence >= 0.4) return "Medium";
    return "Low";
  };

  const getBgColor = () => {
    if (confidence >= 0.7) return "rgba(67, 160, 71, 0.15)";
    if (confidence >= 0.4) return "rgba(255, 167, 38, 0.15)";
    return "rgba(239, 83, 80, 0.15)";
  };

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: getBgColor() }]}>
      <View style={[styles.confidenceDot, { backgroundColor: getColor() }]} />
      <ThemedText style={[styles.confidenceText, { color: getColor() }]}>{getLabel()}</ThemedText>
    </View>
  );
}

function PriorityBadge() {
  return (
    <View style={styles.priorityBadge}>
      <MaterialCommunityIcons name="alert" size={12} color={Colors.dark.text} />
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
  const avgConfidence = categoriesWithObjects.length > 0
    ? categoriesWithObjects.reduce((sum, s) => sum + s.avgConfidence, 0) / categoriesWithObjects.length
    : 0;

  const handleCategoryPress = (stats: CategoryStats) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CategoryDetails", {
      caseId,
      categoryId: stats.category.id,
      categoryName: stats.category.displayName,
    });
  };

  const renderCategoryCard = ({ item, index }: { item: CategoryStats; index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)} layout={Layout.springify()}>
      <Pressable
        onPress={() => handleCategoryPress(item)}
        style={({ pressed }) => [
          styles.card,
          Shadows.md,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.cardAccent, { backgroundColor: item.category.colorCode }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.category.colorCode}20` }]}>
              <MaterialCommunityIcons
                name={item.category.iconName as any}
                size={24}
                color={item.category.colorCode}
              />
            </View>
            {item.category.priority <= 2 ? <PriorityBadge /> : null}
          </View>
          
          <ThemedText style={styles.categoryName}>{item.category.displayName}</ThemedText>
          
          <View style={styles.countRow}>
            <ThemedText style={styles.count}>{item.count}</ThemedText>
            <ThemedText style={styles.countLabel}>objects</ThemedText>
          </View>
          
          {item.count > 0 ? (
            <ConfidenceBadge confidence={item.avgConfidence} />
          ) : (
            <ThemedText style={styles.noObjects}>No detections</ThemedText>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Feather name="chevron-right" size={16} color={Colors.dark.textTertiary} />
        </View>
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
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <ThemedText style={styles.title}>Evidence Categories</ThemedText>
            <ThemedText style={styles.subtitle}>
              AI-detected objects organized by category
            </ThemedText>
            
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, Shadows.md]}>
                <LinearGradient
                  colors={GradientColors.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryGradient}
                >
                  <Feather name="box" size={24} color={Colors.dark.text} />
                  <ThemedText style={styles.summaryValue}>{totalObjects}</ThemedText>
                  <ThemedText style={styles.summaryLabel}>Total Objects</ThemedText>
                </LinearGradient>
              </View>
              
              <View style={[styles.summaryCard, Shadows.md]}>
                <LinearGradient
                  colors={GradientColors.accent as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryGradient}
                >
                  <Feather name="layers" size={24} color={Colors.dark.text} />
                  <ThemedText style={styles.summaryValue}>{categoriesWithObjects.length}</ThemedText>
                  <ThemedText style={styles.summaryLabel}>Active Categories</ThemedText>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>All Categories</ThemedText>
              <View style={styles.sectionBadge}>
                <ThemedText style={styles.sectionCount}>{categoryStats.length}</ThemedText>
              </View>
            </View>
          </Animated.View>
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
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    color: Colors.dark.textSecondary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  summaryGradient: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  sectionBadge: {
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textTertiary,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardAccent: {
    height: 3,
    width: "100%",
  },
  cardContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  count: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: "500",
  },
  noObjects: {
    fontSize: 12,
    color: Colors.dark.textDisabled,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  priorityBadge: {
    backgroundColor: Colors.dark.warning,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  cardFooter: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
  },
});
