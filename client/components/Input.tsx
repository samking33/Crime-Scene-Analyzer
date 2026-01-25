import React, { useState } from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing, AnimationConfig } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  testID?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function Input({ label, error, style, testID, icon, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(Colors.dark.border);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(Colors.dark.primary, {
      duration: AnimationConfig.timingFast.duration,
    });
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? Colors.dark.error : Colors.dark.border,
      { duration: AnimationConfig.timingFast.duration }
    );
    props.onBlur?.({} as any);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={styles.label}>{label}</ThemedText>
      ) : null}
      <Animated.View
        style={[
          styles.inputWrapper,
          error && styles.inputError,
          isFocused && styles.inputFocused,
          animatedBorderStyle,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={18}
            color={isFocused ? Colors.dark.primary : Colors.dark.textTertiary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.dark.textDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          {...props}
        />
      </Animated.View>
      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={Colors.dark.error} />
          <ThemedText style={styles.error}>{error}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export function TextArea({
  label,
  error,
  style,
  testID,
  numberOfLines = 4,
  ...props
}: InputProps & { numberOfLines?: number }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={styles.label}>{label}</ThemedText>
      ) : null}
      <View
        style={[
          styles.textAreaWrapper,
          error && styles.inputError,
          isFocused && styles.inputFocused,
        ]}
      >
        <TextInput
          style={[styles.textArea, { minHeight: numberOfLines * 24 }, style]}
          placeholderTextColor={Colors.dark.textDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          testID={testID}
          {...props}
        />
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={Colors.dark.error} />
          <ThemedText style={styles.error}>{error}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight,
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  inputFocused: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(41, 98, 255, 0.05)",
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  error: {
    fontSize: 12,
    color: Colors.dark.error,
  },
  textAreaWrapper: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  textArea: {
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: "500",
    lineHeight: 22,
  },
});
