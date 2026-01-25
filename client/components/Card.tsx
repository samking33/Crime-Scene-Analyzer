import React from "react";
import { StyleSheet, Pressable, ViewStyle, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, AnimationConfig, Colors } from "@/constants/theme";

interface CardProps {
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accentColor?: string;
  noPadding?: boolean;
}

const getBackgroundColorForElevation = (
  elevation: number,
  theme: any,
): string => {
  switch (elevation) {
    case 1:
      return theme.backgroundDefault;
    case 2:
      return theme.backgroundSecondary;
    case 3:
      return theme.backgroundTertiary;
    case 4:
      return theme.backgroundElevated;
    default:
      return theme.backgroundRoot;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 2,
  title,
  description,
  children,
  onPress,
  style,
  accentColor,
  noPadding = false,
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const cardBackgroundColor = getBackgroundColorForElevation(elevation, theme);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, AnimationConfig.springFast);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, AnimationConfig.springFast);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.card,
        Shadows.lg,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: theme.border,
        },
        noPadding && styles.noPadding,
        animatedStyle,
        style,
      ]}
    >
      {accentColor ? (
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={noPadding ? undefined : styles.cardContent}>
        {title ? (
          <ThemedText type="h4" style={styles.cardTitle}>
            {title}
          </ThemedText>
        ) : null}
        {description ? (
          <ThemedText type="small" style={styles.cardDescription}>
            {description}
          </ThemedText>
        ) : null}
        {children}
      </View>
    </AnimatedPressable>
  );
}

export function PremiumCard({
  children,
  onPress,
  style,
  accentColor,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accentColor?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, AnimationConfig.springFast);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, AnimationConfig.springFast);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.premiumCard,
        Shadows.lg,
        animatedStyle,
        style,
      ]}
    >
      {accentColor ? (
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  trendPositive,
  onPress,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendPositive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        pressed && onPress && styles.statCardPressed,
      ]}
    >
      <View style={styles.statIconContainer}>
        {icon}
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      {trend ? (
        <View style={styles.statTrend}>
          <ThemedText
            style={[
              styles.statTrendText,
              { color: trendPositive ? Colors.dark.success : Colors.dark.error },
            ]}
          >
            {trend}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
  noPadding: {
    padding: 0,
  },
  cardContent: {
    padding: Spacing.cardPadding,
  },
  accentBorder: {
    height: 3,
    width: "100%",
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  premiumCard: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "rgba(30, 37, 48, 0.6)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statCardPressed: {
    opacity: 0.8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(41, 98, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    fontWeight: "500",
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
