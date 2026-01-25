import React, { useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
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
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { format } from "date-fns";
import { analyzeImage } from "@/lib/ai";
import { updateEvidence } from "@/lib/storage";
import type { Evidence, DetectedObject, ObjectCategory } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProp = NativeStackScreenProps<RootStackParamList, "EvidenceViewer">["route"];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORY_COLORS: Record<ObjectCategory, string> = {
  weapon: "#D32F2F",
  vehicle: "#F57C00",
  person: "#1976D2",
  document: "#388E3C",
  drug: "#C62828",
  biometric: "#7B1FA2",
  electronics: "#00796B",
  markers: "#FBC02D",
  tools: "#5D4037",
  other: "#616161",
};

const LOCATION_POSITIONS: Record<string, { top: string; left: string }> = {
  "top-left": { top: "5%", left: "5%" },
  "top-center": { top: "5%", left: "35%" },
  "top-right": { top: "5%", left: "65%" },
  "center-left": { top: "40%", left: "5%" },
  "center": { top: "40%", left: "35%" },
  "center-right": { top: "40%", left: "65%" },
  "bottom-left": { top: "75%", left: "5%" },
  "bottom-center": { top: "75%", left: "35%" },
  "bottom-right": { top: "75%", left: "65%" },
};

export default function EvidenceViewerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp>();
  const { evidence: initialEvidence } = route.params;

  const [evidence, setEvidence] = useState<Evidence>(initialEvidence);
  const [showControls, setShowControls] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const player = evidence.type === "video" && evidence.uri
    ? useVideoPlayer(evidence.uri, (p) => {
        p.loop = false;
      })
    : null;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleReanalyze = useCallback(async () => {
    if (!evidence.uri || evidence.type !== "photo") return;
    
    setIsAnalyzing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(evidence.uri, {
        encoding: "base64",
      });
      
      const result = await analyzeImage(base64);
      if (result) {
        const updatedEvidence = await updateEvidence(evidence.id, {
          detectedObjects: result.detectedObjects,
          aiSummary: result.aiSummary,
          aiAnalysis: result.analysis,
          analysisStatus: "completed",
        });
        if (updatedEvidence) {
          setEvidence(updatedEvidence);
        }
      }
    } catch (error) {
      console.error("Re-analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [evidence.id, evidence.uri, evidence.type]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
      runOnJS(triggerHaptic)();
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
      runOnJS(triggerHaptic)();
    });

  const singleTapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(toggleControls)();
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    navigation.goBack();
  };

  const getConfidenceCount = (level: "high" | "medium" | "low") => {
    return evidence.detectedObjects?.filter(obj => obj.confidence === level).length || 0;
  };

  const renderObjectOverlay = (obj: DetectedObject, index: number) => {
    const position = LOCATION_POSITIONS[obj.location] || LOCATION_POSITIONS.center;
    const color = CATEGORY_COLORS[obj.category] || CATEGORY_COLORS.other;
    
    return (
      <View
        key={obj.id || index}
        style={[
          styles.boundingBox,
          {
            top: position.top as any,
            left: position.left as any,
            borderColor: color,
          },
        ]}
      >
        <View style={[styles.objectLabel, { backgroundColor: color }]}>
          <ThemedText style={styles.objectLabelText} numberOfLines={1}>
            {obj.label} - {obj.confidence.charAt(0).toUpperCase() + obj.confidence.slice(1)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (evidence.type === "video" && player) {
      return (
        <VideoView
          player={player}
          style={styles.media}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
        />
      );
    }

    if (evidence.type === "photo" && evidence.uri) {
      return (
        <GestureHandlerRootView style={styles.gestureContainer}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: evidence.uri }}
                style={styles.media}
                contentFit="contain"
              />
              {showOverlay && evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
                <View style={styles.overlayContainer}>
                  {evidence.detectedObjects.map((obj, index) => renderObjectOverlay(obj, index))}
                </View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      );
    }

    if (evidence.type === "note") {
      return (
        <View style={styles.noteContainer}>
          <ThemedText style={styles.noteContent}>{evidence.content}</ThemedText>
        </View>
      );
    }

    if (evidence.type === "audio") {
      return (
        <View style={styles.audioContainer}>
          <Feather name="mic" size={64} color={Colors.dark.accent} />
          <ThemedText style={styles.audioText}>Audio Recording</ThemedText>
          <ThemedText style={styles.audioDuration}>
            Duration: {evidence.duration ? `${Math.floor(evidence.duration / 60)}:${(evidence.duration % 60).toString().padStart(2, "0")}` : "Unknown"}
          </ThemedText>
        </View>
      );
    }

    return null;
  };

  const renderAnalysisCard = () => {
    if (evidence.type !== "photo") return null;

    const objectCount = evidence.detectedObjects?.length || 0;
    const highCount = getConfidenceCount("high");
    const mediumCount = getConfidenceCount("medium");
    const lowCount = getConfidenceCount("low");

    return (
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <View style={styles.analysisHeaderLeft}>
            <Feather name="cpu" size={16} color={Colors.dark.accent} />
            <ThemedText style={styles.analysisTitle}>AI Analysis</ThemedText>
          </View>
          <View style={styles.analysisActions}>
            {evidence.type === "photo" && evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
              <Pressable
                onPress={() => setShowOverlay(!showOverlay)}
                style={[styles.overlayToggle, showOverlay && styles.overlayToggleActive]}
              >
                <Feather name={showOverlay ? "eye" : "eye-off"} size={14} color={Colors.dark.text} />
                <ThemedText style={styles.overlayToggleText}>
                  {showOverlay ? "Hide" : "Show"}
                </ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleReanalyze}
              style={styles.reanalyzeButton}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={Colors.dark.accent} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color={Colors.dark.accent} />
                  <ThemedText style={styles.reanalyzeText}>Re-analyze</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.accent} />
            <ThemedText style={styles.analyzingText}>Analyzing with AI...</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{objectCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Objects</ThemedText>
              </View>
              <View style={[styles.statBox, styles.statBoxSmall]}>
                <View style={[styles.confidenceDot, { backgroundColor: "#44CC44" }]} />
                <ThemedText style={styles.statValue}>{highCount}</ThemedText>
                <ThemedText style={styles.statLabelSmall}>High</ThemedText>
              </View>
              <View style={[styles.statBox, styles.statBoxSmall]}>
                <View style={[styles.confidenceDot, { backgroundColor: "#FFCC00" }]} />
                <ThemedText style={styles.statValue}>{mediumCount}</ThemedText>
                <ThemedText style={styles.statLabelSmall}>Medium</ThemedText>
              </View>
              <View style={[styles.statBox, styles.statBoxSmall]}>
                <View style={[styles.confidenceDot, { backgroundColor: "#FF6644" }]} />
                <ThemedText style={styles.statValue}>{lowCount}</ThemedText>
                <ThemedText style={styles.statLabelSmall}>Low</ThemedText>
              </View>
            </View>

            {evidence.aiSummary ? (
              <View style={styles.summaryContainer}>
                <ThemedText style={styles.summaryText}>{evidence.aiSummary}</ThemedText>
              </View>
            ) : evidence.aiAnalysis ? (
              <View style={styles.summaryContainer}>
                <ThemedText style={styles.summaryText}>{evidence.aiAnalysis}</ThemedText>
              </View>
            ) : null}

            {objectCount > 0 ? (
              <Pressable
                onPress={() => setShowDetails(!showDetails)}
                style={styles.viewDetailsButton}
              >
                <ThemedText style={styles.viewDetailsText}>
                  {showDetails ? "Hide Details" : "View Details"}
                </ThemedText>
                <Feather
                  name={showDetails ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.dark.accent}
                />
              </Pressable>
            ) : null}

            {showDetails && evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
              <View style={styles.detailsList}>
                {evidence.detectedObjects.map((obj, index) => (
                  <View key={obj.id || index} style={styles.detailItem}>
                    <View
                      style={[
                        styles.categoryIndicator,
                        { backgroundColor: CATEGORY_COLORS[obj.category] || CATEGORY_COLORS.other },
                      ]}
                    />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>{obj.label}</ThemedText>
                      <ThemedText style={styles.detailMeta}>
                        {obj.confidence} confidence • {obj.location.replace("-", " ")}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderContent()}

      {showControls ? (
        <>
          <View style={[styles.header, { top: insets.top + Spacing.md }]}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.evidenceType}>
                {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
              </ThemedText>
              <ThemedText style={styles.timestamp}>
                {format(new Date(evidence.timestamp), "MMM d, yyyy HH:mm")}
              </ThemedText>
            </View>
          </View>

          <ScrollView
            style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
            contentContainerStyle={styles.footerContent}
            showsVerticalScrollIndicator={false}
          >
            {evidence.latitude && evidence.longitude ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={Colors.dark.textSecondary} />
                <ThemedText style={styles.locationText}>
                  {evidence.latitude.toFixed(6)}, {evidence.longitude.toFixed(6)}
                </ThemedText>
              </View>
            ) : null}

            {renderAnalysisCard()}

            {evidence.type === "photo" ? (
              <ThemedText style={styles.hint}>
                Pinch to zoom, double-tap to toggle zoom
              </ThemedText>
            ) : null}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  gestureContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: "absolute",
    width: "28%",
    height: "18%",
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  objectLabel: {
    position: "absolute",
    top: -20,
    left: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  objectLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  noteContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  noteContent: {
    fontSize: 18,
    color: Colors.dark.text,
    lineHeight: 28,
  },
  audioContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  audioText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  audioDuration: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  header: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  evidenceType: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.45,
    backgroundColor: "rgba(10, 25, 41, 0.95)",
  },
  footerContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  analysisCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analysisHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  analysisActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  overlayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  overlayToggleActive: {
    backgroundColor: Colors.dark.primary,
  },
  overlayToggleText: {
    fontSize: 11,
    color: Colors.dark.text,
  },
  reanalyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  reanalyzeText: {
    fontSize: 11,
    color: Colors.dark.accent,
  },
  analyzingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.dark.accent,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: Spacing.sm,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  statBoxSmall: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statLabelSmall: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  summaryContainer: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.accent,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  viewDetailsText: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: "500",
  },
  detailsList: {
    gap: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  categoryIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    minHeight: 32,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  detailMeta: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
