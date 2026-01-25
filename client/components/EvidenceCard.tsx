import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing, AnimationConfig, ForensicColors } from "@/constants/theme";
import { EvidenceTypeBadge, AnalysisBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import type { Evidence } from "@/types/case";

interface EvidenceCardProps {
  evidence: Evidence;
  compact?: boolean;
  onPress?: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EvidenceCard({ evidence, compact = false, onPress, index = 0 }: EvidenceCardProps) {
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
        return Colors.dark.primary;
      case "video":
        return ForensicColors.statusRed;
      case "audio":
        return Colors.dark.success;
      case "note":
        return Colors.dark.accent;
      default:
        return Colors.dark.textSecondary;
    }
  };

  const getObjectCount = () => {
    if (evidence.detectedObjects && Array.isArray(evidence.detectedObjects)) {
      return evidence.detectedObjects.length;
    }
    return 0;
  };

  if (compact) {
    return (
      <AnimatedPressable
        entering={FadeIn.duration(300).delay(index * 50)}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.compactCard, animatedStyle]}
        testID={`evidence-compact-${evidence.id}`}
      >
        {evidence.uri && (evidence.type === "photo" || evidence.type === "video") ? (
          <View style={styles.compactImageContainer}>
            <Image source={{ uri: evidence.uri }} style={styles.compactImage} contentFit="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageGradient}
            />
            {evidence.type === "video" ? (
              <View style={styles.videoOverlay}>
                <View style={styles.playButton}>
                  <Feather name="play" size={16} color={Colors.dark.text} />
                </View>
              </View>
            ) : null}
            {evidence.aiAnalysis ? (
              <View style={styles.compactAiBadge}>
                <Feather name="cpu" size={10} color={Colors.dark.primary} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.compactPlaceholder, { backgroundColor: getTypeColor() + "15" }]}>
            <Feather name={getIcon()} size={28} color={getTypeColor()} />
          </View>
        )}
        <View style={styles.compactInfo}>
          <EvidenceTypeBadge type={evidence.type} size="sm" />
          <ThemedText style={styles.compactTime}>
            {format(new Date(evidence.timestamp), "HH:mm")}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      entering={FadeIn.duration(300).delay(index * 80)}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
      testID={`evidence-${evidence.id}`}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: getTypeColor() + "15" }]}>
            <Feather name={getIcon()} size={20} color={getTypeColor()} />
          </View>
          
          <View style={styles.headerText}>
            <ThemedText style={styles.evidenceId}>
              Evidence #{evidence.id.slice(-6).toUpperCase()}
            </ThemedText>
            <View style={styles.metaRow}>
              <ThemedText style={styles.timestamp}>
                {format(new Date(evidence.timestamp), "HH:mm:ss")}
              </ThemedText>
              <View style={styles.dot} />
              <ThemedText style={styles.date}>
                {format(new Date(evidence.timestamp), "MMM d")}
              </ThemedText>
            </View>
          </View>
          
          {evidence.analysisStatus === "completed" ? (
            <AnalysisBadge status="completed" size="sm" />
          ) : null}
        </View>

        {evidence.uri && (evidence.type === "photo" || evidence.type === "video") ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: evidence.uri }}
              style={styles.evidenceImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.imageOverlay}
            />
            {evidence.type === "video" ? (
              <View style={styles.videoPlayOverlay}>
                <View style={styles.playButtonLarge}>
                  <Feather name="play" size={24} color={Colors.dark.text} />
                </View>
                {evidence.duration ? (
                  <View style={styles.durationBadge}>
                    <ThemedText style={styles.durationText}>
                      {Math.floor(evidence.duration / 60)}:{(Math.floor(evidence.duration) % 60).toString().padStart(2, "0")}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}
            {getObjectCount() > 0 ? (
              <View style={styles.objectCountBadge}>
                <MaterialCommunityIcons name="cube-outline" size={14} color={Colors.dark.text} />
                <ThemedText style={styles.objectCountText}>
                  {getObjectCount()} object{getObjectCount() !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}

        {evidence.type === "note" && evidence.content ? (
          <View style={styles.noteContainer}>
            <ThemedText style={styles.noteContent} numberOfLines={3}>
              {evidence.content}
            </ThemedText>
          </View>
        ) : null}

        {evidence.aiSummary ? (
          <View style={styles.aiSummaryContainer}>
            <Feather name="cpu" size={14} color={Colors.dark.primary} />
            <ThemedText style={styles.aiSummaryText} numberOfLines={2}>
              {evidence.aiSummary}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {evidence.latitude && evidence.longitude ? (
              <View style={styles.locationBadge}>
                <Feather name="map-pin" size={12} color={Colors.dark.success} />
                <ThemedText style={styles.locationText}>GPS</ThemedText>
              </View>
            ) : null}
            <EvidenceTypeBadge type={evidence.type} size="sm" />
          </View>
          
          <View style={styles.arrow}>
            <Feather name="chevron-right" size={18} color={Colors.dark.textTertiary} />
          </View>
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
    marginBottom: Spacing.md,
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
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  evidenceId: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textDisabled,
    marginHorizontal: Spacing.sm,
  },
  date: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  imageContainer: {
    position: "relative",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  evidenceImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  objectCountBadge: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(47, 164, 185, 0.9)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  objectCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  noteContainer: {
    backgroundColor: ForensicColors.muted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.accent,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  aiSummaryContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(47, 164, 185, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(47, 164, 185, 0.2)",
  },
  aiSummaryText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.primary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.success,
  },
  arrow: {
    opacity: 0.7,
  },
  compactCard: {
    width: 110,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  compactImageContainer: {
    width: "100%",
    height: 90,
    position: "relative",
  },
  compactImage: {
    width: "100%",
    height: "100%",
  },
  compactPlaceholder: {
    width: "100%",
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  compactAiBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.dark.backgroundRoot,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  compactInfo: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  compactTime: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },
});
