import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import { format } from "date-fns";
import type { ActivityLog } from "@/types/case";

interface ActivityItemProps {
  activity: ActivityLog;
  isLast?: boolean;
}

export function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
  const getIcon = (): keyof typeof Feather.glyphMap => {
    if (activity.action.includes("created")) return "plus-circle";
    if (activity.action.includes("photo")) return "camera";
    if (activity.action.includes("audio")) return "mic";
    if (activity.action.includes("note")) return "file-text";
    if (activity.action.includes("started")) return "play-circle";
    if (activity.action.includes("stopped")) return "stop-circle";
    return "activity";
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={styles.iconContainer}>
          <Feather name={getIcon()} size={14} color={Colors.dark.accent} />
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.content}>
        <ThemedText style={styles.action}>{activity.action}</ThemedText>
        {activity.details ? (
          <ThemedText style={styles.details}>{activity.details}</ThemedText>
        ) : null}
        <View style={styles.meta}>
          <Feather name="user" size={10} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.metaText}>{activity.officerName}</ThemedText>
          <View style={styles.dot} />
          <ThemedText style={styles.metaText}>
            {format(new Date(activity.timestamp), "MMM d, HH:mm:ss")}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  timeline: {
    alignItems: "center",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.dark.border,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.lg,
    gap: 2,
  },
  action: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  details: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.dark.textSecondary,
  },
});
