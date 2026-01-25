import React, { useState, useRef } from "react";
import { View, StyleSheet, Dimensions, Pressable, Platform } from "react-native";
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
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { format } from "date-fns";
import type { Evidence } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProp = NativeStackScreenProps<RootStackParamList, "EvidenceViewer">["route"];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EvidenceViewerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp>();
  const { evidence } = route.params;

  const [showControls, setShowControls] = useState(true);

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

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
            {evidence.latitude && evidence.longitude ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={Colors.dark.textSecondary} />
                <ThemedText style={styles.locationText}>
                  {evidence.latitude.toFixed(6)}, {evidence.longitude.toFixed(6)}
                </ThemedText>
              </View>
            ) : null}

            {evidence.aiAnalysis ? (
              <View style={styles.aiAnalysisContainer}>
                <View style={styles.aiHeader}>
                  <Feather name="cpu" size={14} color={Colors.dark.accent} />
                  <ThemedText style={styles.aiLabel}>AI Analysis</ThemedText>
                </View>
                <ThemedText style={styles.aiContent}>{evidence.aiAnalysis}</ThemedText>
              </View>
            ) : null}

            {evidence.detectedObjects && evidence.detectedObjects.length > 0 ? (
              <View style={styles.objectsContainer}>
                <ThemedText style={styles.objectsLabel}>Detected Objects:</ThemedText>
                <View style={styles.objectTags}>
                  {evidence.detectedObjects.map((obj, index) => (
                    <View key={index} style={styles.objectTag}>
                      <ThemedText style={styles.objectText}>
                        {obj.label} ({Math.round(obj.confidence * 100)}%)
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {evidence.type === "photo" ? (
              <ThemedText style={styles.hint}>
                Pinch to zoom, double-tap to toggle zoom
              </ThemedText>
            ) : null}
          </View>
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
    height: SCREEN_HEIGHT * 0.7,
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
    backgroundColor: "rgba(10, 25, 41, 0.9)",
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
  aiAnalysisContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  aiContent: {
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  objectsContainer: {
    gap: Spacing.sm,
  },
  objectsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  objectTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  objectTag: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  objectText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dark.buttonText,
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
