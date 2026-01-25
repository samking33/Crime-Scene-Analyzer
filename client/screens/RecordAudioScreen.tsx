import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useAudioRecorder, RecordingPresets, AudioModule } from "expo-audio";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { addEvidence, logActivity, getProfile } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "RecordAudio">["route"];

export default function RecordAudioScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { caseId } = route.params;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState("00:00");
  const [isSaving, setIsSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [locationPermission] = Location.useForegroundPermissions();

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const checkPermission = async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
    };
    checkPermission();
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isRecording, pulseScale]);

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setDuration(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleStartRecording = async () => {
    if (!hasPermission) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) return;
      setHasPermission(true);
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await recorder.record();
      setIsRecording(true);
      setRecordingUri(null);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recorder.stop();
      setIsRecording(false);
      setRecordingUri(recorder.uri || null);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleSave = async () => {
    if (!recordingUri) return;

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
        type: "audio",
        uri: recordingUri,
        content: `Audio note (${duration})`,
        timestamp: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      const profile = await getProfile();
      await logActivity(caseId, "Audio note recorded", profile.name, `Duration: ${duration}`);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save audio:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecordingUri(null);
    setDuration("00:00");
  };

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight + Spacing.xl }]}>
        <View style={styles.permissionContainer}>
          <Feather name="mic-off" size={48} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.permissionText}>
            Microphone permission is required to record audio notes
          </ThemedText>
          <Button
            onPress={async () => {
              const status = await AudioModule.requestRecordingPermissionsAsync();
              setHasPermission(status.granted);
            }}
            style={styles.permissionButton}
          >
            Enable Microphone
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors.dark.backgroundRoot,
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.recordingArea}>
          {isRecording ? (
            <>
              <Animated.View style={[styles.pulseCircle, pulseStyle]} />
              <View style={styles.recordingIndicator}>
                <Feather name="mic" size={48} color={Colors.dark.error} />
              </View>
            </>
          ) : recordingUri ? (
            <View style={styles.recordedIndicator}>
              <Feather name="check-circle" size={48} color={Colors.dark.success} />
            </View>
          ) : (
            <View style={styles.standbyIndicator}>
              <Feather name="mic" size={48} color={Colors.dark.textSecondary} />
            </View>
          )}
        </View>

        <ThemedText style={styles.duration}>{duration}</ThemedText>
        <ThemedText style={styles.status}>
          {isRecording
            ? "Recording..."
            : recordingUri
            ? "Recording complete"
            : "Tap to start recording"}
        </ThemedText>
      </View>

      <View style={styles.controls}>
        {!recordingUri ? (
          <Pressable
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={[
              styles.recordButton,
              isRecording && styles.stopButton,
            ]}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <Feather name="mic" size={32} color={Colors.dark.text} />
            )}
          </Pressable>
        ) : (
          <View style={styles.actionButtons}>
            <Button onPress={handleDiscard} style={styles.discardButton}>
              Discard
            </Button>
            <Button
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? "Saving..." : "Save Recording"}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  recordingArea: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.dark.error + "30",
  },
  recordingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.error + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.dark.error,
  },
  recordedIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.success + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.dark.success,
  },
  standbyIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  duration: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.dark.text,
    fontVariant: ["tabular-nums"],
  },
  status: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  controls: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.error,
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: Colors.dark.error,
    borderRadius: BorderRadius.md,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: Colors.dark.text,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  discardButton: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.dark.accent,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  permissionButton: {
    paddingHorizontal: Spacing["2xl"],
  },
});
