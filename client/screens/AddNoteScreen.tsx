import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { addEvidence, logActivity, getProfile } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "AddNote">["route"];

export default function AddNoteScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { caseId } = route.params;

  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [locationPermission] = Location.useForegroundPermissions();

  const handleSave = async () => {
    if (!note.trim()) return;
    
    setIsSaving(true);
    try {
      let location = null;
      if (locationPermission?.granted) {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          location = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        } catch {
          console.log("Failed to get location");
        }
      }

      await addEvidence({
        caseId,
        type: "note",
        content: note.trim(),
        timestamp: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      const profile = await getProfile();
      await logActivity(caseId, "Note added", profile.name, note.trim().substring(0, 50) + (note.length > 50 ? "..." : ""));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save note:", error);
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
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Evidence Note</ThemedText>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what you observe..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            This note will be timestamped and GPS tagged (if location is available) for chain of custody documentation.
          </ThemedText>
        </View>
      </View>

      <Button
        onPress={handleSave}
        disabled={!note.trim() || isSaving}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : "Save Note"}
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
    flex: 1,
  },
  form: {
    flex: 1,
    gap: Spacing.xl,
  },
  inputContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  textArea: {
    flex: 1,
    minHeight: 200,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    fontSize: 16,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: Colors.dark.primary + "20",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  infoText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    marginTop: Spacing.lg,
  },
});
