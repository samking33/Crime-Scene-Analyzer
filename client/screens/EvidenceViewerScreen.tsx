import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Dimensions, Pressable, Platform, ScrollView, ActivityIndicator, LayoutChangeEvent } from "react-native";
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
import * as FileSystem from "expo-file-system/legacy";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { format } from "date-fns";
import { analyzeImage } from "@/lib/ai";
import { updateEvidence } from "@/lib/storage";
import { saveCategorizedObjects, CategorizedObject } from "@/lib/categories";
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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const normalizeBoundingBox = (
  box: { x: number; y: number; width: number; height: number },
  imageSourceSize: { width: number; height: number } | null,
) => {
  let { x, y, width, height } = box;

  if (imageSourceSize && Math.max(x, y, width, height) > 1.5) {
    x = x / imageSourceSize.width;
    y = y / imageSourceSize.height;
    width = width / imageSourceSize.width;
    height = height / imageSourceSize.height;
  }

  x = clamp01(x);
  y = clamp01(y);
  width = clamp01(width);
  height = clamp01(height);

  if (x + width > 1) width = 1 - x;
  if (y + height > 1) height = 1 - y;

  return { x, y, width, height };
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
  const [showAnnotated, setShowAnnotated] = useState(Boolean(initialEvidence.annotatedImageUri));
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.5 });
  const [imageSourceSize, setImageSourceSize] = useState<{ width: number; height: number } | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const player = evidence.type === "video" && evidence.uri
    ? useVideoPlayer(evidence.uri, (p) => {
        p.loop = false;
        p.muted = isMuted;
      })
    : null;

  React.useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [player, isMuted]);

  React.useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setIsPlaying(player.playing);
    }, 100);
    return () => clearInterval(interval);
  }, [player]);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handlePlayPause = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    triggerHaptic();
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    triggerHaptic();
  };

  const handleSeek = (forward: boolean) => {
    if (!player) return;
    const step = forward ? 10 : -10;
    const duration = evidence.duration || 60;
    const newTime = Math.max(0, Math.min(duration, player.currentTime + step));
    player.currentTime = newTime;
    triggerHaptic();
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
        let annotatedImageUri: string | undefined;
        
        if (result.annotatedImage) {
          const docDir = FileSystem.documentDirectory || "";
          const annotatedPath = `${docDir}${evidence.caseId}/annotated_${evidence.id}.jpg`;
          await FileSystem.makeDirectoryAsync(`${docDir}${evidence.caseId}`, { intermediates: true }).catch(() => {});
          await FileSystem.writeAsStringAsync(annotatedPath, result.annotatedImage, {
            encoding: "base64",
          });
          annotatedImageUri = annotatedPath;
        }
        
        const updatedEvidence = await updateEvidence(evidence.id, {
          detectedObjects: result.detectedObjects,
          aiSummary: result.aiSummary,
          aiAnalysis: result.analysis,
          analysisStatus: "completed",
          annotatedImageUri,
        });
        if (updatedEvidence) {
          setEvidence(updatedEvidence);
          if (annotatedImageUri) {
            setShowAnnotated(true);
          } else {
            setShowAnnotated(false);
            setShowOverlay(true);
          }
        }
        
        if (result.detectedObjects && result.detectedObjects.length > 0) {
          const categoryNameToId: Record<string, number> = {
            weapon: 1, vehicle: 2, person: 3, biometric: 4, drug: 5,
            document: 6, electronics: 7, markers: 8, tools: 9, other: 10,
          };
          
          const categorizedObjects: CategorizedObject[] = result.detectedObjects.map((obj: DetectedObject) => ({
            id: obj.id,
            evidenceId: evidence.id,
            evidenceUri: evidence.uri,
            objectName: obj.label,
            confidence: obj.confidence,
            location: obj.location,
            categoryId: obj.categoryId || categoryNameToId[obj.category] || 10,
            categoryName: obj.category,
            detectedAt: Date.now(),
          }));
          
          await saveCategorizedObjects(evidence.caseId, categorizedObjects);
        }
      }
    } catch (error) {
      console.error("Re-analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [evidence.id, evidence.uri, evidence.type, evidence.caseId]);

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

  const handleImageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) {
      setImageLayout({ width, height });
    }
  };

  const handleImageLoad = (event: { source?: { width: number; height: number } }) => {
    const width = event?.source?.width;
    const height = event?.source?.height;
    if (width && height) {
      setImageSourceSize({ width, height });
    }
  };

  const imageDisplayRect = useMemo(() => {
    if (!imageSourceSize) {
      return {
        width: imageLayout.width,
        height: imageLayout.height,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const scale = Math.min(
      imageLayout.width / imageSourceSize.width,
      imageLayout.height / imageSourceSize.height,
    );
    const width = imageSourceSize.width * scale;
    const height = imageSourceSize.height * scale;
    const offsetX = (imageLayout.width - width) / 2;
    const offsetY = (imageLayout.height - height) / 2;

    return { width, height, offsetX, offsetY };
  }, [imageLayout, imageSourceSize]);

  const getConfidenceCount = (level: "high" | "medium" | "low") => {
    return evidence.detectedObjects?.filter(obj => obj.confidence === level).length || 0;
  };

  const renderObjectOverlay = (obj: DetectedObject, index: number) => {
    const color = CATEGORY_COLORS[obj.category] || CATEGORY_COLORS.other;
    const displayRect = imageDisplayRect;

    if (obj.boundingBox && displayRect) {
      const normalized = normalizeBoundingBox(obj.boundingBox, imageSourceSize);
      const left = displayRect.offsetX + normalized.x * displayRect.width;
      const top = displayRect.offsetY + normalized.y * displayRect.height;
      const width = normalized.width * displayRect.width;
      const height = normalized.height * displayRect.height;

      return (
        <View
          key={obj.id || index}
          style={[
            styles.boundingBox,
            {
              top,
              left,
              width,
              height,
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
    }

    const position = LOCATION_POSITIONS[obj.location] || LOCATION_POSITIONS.center;
    
    return (
      <View
        key={obj.id || index}
        style={[
          styles.boundingBox,
          {
            top: position.top as any,
            left: position.left as any,
            width: "28%",
            height: "18%",
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
        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={styles.media}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
            nativeControls={false}
          />
          {showControls ? (
            <View style={styles.videoControlsOverlay}>
              <View style={styles.videoControlsRow}>
                <Pressable onPress={() => handleSeek(false)} style={styles.videoControlButton}>
                  <Feather name="rewind" size={20} color={Colors.dark.text} />
                </Pressable>
                <Pressable onPress={handlePlayPause} style={styles.videoPlayButton}>
                  <Feather name={isPlaying ? "pause" : "play"} size={28} color={Colors.dark.text} />
                </Pressable>
                <Pressable onPress={() => handleSeek(true)} style={styles.videoControlButton}>
                  <Feather name="fast-forward" size={20} color={Colors.dark.text} />
                </Pressable>
              </View>
              <View style={styles.videoBottomControls}>
                <Pressable onPress={handleMuteToggle} style={[styles.muteButton, isMuted && styles.muteButtonActive]}>
                  <Feather name={isMuted ? "volume-x" : "volume-2"} size={18} color={isMuted ? Colors.dark.error : Colors.dark.text} />
                </Pressable>
                {evidence.duration ? (
                  <ThemedText style={styles.videoDuration}>
                    {Math.floor(evidence.duration / 60)}:{Math.floor(evidence.duration % 60).toString().padStart(2, "0")}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      );
    }

    if (evidence.type === "photo" && evidence.uri) {
      const displayUri = showAnnotated && evidence.annotatedImageUri ? evidence.annotatedImageUri : evidence.uri;
      
      return (
        <GestureHandlerRootView style={styles.gestureContainer}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: displayUri }}
                style={styles.media}
                contentFit="contain"
                onLayout={handleImageLayout}
                onLoad={handleImageLoad}
              />
              {!showAnnotated && showOverlay && evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
                <View style={styles.overlayContainer} pointerEvents="none">
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
            {evidence.type === "photo" && evidence.annotatedImageUri ? (
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setShowAnnotated(!showAnnotated);
                }}
                style={[styles.overlayToggle, showAnnotated && styles.overlayToggleActive]}
              >
                <Feather name={showAnnotated ? "layers" : "image"} size={14} color={Colors.dark.text} />
                <ThemedText style={styles.overlayToggleText}>
                  {showAnnotated ? "Annotated" : "Original"}
                </ThemedText>
              </Pressable>
            ) : null}
            {evidence.type === "photo" && !showAnnotated && evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
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
  videoWrapper: {
    flex: 1,
    position: "relative",
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
  },
  videoControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBottomControls: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  muteButtonActive: {
    backgroundColor: "rgba(239,83,80,0.3)",
  },
  videoDuration: {
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
