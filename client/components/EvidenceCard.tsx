import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import { format } from "date-fns";
import type { Evidence } from "@/types/case";

interface EvidenceCardProps {
  evidence: Evidence;
  compact?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EvidenceCard({ evidence, compact = false, onPress }: EvidenceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const getIcon = (): keyof typeof Feather.glyphMap => {
    switch (evidence.type) {
      case "photo":
        return "image";
      case "video":
        return "video";
      case "audio":
        return "mic";
      case "note":
        return "file-text";
      default:
        return "file";
    }
  };

  const getTypeColor = () => {
    switch (evidence.type) {
      case "photo":
        return Colors.dark.accent;
      case "video":
        return Colors.dark.error;
      case "audio":
        return Colors.dark.success;
      case "note":
        return Colors.dark.primary;
      default:
        return Colors.dark.textSecondary;
    }
  };

  if (compact) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.compactCard, animatedStyle]}
        testID={`evidence-compact-${evidence.id}`}
      >
        {evidence.uri && (evidence.type === "photo" || evidence.type === "video") ? (
          <View style={styles.compactImageContainer}>
            <Image source={{ uri: evidence.uri }} style={styles.compactImage} contentFit="cover" />
            {evidence.type === "video" ? (
              <View style={styles.videoOverlay}>
                <Feather name="play-circle" size={24} color={Colors.dark.text} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.compactPlaceholder, { backgroundColor: getTypeColor() + "20" }]}>
            <Feather name={getIcon()} size={24} color={getTypeColor()} />
          </View>
        )}
        <View style={styles.compactInfo}>
          <View style={styles.typeRow}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor() + "20" }]}>
              <Feather name={getIcon()} size={10} color={getTypeColor()} />
              <ThemedText style={[styles.typeText, { color: getTypeColor() }]}>
                {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.compactTime}>
            {format(new Date(evidence.timestamp), "HH:mm")}
          </ThemedText>
        </View>
        {evidence.aiAnalysis ? (
          <View style={styles.aiIndicator}>
            <Feather name="cpu" size={10} color={Colors.dark.accent} />
          </View>
        ) : null}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
      testID={`evidence-${evidence.id}`}
    >
      <View style={styles.iconContainer}>
        {evidence.uri && (evidence.type === "photo" || evidence.type === "video") ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: evidence.uri }} style={styles.thumbnail} contentFit="cover" />
            {evidence.type === "video" ? (
              <View style={styles.videoOverlay}>
                <Feather name="play-circle" size={20} color={Colors.dark.text} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: getTypeColor() + "20" }]}>
            <Feather name={getIcon()} size={24} color={getTypeColor()} />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor() + "20" }]}>
            <Feather name={getIcon()} size={10} color={getTypeColor()} />
            <ThemedText style={[styles.typeText, { color: getTypeColor() }]}>
              {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
            </ThemedText>
          </View>
          <ThemedText style={styles.time}>
            {format(new Date(evidence.timestamp), "MMM d, HH:mm")}
          </ThemedText>
        </View>
        
        {evidence.type === "note" && evidence.content ? (
          <ThemedText style={styles.notePreview} numberOfLines={2}>
            {evidence.content}
          </ThemedText>
        ) : null}
        
        {evidence.aiAnalysis ? (
          <View style={styles.aiAnalysisRow}>
            <Feather name="cpu" size={12} color={Colors.dark.accent} />
            <ThemedText style={styles.aiAnalysisText} numberOfLines={1}>
              {evidence.aiAnalysis}
            </ThemedText>
          </View>
        ) : null}
        
        <View style={styles.footer}>
          {evidence.latitude && evidence.longitude ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={Colors.dark.success} />
              <ThemedText style={styles.locationText}>GPS Tagged</ThemedText>
            </View>
          ) : (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.locationTextMuted}>No GPS</ThemedText>
            </View>
          )}
          
          {evidence.duration ? (
            <ThemedText style={styles.duration}>
              {Math.floor(evidence.duration / 60)}:{(evidence.duration % 60).toString().padStart(2, "0")}
            </ThemedText>
          ) : null}
        </View>
      </View>
      
      <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
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
    width: 56,
    height: 56,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  time: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  notePreview: {
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 18,
  },
  aiAnalysisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  aiAnalysisText: {
    fontSize: 12,
    color: Colors.dark.accent,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: Colors.dark.success,
    fontWeight: "500",
  },
  locationTextMuted: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  duration: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  compactCard: {
    width: 100,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  compactImageContainer: {
    width: "100%",
    height: 80,
  },
  compactImage: {
    width: "100%",
    height: "100%",
  },
  compactPlaceholder: {
    width: "100%",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  compactInfo: {
    padding: Spacing.sm,
    gap: 2,
  },
  typeRow: {
    flexDirection: "row",
  },
  compactTime: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  aiIndicator: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.dark.backgroundRoot,
    borderRadius: 8,
    padding: 2,
  },
});
