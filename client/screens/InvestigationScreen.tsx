import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Platform, Pressable, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
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
  FadeIn,
} from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EvidenceButton } from "@/components/EvidenceButton";
import { EvidenceCard } from "@/components/EvidenceCard";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getActiveCase, getCase, getEvidence, addEvidence, setActiveCase, updateCase, logActivity, getProfile, updateEvidence } from "@/lib/storage";
import { analyzeImage } from "@/lib/ai";
import { saveCategorizedObjects, CategorizedObject } from "@/lib/categories";
import type { Case, Evidence, DetectedObject } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PendingAnalysis {
  evidenceId: string;
  base64: string;
  caseId: string;
  evidenceUri: string;
}

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [pendingAnalysisList, setPendingAnalysisList] = useState<PendingAnalysis[]>([]);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRecordingStartTimeRef = useRef<number>(0);
  const [isBackgroundRecording, setIsBackgroundRecording] = useState(false);

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
    setPendingAnalysisList([]);
    
    const investigationStartTime = new Date().toISOString();
    const videoStartTimestamp = Date.now();
    videoRecordingStartTimeRef.current = videoStartTimestamp;
    
    await updateCase(activeCase.id, { 
      status: "active",
      investigationStartTime,
      videoRecordingStartTime: videoStartTimestamp,
    });
    const profile = await getProfile();
    await logActivity(activeCase.id, "Investigation started", profile.name, "Background recording initiated");
    setActiveCaseData({ 
      ...activeCase, 
      status: "active",
      investigationStartTime,
      videoRecordingStartTime: videoStartTimestamp,
    });
    
    if (Platform.OS !== "web") {
      startBackgroundVideoRecording();
    }
  };

  const startBackgroundVideoRecording = async () => {
    if (!cameraRef.current || isBackgroundRecording) return;
    
    try {
      setIsBackgroundRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 7200,
      });
      
      if (video && activeCase) {
        const endTime = Date.now();
        const duration = (endTime - videoRecordingStartTimeRef.current) / 1000;
        
        await updateCase(activeCase.id, {
          backgroundVideoUri: video.uri,
          backgroundVideoDuration: duration,
          videoRecordingEndTime: endTime,
        });
        
        const updatedCase = await getCase(activeCase.id);
        if (updatedCase) setActiveCaseData(updatedCase);
      }
    } catch (error) {
      console.error("Background video recording failed:", error);
    } finally {
      setIsBackgroundRecording(false);
    }
  };

  const stopBackgroundVideoRecording = () => {
    if (!cameraRef.current) return;
    try {
      cameraRef.current.stopRecording();
    } catch (error) {
      console.error("Failed to stop background recording:", error);
    }
  };

  const processAllPendingAnalysis = async () => {
    if (pendingAnalysisList.length === 0) return;
    
    setIsProcessingAnalysis(true);
    const profile = await getProfile();
    
    for (const pending of pendingAnalysisList) {
      try {
        const result = await analyzeImage(pending.base64);
        if (result) {
          let annotatedImageUri: string | undefined;
          
          if (result.annotatedImage) {
            const docDir = FileSystem.documentDirectory || "";
            const annotatedPath = `${docDir}${pending.caseId}/annotated_${pending.evidenceId}.jpg`;
            await FileSystem.makeDirectoryAsync(`${docDir}${pending.caseId}`, { intermediates: true }).catch(() => {});
            await FileSystem.writeAsStringAsync(annotatedPath, result.annotatedImage, {
              encoding: "base64",
            });
            annotatedImageUri = annotatedPath;
          }
          
          await updateEvidence(pending.evidenceId, { 
            detectedObjects: result.detectedObjects,
            aiSummary: result.aiSummary,
            aiAnalysis: result.analysis,
            analysisStatus: "completed",
            annotatedImageUri,
          });
          
          await logActivity(pending.caseId, "AI analysis completed", profile.name, 
            `${result.objectCount} objects detected`);
          
          if (result.detectedObjects && result.detectedObjects.length > 0) {
            const categoryNameToId: Record<string, number> = {
              weapon: 1, vehicle: 2, person: 3, biometric: 4, drug: 5,
              document: 6, electronics: 7, markers: 8, tools: 9, other: 10,
            };
            
            const categorizedObjects: CategorizedObject[] = result.detectedObjects.map((obj: DetectedObject) => ({
              id: obj.id,
              evidenceId: pending.evidenceId,
              evidenceUri: pending.evidenceUri,
              objectName: obj.label,
              confidence: obj.confidence,
              location: obj.location,
              categoryId: obj.categoryId || categoryNameToId[obj.category] || 10,
              categoryName: obj.category,
              detectedAt: Date.now(),
            }));
            
            await saveCategorizedObjects(pending.caseId, categorizedObjects);
          }
        }
      } catch (error) {
        console.error("AI analysis failed for evidence:", pending.evidenceId, error);
        await updateEvidence(pending.evidenceId, { analysisStatus: "failed" });
      }
    }
    
    setPendingAnalysisList([]);
    setIsProcessingAnalysis(false);
    
    if (activeCase) {
      const updatedEvidence = await getEvidence(activeCase.id);
      setRecentEvidence(updatedEvidence.slice(0, 5));
    }
  };

  const handleStopInvestigation = async () => {
    if (!activeCase) return;
    
    if (isVideoRecording) {
      handleStopVideoRecording();
    }
    
    if (isBackgroundRecording) {
      stopBackgroundVideoRecording();
    }
    
    const investigationEndTime = new Date().toISOString();
    const videoEndTimestamp = Date.now();
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsRecording(false);
    await updateCase(activeCase.id, { 
      status: "pending",
      investigationEndTime,
      videoRecordingEndTime: videoEndTimestamp,
    });
    const profile = await getProfile();
    await logActivity(activeCase.id, "Investigation stopped", profile.name, `Recording duration: ${recordingDuration}`);
    setActiveCaseData({ 
      ...activeCase, 
      status: "pending",
      investigationEndTime,
      videoRecordingEndTime: videoEndTimestamp,
    });
    
    if (pendingAnalysisList.length > 0) {
      console.log(`Starting AI analysis for ${pendingAnalysisList.length} photos...`);
      processAllPendingAnalysis();
    }
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
    if (!activeCase || !cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const captureTime = Date.now();
      const captureTimestamp = new Date().toISOString();
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (!photo) {
        setIsCapturing(false);
        return;
      }
      
      const location = await getCurrentLocation();
      const profile = await getProfile();
      
      let relativeTimestamp: number | undefined;
      if (videoRecordingStartTimeRef.current > 0) {
        relativeTimestamp = (captureTime - videoRecordingStartTimeRef.current) / 1000;
      } else if (activeCase.videoRecordingStartTime) {
        relativeTimestamp = (captureTime - activeCase.videoRecordingStartTime) / 1000;
      }
      
      const newEvidence = await addEvidence({
        caseId: activeCase.id,
        type: "photo",
        uri: photo.uri,
        timestamp: captureTimestamp,
        absoluteTimestamp: captureTime,
        relativeTimestamp,
        latitude: location?.latitude,
        longitude: location?.longitude,
        analysisStatus: "pending",
      });
      
      await logActivity(activeCase.id, "Photo captured", profile.name, location ? "GPS tagged" : "No GPS");
      
      const evidence = await getEvidence(activeCase.id);
      setRecentEvidence(evidence.slice(0, 5));
      
      const updatedCase = await getCase(activeCase.id);
      if (updatedCase) setActiveCaseData(updatedCase);

      if (photo.base64) {
        setPendingAnalysisList(prev => [...prev, {
          evidenceId: newEvidence.id,
          base64: photo.base64!,
          caseId: activeCase.id,
          evidenceUri: photo.uri,
        }]);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to capture photo:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStartVideoRecording = async () => {
    if (!activeCase || !cameraRef.current || isVideoRecording) return;
    
    if (Platform.OS === "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    const recordStartTime = Date.now();
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsVideoRecording(true);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 300,
      });
      
      if (video) {
        const recordEndTime = Date.now();
        const location = await getCurrentLocation();
        const profile = await getProfile();
        
        let relativeTimestamp: number | undefined;
        if (videoRecordingStartTimeRef.current > 0) {
          relativeTimestamp = (recordStartTime - videoRecordingStartTimeRef.current) / 1000;
        } else if (activeCase.videoRecordingStartTime) {
          relativeTimestamp = (recordStartTime - activeCase.videoRecordingStartTime) / 1000;
        }
        
        await addEvidence({
          caseId: activeCase.id,
          type: "video",
          uri: video.uri,
          timestamp: new Date(recordStartTime).toISOString(),
          absoluteTimestamp: recordStartTime,
          relativeTimestamp,
          duration: (recordEndTime - recordStartTime) / 1000,
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <ThemedText style={styles.loadingText}>Loading investigation...</ThemedText>
        </View>
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
  const pendingCount = pendingAnalysisList.length;

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.caseInfo}>
            <ThemedText style={styles.caseId}>{activeCase.caseId}</ThemedText>
            <ThemedText style={styles.caseTitle} numberOfLines={1}>
              {activeCase.title}
            </ThemedText>
          </View>
          {isRecording ? (
            <RecordingIndicator duration={recordingDuration} isRecording={isRecording} />
          ) : null}
        </Animated.View>

        {permissionsGranted ? (
          <Animated.View entering={FadeIn.duration(300).delay(100)} style={styles.cameraWrapper}>
            <GestureHandlerRootView style={styles.cameraGestureWrapper}>
              <GestureDetector gesture={composedGesture}>
                <View style={styles.cameraContainer}>
                  <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                    zoom={zoom.value}
                    mode="video"
                  />
                  {!isRecording ? (
                    <View style={styles.cameraOverlay}>
                      <Feather name="video-off" size={32} color={Colors.dark.textTertiary} />
                      <ThemedText style={styles.overlayText}>Camera on standby</ThemedText>
                    </View>
                  ) : null}
                  {isVideoRecording ? (
                    <View style={styles.videoRecordingOverlay}>
                      <View style={styles.recordingDot} />
                      <ThemedText style={styles.recordingText}>REC</ThemedText>
                    </View>
                  ) : null}
                  {isCapturing ? (
                    <View style={styles.capturingOverlay}>
                      <ActivityIndicator size="small" color={Colors.dark.text} />
                    </View>
                  ) : null}
                  
                  <View style={styles.cameraControls}>
                    <Pressable onPress={handleToggleCamera} style={styles.cameraControlButton}>
                      <Feather name="refresh-cw" size={18} color={Colors.dark.text} />
                    </Pressable>
                  </View>
                  
                  <View style={styles.zoomIndicator}>
                    <ThemedText style={styles.zoomText}>
                      {(1 + zoom.value * 4).toFixed(1)}x
                    </ThemedText>
                  </View>
                </View>
              </GestureDetector>
            </GestureHandlerRootView>
          </Animated.View>
        ) : (
          <View style={styles.permissionContainer}>
            <Feather name="camera-off" size={48} color={Colors.dark.textTertiary} />
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
                  variant="secondary"
                >
                  Open Settings
                </Button>
              ) : null
            ) : (
              <Button onPress={requestCameraPermission} variant="primary">
                Enable Camera
              </Button>
            )}
          </View>
        )}

        <Animated.View entering={FadeIn.duration(300).delay(200)} style={styles.controlsContainer}>
          {!isRecording ? (
            <Button 
              onPress={handleStartInvestigation} 
              variant="primary"
              testID="button-start-investigation"
            >
              Start Investigation
            </Button>
          ) : (
            <>
              {pendingCount > 0 ? (
                <View style={styles.pendingBadge}>
                  <Feather name="clock" size={14} color={Colors.dark.warning} />
                  <ThemedText style={styles.pendingText}>
                    {pendingCount} photo{pendingCount > 1 ? "s" : ""} pending AI analysis
                  </ThemedText>
                </View>
              ) : null}
              
              <View style={styles.evidenceButtonsRow}>
                <EvidenceButton
                  icon="file-text"
                  label="Note"
                  onPress={handleAddNote}
                  testID="button-add-note"
                />
                <EvidenceButton
                  icon="camera"
                  label="Photo"
                  onPress={handleCapturePhoto}
                  variant="primary"
                  disabled={isCapturing}
                  testID="button-capture-photo"
                />
                <EvidenceButton
                  icon="mic"
                  label="Audio"
                  onPress={handleRecordAudio}
                  testID="button-record-audio"
                />
              </View>
              
              {Platform.OS !== "web" ? (
                <View style={styles.videoControlsRow}>
                  {!isVideoRecording ? (
                    <Pressable 
                      onPress={handleStartVideoRecording} 
                      style={styles.videoButton}
                    >
                      <Feather name="video" size={18} color={Colors.dark.text} />
                      <ThemedText style={styles.videoButtonText}>Record Video</ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable 
                      onPress={handleStopVideoRecording} 
                      style={[styles.videoButton, styles.videoStopButton]}
                    >
                      <View style={styles.stopIcon} />
                      <ThemedText style={styles.videoButtonText}>Stop Recording</ThemedText>
                    </Pressable>
                  )}
                </View>
              ) : null}
              
              <Pressable
                onPress={handleStopInvestigation}
                style={styles.stopInvestigationButton}
                testID="button-stop-investigation"
              >
                <Feather name="square" size={16} color={Colors.dark.error} />
                <ThemedText style={styles.stopInvestigationText}>Stop Investigation</ThemedText>
              </Pressable>
            </>
          )}
        </Animated.View>

        {isProcessingAnalysis ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color={Colors.dark.accent} />
            <ThemedText style={styles.processingText}>Processing AI analysis...</ThemedText>
          </View>
        ) : null}

        {recentEvidence.length > 0 ? (
          <Animated.View entering={FadeIn.duration(300).delay(300)} style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Recent Evidence</ThemedText>
              <View style={styles.countBadge}>
                <ThemedText style={styles.countText}>{recentEvidence.length}</ThemedText>
              </View>
            </View>
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
          </Animated.View>
        ) : isRecording ? (
          <View style={styles.noEvidenceHint}>
            <Feather name="info" size={16} color={Colors.dark.textTertiary} />
            <ThemedText style={styles.noEvidenceText}>
              Use the buttons above to capture evidence
            </ThemedText>
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
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  caseId: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.accent,
    letterSpacing: 0.5,
  },
  caseTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 2,
  },
  cameraWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  cameraGestureWrapper: {
    flex: 1,
  },
  cameraContainer: {
    height: 220,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  overlayText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  videoRecordingOverlay: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.text,
  },
  recordingText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  capturingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraControls: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
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
    borderRadius: BorderRadius.sm,
  },
  zoomText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  permissionContainer: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.lg,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  controlsContainer: {
    gap: Spacing.md,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(255, 167, 38, 0.1)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 167, 38, 0.3)",
  },
  pendingText: {
    fontSize: 13,
    color: Colors.dark.warning,
    fontWeight: "500",
  },
  evidenceButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  videoControlsRow: {
    alignItems: "center",
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  videoStopButton: {
    backgroundColor: Colors.dark.error,
    borderColor: Colors.dark.error,
  },
  stopIcon: {
    width: 14,
    height: 14,
    backgroundColor: Colors.dark.text,
    borderRadius: 2,
  },
  videoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  stopInvestigationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.error,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  stopInvestigationText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.error,
  },
  processingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  processingText: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
  recentSection: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  countBadge: {
    backgroundColor: Colors.dark.backgroundTertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  recentList: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  noEvidenceHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  noEvidenceText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
});
