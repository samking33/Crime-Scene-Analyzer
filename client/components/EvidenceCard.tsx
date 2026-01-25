import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import { format } from "date-fns";
import type { Evidence } from "@/types/case";

interface EvidenceCardProps {
  evidence: Evidence;
  onPress?: () => void;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EvidenceCard({ evidence, onPress, compact = false }: EvidenceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getIcon = () => {
    switch (evidence.type) {
      case "photo":
        return "camera";
      case "audio":
        return "mic";
      case "note":
        return "file-text";
      default:
        return "file";
    }
  };

  const getTypeLabel = () => {
    switch (evidence.type) {
      case "photo":
        return "Photo";
      case "audio":
        return "Audio";
      case "note":
        return "Note";
      default:
        return "Evidence";
    }
  };

  if (compact) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.compactCard, animatedStyle]}
      >
        {evidence.type === "photo" && evidence.uri ? (
          <Image source={{ uri: evidence.uri }} style={styles.compactImage} />
        ) : (
          <View style={styles.compactPlaceholder}>
            <Feather name={getIcon()} size={20} color={Colors.dark.accent} />
          </View>
        )}
        <ThemedText style={styles.compactTime}>
          {format(new Date(evidence.timestamp), "HH:mm")}
        </ThemedText>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.iconContainer}>
        {evidence.type === "photo" && evidence.uri ? (
          <Image source={{ uri: evidence.uri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Feather name={getIcon()} size={24} color={Colors.dark.accent} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.type}>{getTypeLabel()}</ThemedText>
          <ThemedText style={styles.time}>
            {format(new Date(evidence.timestamp), "HH:mm:ss")}
          </ThemedText>
        </View>
        {evidence.content ? (
          <ThemedText style={styles.contentText} numberOfLines={2}>
            {evidence.content}
          </ThemedText>
        ) : null}
        {evidence.latitude && evidence.longitude ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={10} color={Colors.dark.success} />
            <ThemedText style={styles.locationText}>GPS Tagged</ThemedText>
          </View>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  iconPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  type: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  time: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  contentText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  locationText: {
    fontSize: 10,
    color: Colors.dark.success,
  },
  compactCard: {
    width: 70,
    alignItems: "center",
    gap: Spacing.xs,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  compactPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  compactTime: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontVariant: ["tabular-nums"],
  },
});
