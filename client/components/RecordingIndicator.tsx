import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface RecordingIndicatorProps {
  duration: string;
  isRecording: boolean;
}

export function RecordingIndicator({ duration, isRecording }: RecordingIndicatorProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [isRecording, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dotStyle]} />
      <ThemedText style={styles.text}>REC</ThemedText>
      <ThemedText style={styles.duration}>{duration}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.error + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.error,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.error,
  },
  duration: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.text,
    fontVariant: ["tabular-nums"],
  },
});
