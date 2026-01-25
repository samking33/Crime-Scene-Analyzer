import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import type { CaseStatus, ConfidenceLevel } from "@/types/case";

interface StatusBadgeProps {
  status: CaseStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return Colors.dark.success;
      case "closed":
        return Colors.dark.neutral;
      case "pending":
        return Colors.dark.warning;
      default:
        return Colors.dark.neutral;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "active":
        return "Active";
      case "closed":
        return "Closed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const color = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        size === "sm" && styles.badgeSm,
        { backgroundColor: `${color}15` },
      ]}
    >
      <View style={[styles.dot, size === "sm" && styles.dotSm, { backgroundColor: color }]} />
      <ThemedText
        style={[styles.text, size === "sm" && styles.textSm, { color }]}
      >
        {getStatusLabel()}
      </ThemedText>
    </View>
  );
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ confidence, size = "md" }: ConfidenceBadgeProps) {
  const getConfidenceColor = () => {
    switch (confidence) {
      case "high":
        return Colors.dark.success;
      case "medium":
        return Colors.dark.warning;
      case "low":
        return Colors.dark.error;
      default:
        return Colors.dark.neutral;
    }
  };

  const getConfidenceLabel = () => {
    return confidence.charAt(0).toUpperCase() + confidence.slice(1);
  };

  const color = getConfidenceColor();

  return (
    <View
      style={[
        styles.badge,
        size === "sm" && styles.badgeSm,
        { backgroundColor: `${color}15` },
      ]}
    >
      <View style={[styles.dot, size === "sm" && styles.dotSm, { backgroundColor: color }]} />
      <ThemedText
        style={[styles.text, size === "sm" && styles.textSm, { color }]}
      >
        {getConfidenceLabel()}
      </ThemedText>
    </View>
  );
}

interface AnalysisBadgeProps {
  status: "pending" | "analyzing" | "completed" | "failed";
  size?: "sm" | "md";
}

export function AnalysisBadge({ status, size = "md" }: AnalysisBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return Colors.dark.success;
      case "analyzing":
        return Colors.dark.accent;
      case "failed":
        return Colors.dark.error;
      case "pending":
      default:
        return Colors.dark.neutral;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "completed":
        return "Analyzed";
      case "analyzing":
        return "Analyzing";
      case "failed":
        return "Failed";
      case "pending":
      default:
        return "Pending";
    }
  };

  const color = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        size === "sm" && styles.badgeSm,
        { backgroundColor: `${color}15` },
      ]}
    >
      <View style={[styles.dot, size === "sm" && styles.dotSm, { backgroundColor: color }]} />
      <ThemedText
        style={[styles.text, size === "sm" && styles.textSm, { color }]}
      >
        {getStatusLabel()}
      </ThemedText>
    </View>
  );
}

interface CategoryBadgeProps {
  category: string;
  color: string;
  count?: number;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function CategoryBadge({ category, color, count, size = "md", style }: CategoryBadgeProps) {
  const label = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <View
      style={[
        styles.categoryBadge,
        size === "sm" && styles.categoryBadgeSm,
        { backgroundColor: `${color}20`, borderColor: `${color}40` },
        style,
      ]}
    >
      <ThemedText
        style={[styles.categoryText, size === "sm" && styles.categoryTextSm, { color }]}
      >
        {label}
      </ThemedText>
      {count !== undefined ? (
        <View style={[styles.countBadge, { backgroundColor: color }]}>
          <ThemedText style={styles.countText}>{count}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  categoryBadgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextSm: {
    fontSize: 10,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.dark.text,
  },
});
