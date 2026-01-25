import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EvidenceButton } from "@/components/EvidenceButton";
import { EvidenceCard } from "@/components/EvidenceCard";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getActiveCase, getCase, getEvidence, addEvidence, setActiveCase, updateCase, logActivity, getProfile, updateEvidence } from "@/lib/storage";
import { analyzeImage } from "@/lib/ai";
import type { Case, Evidence } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function InvestigationScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  
  const [activeCase, setActiveCaseData] = useState<Case | null>(null);
  const [recentEvidence, setRecentEvidence] = useState<Evidence[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState("00:00:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [micPermission, setMicPermission] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const zoom = useSharedValue(0);
  const savedZoom = useSharedValue(0);

  const loadActiveCase = useCallback(async () => {
    try {
      const activeCaseId = await getActiveCase();
      if (activeCaseId) {
        const caseData = await getCase(activeCaseId);
        if (caseData) {
          setActiveCaseData(caseData);
          const evidence = await getEvidence(activeCaseId);
          setRecentEvidence(evidence.slice(0, 5));
          if (caseData.status === "active") {
            setIsRecording(true);
          }
        }
      } else {
        setActiveCaseData(null);
        setRecentEvidence([]);
      }
    } catch (error) {
      console.error("Failed to load active case:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveCase();
    }, [loadActiveCase])
  );

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setRecordingDuration(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration("00:00:00");
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newZoom = savedZoom.value + (e.scale - 1) * 0.5;
      zoom.value = Math.max(0, Math.min(1, newZoom));
    })
    .onEnd(() => {
      savedZoom.value = zoom.value;
      runOnJS(triggerHaptic)();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (zoom.value > 0) {
        zoom.value = withSpring(0);
        savedZoom.value = 0;
      } else {
        zoom.value = withSpring(0.5);
        savedZoom.value = 0.5;
      }
      runOnJS(triggerHaptic)();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  const handleStartInvestigation = async () => {
    if (!activeCase) return;
    
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    
    if (!locationPermission?.granted) {
      await requestLocationPermission();
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(true);
    await updateCase(activeCase.id, { status: "active" });
    const profile = await getProfile();
    await logActivity(activeCase.id, "Investigation started", profile.name, "Background recording initiated");
    setActiveCaseData({ ...activeCase, status: "active" });
  };

  const handleStopInvestigation = async () => {
    if (!activeCase) return;
    
    if (isVideoRecording) {
      await handleStopVideoRecording();
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsRecording(false);
    await updateCase(activeCase.id, { status: "pending" });
    const profile = await getProfile();
    await logActivity(activeCase.id, "Investigation stopped", profile.name, `Recording duration: ${recordingDuration}`);
    setActiveCaseData({ ...activeCase, status: "pending" });
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!locationPermission?.granted) {
      const result = await requestLocationPermission();
      if (!result.granted) return null;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      return null;
    }
  };

  const handleCapturePhoto = async () => {
    if (!activeCase || !cameraRef.current) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (!photo) return;
      
      const location = await getCurrentLocation();
      const profile = await getProfile();
      
      const newEvidence = await addEvidence({
        caseId: activeCase.id,
        type: "photo",
        uri: photo.uri,
        timestamp: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      
      await logActivity(activeCase.id, "Photo captured", profile.name, location ? "GPS tagged" : "No GPS");
      
      const evidence = await getEvidence(activeCase.id);
      setRecentEvidence(evidence.slice(0, 5));
      
      const updatedCase = await getCase(activeCase.id);
      if (updatedCase) setActiveCaseData(updatedCase);

      if (photo.base64) {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeImage(photo.base64);
          if (analysis) {
            await updateEvidence(newEvidence.id, { aiAnalysis: analysis });
            const updatedEvidence = await getEvidence(activeCase.id);
            setRecentEvidence(updatedEvidence.slice(0, 5));
          }
        } catch (error) {
          console.error("AI analysis failed:", error);
        } finally {
          setIsAnalyzing(false);
        }
      }
      
    } catch (error) {
      console.error("Failed to capture photo:", error);
    }
  };

  const handleStartVideoRecording = async () => {
    if (!activeCase || !cameraRef.current || isVideoRecording) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsVideoRecording(true);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 300,
      });
      
      if (video) {
        const location = await getCurrentLocation();
        const profile = await getProfile();
        
        await addEvidence({
          caseId: activeCase.id,
          type: "video",
          uri: video.uri,
          timestamp: new Date().toISOString(),
          latitude: location?.latitude,
          longitude: location?.longitude,
        });
        
        await logActivity(activeCase.id, "Video recorded", profile.name, location ? "GPS tagged" : "No GPS");
        
        const evidence = await getEvidence(activeCase.id);
        setRecentEvidence(evidence.slice(0, 5));
        
        const updatedCase = await getCase(activeCase.id);
        if (updatedCase) setActiveCaseData(updatedCase);
      }
    } catch (error) {
      console.error("Failed to record video:", error);
    } finally {
      setIsVideoRecording(false);
    }
  };

  const handleStopVideoRecording = () => {
    if (!cameraRef.current) return;
    
    try {
      cameraRef.current.stopRecording();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsVideoRecording(false);
    }
  };

  const handleToggleCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFacing(facing === "back" ? "front" : "back");
  };

  const handleAddNote = () => {
    if (!activeCase) return;
    navigation.navigate("AddNote", { caseId: activeCase.id });
  };

  const handleRecordAudio = () => {
    if (!activeCase) return;
    navigation.navigate("RecordAudio", { caseId: activeCase.id });
  };

  const handleSelectCase = () => {
    navigation.navigate("Main", { screen: "CasesTab" });
  };

  const handleEvidencePress = (evidence: Evidence) => {
    navigation.navigate("EvidenceViewer", { evidence });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  if (!activeCase) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight, paddingBottom: tabBarHeight }]}>
        <EmptyState
          image={require("../../assets/images/empty-investigation.png")}
          title="No Active Investigation"
          description="Select a case from the Cases tab to begin your investigation."
          actionLabel="Go to Cases"
          onAction={handleSelectCase}
        />
      </View>
    );
  }

  const permissionsGranted = cameraPermission?.granted;

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.caseInfo}>
            <ThemedText style={styles.caseId}>{activeCase.caseId}</ThemedText>
            <ThemedText style={styles.caseTitle} numberOfLines={1}>
              {activeCase.title}
            </ThemedText>
          </View>
          {isRecording ? (
            <RecordingIndicator duration={recordingDuration} isRecording={isRecording} />
          ) : null}
        </View>

        {permissionsGranted ? (
          <GestureHandlerRootView style={styles.cameraWrapper}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  zoom={zoom.value}
                  mode="video"
                />
                {!isRecording ? (
                  <View style={styles.cameraOverlay}>
                    <ThemedText style={styles.overlayText}>Camera on standby</ThemedText>
                  </View>
                ) : null}
                {isVideoRecording ? (
                  <View style={styles.videoRecordingOverlay}>
                    <View style={styles.recordingDot} />
                    <ThemedText style={styles.recordingText}>Recording Video</ThemedText>
                  </View>
                ) : null}
                {isAnalyzing ? (
                  <View style={styles.analyzingOverlay}>
                    <Feather name="cpu" size={24} color={Colors.dark.accent} />
                    <ThemedText style={styles.analyzingText}>Analyzing with AI...</ThemedText>
                  </View>
                ) : null}
                
                <View style={styles.cameraControls}>
                  <Pressable onPress={handleToggleCamera} style={styles.cameraControlButton}>
                    <Feather name="refresh-cw" size={20} color={Colors.dark.text} />
                  </Pressable>
                </View>
                
                <View style={styles.zoomIndicator}>
                  <ThemedText style={styles.zoomText}>
                    {(1 + zoom.value * 4).toFixed(1)}x
                  </ThemedText>
                </View>
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        ) : (
          <View style={styles.permissionContainer}>
            <ThemedText style={styles.permissionText}>
              Camera permission is required for evidence capture
            </ThemedText>
            {cameraPermission?.status === "denied" && !cameraPermission.canAskAgain ? (
              Platform.OS !== "web" ? (
                <Button
                  onPress={async () => {
                    try {
                      await Linking.openSettings();
                    } catch (error) {
                      console.error("Failed to open settings:", error);
                    }
                  }}
                  style={styles.permissionButton}
                >
                  Open Settings
                </Button>
              ) : null
            ) : (
              <Button onPress={requestCameraPermission} style={styles.permissionButton}>
                Enable Camera
              </Button>
            )}
          </View>
        )}

        <View style={styles.controlsContainer}>
          {!isRecording ? (
            <Button onPress={handleStartInvestigation} style={styles.startButton} testID="button-start-investigation">
              Start Investigation
            </Button>
          ) : (
            <>
              <View style={styles.evidenceControls}>
                <EvidenceButton
                  icon="file-text"
                  label="Add Note"
                  onPress={handleAddNote}
                  testID="button-add-note"
                />
                <EvidenceButton
                  icon="camera"
                  label="Capture Photo"
                  onPress={handleCapturePhoto}
                  variant="primary"
                  testID="button-capture-photo"
                />
                <EvidenceButton
                  icon="mic"
                  label="Record Audio"
                  onPress={handleRecordAudio}
                  testID="button-record-audio"
                />
              </View>
              
              <View style={styles.videoControls}>
                {!isVideoRecording ? (
                  <Button onPress={handleStartVideoRecording} style={styles.videoButton}>
                    <View style={styles.videoButtonContent}>
                      <Feather name="video" size={18} color={Colors.dark.buttonText} />
                      <ThemedText style={styles.videoButtonText}>Start Video Recording</ThemedText>
                    </View>
                  </Button>
                ) : (
                  <Button onPress={handleStopVideoRecording} style={[styles.videoButton, styles.videoStopButton]}>
                    <View style={styles.videoButtonContent}>
                      <Feather name="square" size={18} color={Colors.dark.buttonText} />
                      <ThemedText style={styles.videoButtonText}>Stop Video Recording</ThemedText>
                    </View>
                  </Button>
                )}
              </View>
              
              <Button
                onPress={handleStopInvestigation}
                style={[styles.stopButton, { backgroundColor: Colors.dark.error }]}
                testID="button-stop-investigation"
              >
                Stop Investigation
              </Button>
            </>
          )}
        </View>

        {recentEvidence.length > 0 ? (
          <View style={styles.recentSection}>
            <ThemedText style={styles.sectionTitle}>Recently Captured</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
            >
              {recentEvidence.map((evidence) => (
                <EvidenceCard
                  key={evidence.id}
                  evidence={evidence}
                  compact
                  onPress={() => handleEvidencePress(evidence)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    color: Colors.dark.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  caseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  caseId: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  caseTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  cameraWrapper: {
    marginBottom: Spacing.lg,
  },
  cameraContainer: {
    height: 250,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  videoRecordingOverlay: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.text,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  analyzingOverlay: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    justifyContent: "center",
  },
  analyzingText: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
  cameraControls: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    gap: Spacing.sm,
  },
  cameraControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomIndicator: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  zoomText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  permissionContainer: {
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  permissionButton: {
    paddingHorizontal: Spacing["2xl"],
  },
  controlsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  startButton: {
    backgroundColor: Colors.dark.success,
  },
  evidenceControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.lg,
  },
  videoControls: {
    gap: Spacing.sm,
  },
  videoButton: {
    backgroundColor: Colors.dark.primary,
  },
  videoStopButton: {
    backgroundColor: Colors.dark.error,
  },
  videoButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  videoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.buttonText,
  },
  stopButton: {
    marginTop: Spacing.sm,
  },
  recentSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  recentList: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
});
