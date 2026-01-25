import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import type { CaseStatus } from "@/types/case";

interface StatusBadgeProps {
  status: CaseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return Colors.dark.success;
      case "closed":
        return Colors.dark.textSecondary;
      case "pending":
        return Colors.dark.warning;
      default:
        return Colors.dark.textSecondary;
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

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() + "20" }]}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <ThemedText style={[styles.text, { color: getStatusColor() }]}>
        {getStatusLabel()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
