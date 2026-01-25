import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Colors, Spacing } from "@/constants/theme";
import { getProfile, saveProfile } from "@/lib/storage";
import type { OfficerProfile } from "@/types/case";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getProfile();
      setName(profile.name);
      setBadgeNumber(profile.badgeNumber);
      setDepartment(profile.department);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        badgeNumber: badgeNumber.trim() || "000000",
        department: department.trim() || "Police Department",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save profile:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.form}>
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          label="Badge Number"
          placeholder="Enter badge number"
          value={badgeNumber}
          onChangeText={setBadgeNumber}
          keyboardType="number-pad"
        />
        <Input
          label="Department"
          placeholder="Enter department name"
          value={department}
          onChangeText={setDepartment}
          autoCapitalize="words"
        />
      </View>

      <Button
        onPress={handleSave}
        disabled={!name.trim() || isSaving}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : "Save Profile"}
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  form: {
    gap: Spacing.xl,
    marginBottom: Spacing["3xl"],
  },
  saveButton: {
    backgroundColor: Colors.dark.accent,
  },
});
