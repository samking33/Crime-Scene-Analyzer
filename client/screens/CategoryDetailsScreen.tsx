import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, StyleProp, ViewStyle, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getObjectsByCategory, getCategoryById, CategorizedObject, Category } from "@/lib/categories";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "CategoryDetails">["route"];

type SortOption = "newest" | "oldest" | "confidence";
type FilterOption = "all" | "high" | "medium" | "low";

function ConfidenceDot({ confidence }: { confidence: string }) {
  const getColor = () => {
    switch (confidence) {
      case "high": return Colors.dark.success;
      case "medium": return "#F57C00";
      case "low": return Colors.dark.error;
      default: return Colors.dark.textSecondary;
    }
  };

  return <View style={[styles.confidenceDot, { backgroundColor: getColor() }]} />;
}

function ObjectCard({ 
  object, 
  categoryColor, 
  onImagePress 
}: { 
  object: CategorizedObject; 
  categoryColor: string;
  onImagePress: (uri: string, evidenceId: string) => void;
}) {
  const cardStyle = StyleSheet.flatten([styles.objectCard, { borderLeftColor: categoryColor }]) as ViewStyle;
  
  return (
    <Card style={cardStyle}>
      <View style={styles.objectCardContent}>
        {object.evidenceUri ? (
          <Pressable 
            onPress={() => onImagePress(object.evidenceUri!, object.evidenceId)}
            style={styles.thumbnailContainer}
          >
            <Image
              source={{ uri: object.evidenceUri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
            <View style={styles.thumbnailOverlay}>
              <Feather name="maximize-2" size={16} color="#fff" />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: categoryColor + "30" }]}>
            <Feather name="image" size={24} color={categoryColor} />
          </View>
        )}
        
        <View style={styles.objectInfo}>
          <View style={styles.objectHeader}>
            <ThemedText style={styles.objectName} numberOfLines={1}>{object.objectName}</ThemedText>
            <ConfidenceDot confidence={object.confidence} />
          </View>
          <View style={styles.objectMeta}>
            <Feather name="map-pin" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.objectLocation} numberOfLines={1}>{object.location}</ThemedText>
          </View>
          <View style={styles.objectMeta}>
            <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.objectTime}>
              {format(new Date(object.detectedAt), "MMM d, HH:mm")}
            </ThemedText>
          </View>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(object.confidence) + "20" }]}>
              <ThemedText style={[styles.confidenceValue, { color: getConfidenceColor(object.confidence) }]}>
                {object.confidence.charAt(0).toUpperCase() + object.confidence.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case "high": return Colors.dark.success;
    case "medium": return "#F57C00";
    case "low": return Colors.dark.error;
    default: return Colors.dark.textSecondary;
  }
}

export default function CategoryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { caseId, categoryId } = route.params;

  const [objects, setObjects] = useState<CategorizedObject[]>([]);
  const [category, setCategory] = useState<Category | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const loadData = useCallback(async () => {
    try {
      const cat = getCategoryById(categoryId);
      setCategory(cat);
      const objs = await getObjectsByCategory(caseId, categoryId);
      setObjects(objs);
    } catch (error) {
      console.error("Failed to load category objects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, categoryId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredAndSortedObjects = React.useMemo(() => {
    let result = [...objects];

    if (filterBy !== "all") {
      result = result.filter((obj) => obj.confidence === filterBy);
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.detectedAt - a.detectedAt);
        break;
      case "oldest":
        result.sort((a, b) => a.detectedAt - b.detectedAt);
        break;
      case "confidence":
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        result.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]);
        break;
    }

    return result;
  }, [objects, sortBy, filterBy]);

  const handleSortChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const options: SortOption[] = ["newest", "oldest", "confidence"];
    const currentIndex = options.indexOf(sortBy);
    setSortBy(options[(currentIndex + 1) % options.length]);
  };

  const handleFilterChange = (filter: FilterOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterBy(filter);
  };

  const handleImagePress = useCallback((evidenceUri: string, evidenceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("EvidenceViewer", { evidenceId, caseId });
  }, [navigation, caseId]);

  if (isLoading || !category) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  const confidenceCounts = {
    all: objects.length,
    high: objects.filter((o) => o.confidence === "high").length,
    medium: objects.filter((o) => o.confidence === "medium").length,
    low: objects.filter((o) => o.confidence === "low").length,
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        data={filteredAndSortedObjects}
        renderItem={({ item }) => (
          <ObjectCard 
            object={item} 
            categoryColor={category.colorCode} 
            onImagePress={handleImagePress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: category.colorCode + "20" }]}>
                <MaterialCommunityIcons
                  name={category.iconName as any}
                  size={48}
                  color={category.colorCode}
                />
              </View>
              <ThemedText style={styles.title}>{category.displayName}</ThemedText>
              <ThemedText style={styles.subtitle}>
                {objects.length} object{objects.length !== 1 ? "s" : ""} detected
              </ThemedText>
              <ThemedText style={styles.description}>{category.description}</ThemedText>
            </View>

            <View style={styles.filterBar}>
              {(["all", "high", "medium", "low"] as FilterOption[]).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => handleFilterChange(filter)}
                  style={[
                    styles.filterButton,
                    filterBy === filter && styles.filterButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      filterBy === filter && styles.filterTextActive,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)} ({confidenceCounts[filter]})
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleSortChange} style={styles.sortButton}>
              <Feather name="bar-chart-2" size={16} color={Colors.dark.accent} />
              <ThemedText style={styles.sortText}>
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </ThemedText>
            </Pressable>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={category.iconName as any}
              size={64}
              color={Colors.dark.textSecondary}
            />
            <ThemedText style={styles.emptyText}>
              No {category.displayName.toLowerCase()} detected
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark.buttonText,
    fontWeight: "600",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  sortText: {
    fontSize: 13,
    color: Colors.dark.accent,
  },
  objectCard: {
    borderLeftWidth: 3,
    padding: Spacing.sm,
  },
  objectCardContent: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  thumbnailContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  objectInfo: {
    flex: 1,
    justifyContent: "center",
  },
  objectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  objectName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  objectMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  objectLocation: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  objectTime: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  confidenceLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  confidenceValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
