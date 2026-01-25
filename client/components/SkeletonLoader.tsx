import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CaseCardSkeleton() {
  return (
    <View style={styles.caseCard}>
      <SkeletonLoader width={80} height={80} borderRadius={0} />
      <View style={styles.caseCardContent}>
        <View style={styles.caseCardHeader}>
          <SkeletonLoader width={100} height={14} />
          <SkeletonLoader width={60} height={20} />
        </View>
        <SkeletonLoader width="80%" height={18} />
        <View style={styles.caseCardMeta}>
          <SkeletonLoader width={120} height={12} />
          <SkeletonLoader width={80} height={12} />
        </View>
        <SkeletonLoader width={100} height={12} />
      </View>
    </View>
  );
}

export function ReportCardSkeleton() {
  return (
    <View style={styles.reportCard}>
      <SkeletonLoader width={48} height={48} />
      <View style={styles.reportCardContent}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: 4 }} />
        <SkeletonLoader width={80} height={16} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={20} height={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  caseCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  caseCardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  caseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  caseCardMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  reportCardContent: {
    flex: 1,
  },
});
