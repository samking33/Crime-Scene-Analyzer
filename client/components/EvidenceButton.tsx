import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface EvidenceButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EvidenceButton({
  icon,
  label,
  onPress,
  variant = "secondary",
  disabled = false,
  testID,
}: EvidenceButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const isPrimary = variant === "primary";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabled,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          isPrimary ? styles.primaryIcon : styles.secondaryIcon,
        ]}
      >
        <Feather
          name={icon}
          size={isPrimary ? 32 : 24}
          color={isPrimary ? Colors.dark.text : Colors.dark.accent}
        />
      </View>
      <ThemedText style={[styles.label, isPrimary && styles.primaryLabel]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
  primaryIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.dark.accent,
  },
  secondaryIcon: {
    width: 60,
    height: 60,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  primaryLabel: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
});
