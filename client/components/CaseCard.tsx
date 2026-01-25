import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, BorderRadius, Spacing, AnimationConfig } from "@/constants/theme";
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
    scale.value = withSpring(0.98, AnimationConfig.springFast);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, AnimationConfig.springFast);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeIn.duration(300).delay(index * 80)}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
      testID={`card-case-${caseData.id}`}
    >
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <Feather name="file-text" size={18} color={Colors.dark.primary} />
          <ThemedText style={styles.caseId}>{caseData.caseId}</ThemedText>
        </View>
        <StatusBadge status={caseData.status} size="sm" />
      </View>

      <ThemedText style={styles.title} numberOfLines={2}>
        {caseData.title}
      </ThemedText>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={13} color={Colors.dark.textTertiary} />
          <ThemedText style={styles.metaText} numberOfLines={1}>
            {caseData.location}
          </ThemedText>
        </View>
        <View style={styles.metaRow}>
          <Feather name="calendar" size={13} color={Colors.dark.textTertiary} />
          <ThemedText style={styles.metaText}>
            {format(new Date(caseData.createdAt), "MMM d, yyyy")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statsRow}>
          {caseData.evidenceCount !== undefined && caseData.evidenceCount > 0 ? (
            <View style={styles.statBadge}>
              <Feather name="image" size={12} color={Colors.dark.primary} />
              <ThemedText style={styles.statText}>
                {caseData.evidenceCount} evidence
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.arrow}>
          <Feather name="chevron-right" size={18} color={Colors.dark.textTertiary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  caseId: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.dark.text,
    lineHeight: 22,
  },
  metaContainer: {
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    flex: 1,
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
    backgroundColor: "rgba(47, 164, 185, 0.12)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.primary,
  },
  arrow: {
    opacity: 0.7,
  },
});
