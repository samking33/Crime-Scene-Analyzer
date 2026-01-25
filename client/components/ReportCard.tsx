import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing, Fonts } from "@/constants/theme";
import { format } from "date-fns";
import type { Report } from "@/types/case";

interface ReportCardProps {
  report: Report;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReportCard({ report, onPress }: ReportCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.iconContainer}>
        <Feather name="file-text" size={24} color={Colors.dark.accent} />
      </View>
      <View style={styles.content}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {report.caseTitle}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText style={styles.metaText}>
            {format(new Date(report.generatedAt), "MMM d, yyyy 'at' HH:mm")}
          </ThemedText>
          <View style={styles.dot} />
          <ThemedText style={styles.metaText}>
            {report.evidenceCount} items
          </ThemedText>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, report.status === "exported" && styles.exportedBadge]}>
            <Feather
              name={report.status === "exported" ? "check-circle" : "file"}
              size={10}
              color={report.status === "exported" ? Colors.dark.success : Colors.dark.accent}
            />
            <ThemedText
              style={[
                styles.statusText,
                { color: report.status === "exported" ? Colors.dark.success : Colors.dark.accent },
              ]}
            >
              {report.status === "exported" ? "Exported" : "Generated"}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="download" size={20} color={Colors.dark.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.dark.accent + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  exportedBadge: {
    backgroundColor: Colors.dark.success + "20",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
