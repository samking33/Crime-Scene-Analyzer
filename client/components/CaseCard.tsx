import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, BorderRadius, Spacing, Shadows, AnimationConfig } from "@/constants/theme";
import { formatDistanceToNow } from "date-fns";
import type { Case } from "@/types/case";

interface CaseCardProps {
  caseData: Case;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CaseCard({ caseData, onPress, index = 0 }: CaseCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, AnimationConfig.springFast);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, AnimationConfig.springFast);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getStatusColor = () => {
    switch (caseData.status) {
      case "active":
        return Colors.dark.success;
      case "pending":
        return Colors.dark.warning;
      case "closed":
        return Colors.dark.neutral;
      default:
        return Colors.dark.primary;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(caseData.createdAt), { addSuffix: true });

  return (
    <AnimatedPressable
      entering={FadeIn.duration(400).delay(index * 100)}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, Shadows.lg, animatedStyle]}
      testID={`card-case-${caseData.id}`}
    >
      <View style={[styles.accentBar, { backgroundColor: getStatusColor() }]} />
      
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {caseData.thumbnail ? (
              <Image source={{ uri: caseData.thumbnail }} style={styles.thumbnailImage} contentFit="cover" />
            ) : (
              <Feather name="folder" size={24} color={Colors.dark.primary} />
            )}
          </View>
          
          <View style={styles.headerText}>
            <ThemedText style={styles.caseId} testID={`text-case-id-${caseData.id}`}>
              {caseData.caseId}
            </ThemedText>
            <View style={styles.timeRow}>
              <ThemedText style={styles.timeText}>{timeAgo}</ThemedText>
            </View>
          </View>
          
          <StatusBadge status={caseData.status} size="sm" />
        </View>
        
        <ThemedText style={styles.title} numberOfLines={2} testID={`text-case-title-${caseData.id}`}>
          {caseData.title}
        </ThemedText>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={Colors.dark.textTertiary} />
            <ThemedText style={styles.metaText} numberOfLines={1}>
              {caseData.location}
            </ThemedText>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <Feather name="user" size={12} color={Colors.dark.textTertiary} />
            <ThemedText style={styles.metaText} numberOfLines={1}>
              {caseData.leadOfficer}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Feather name="image" size={12} color={Colors.dark.accent} />
              <ThemedText style={styles.statText}>
                {caseData.evidenceCount} evidence
              </ThemedText>
            </View>
          </View>
          
          <Pressable style={styles.viewButton}>
            <ThemedText style={styles.viewButtonText}>View</ThemedText>
            <Feather name="chevron-right" size={14} color={Colors.dark.primary} />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  accentBar: {
    height: 3,
    width: "100%",
  },
  cardContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(41, 98, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  headerText: {
    flex: 1,
  },
  caseId: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: Colors.dark.accent,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    flex: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textDisabled,
    marginHorizontal: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(0, 176, 255, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(41, 98, 255, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.primary,
  },
});
