import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing, Shadows, GradientColors, AnimationConfig } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  testID,
  variant = "primary",
  icon,
  fullWidth = true,
  size = "md",
  haptic = true,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, AnimationConfig.springFast);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, AnimationConfig.springFast);
    }
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return 40;
      case "lg":
        return 56;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 13;
      case "lg":
        return 16;
      default:
        return 15;
    }
  };

  if (variant === "primary") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={[
          styles.buttonBase,
          fullWidth && styles.fullWidth,
          { height: getHeight() },
          disabled && styles.disabled,
          Shadows.primaryGlow,
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={GradientColors.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <ThemedText
            style={[styles.primaryText, { fontSize: getFontSize() }]}
          >
            {children}
          </ThemedText>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === "secondary") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={[
          styles.buttonBase,
          styles.secondaryButton,
          fullWidth && styles.fullWidth,
          { height: getHeight() },
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        <View style={styles.secondaryContent}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <ThemedText
            style={[styles.secondaryText, { fontSize: getFontSize() }]}
          >
            {children}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === "danger") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={[
          styles.buttonBase,
          styles.dangerButton,
          fullWidth && styles.fullWidth,
          { height: getHeight() },
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        <View style={styles.dangerContent}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <ThemedText
            style={[styles.dangerText, { fontSize: getFontSize() }]}
          >
            {children}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      style={[
        styles.buttonBase,
        styles.ghostButton,
        fullWidth && styles.fullWidth,
        { height: getHeight() },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <ThemedText
        style={[styles.ghostText, { fontSize: getFontSize() }]}
      >
        {children}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function IconButton({
  onPress,
  icon,
  style,
  disabled = false,
  size = 40,
  variant = "ghost",
}: {
  onPress?: () => void;
  icon: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  size?: number;
  variant?: "ghost" | "filled";
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, AnimationConfig.springFast);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, AnimationConfig.springFast);
    }
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor:
            variant === "filled"
              ? "rgba(139, 92, 246, 0.15)"
              : "rgba(248, 250, 252, 0.05)",
        },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    height: "100%",
    width: "100%",
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  primaryText: {
    fontWeight: "600",
    color: Colors.dark.buttonText,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.dark.borderAccent,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  secondaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  secondaryText: {
    fontWeight: "600",
    color: Colors.dark.primary,
    letterSpacing: 0.3,
  },
  dangerButton: {
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  dangerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  dangerText: {
    fontWeight: "600",
    color: Colors.dark.error,
    letterSpacing: 0.3,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  ghostText: {
    fontWeight: "500",
    color: Colors.dark.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
