import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, BorderRadius, Spacing, Fonts } from "@/constants/theme";
import { formatDistanceToNow } from "date-fns";
import type { Case } from "@/types/case";

interface CaseCardProps {
  caseData: Case;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CaseCard({ caseData, onPress }: CaseCardProps) {
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

  const timeAgo = formatDistanceToNow(new Date(caseData.createdAt), { addSuffix: true });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.thumbnailContainer}>
        {caseData.thumbnail ? (
          <Image source={{ uri: caseData.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Feather name="folder" size={24} color={Colors.dark.textSecondary} />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.caseId}>{caseData.caseId}</ThemedText>
          <StatusBadge status={caseData.status} />
        </View>
        
        <ThemedText style={styles.title} numberOfLines={1}>
          {caseData.title}
        </ThemedText>
        
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.metaText} numberOfLines={1}>
              {caseData.location}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.metaText}>{timeAgo}</ThemedText>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.evidenceCount}>
            <Feather name="image" size={14} color={Colors.dark.accent} />
            <ThemedText style={styles.evidenceText}>
              {caseData.evidenceCount} evidence items
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: 80,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseId: {
    fontSize: 12,
    fontFamily: Fonts?.mono,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  meta: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  evidenceCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  evidenceText: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
});
