import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ScrollView, Dimensions, PanResponder } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { 
  formatTimecode, 
  formatRelativeTimestamp,
  formatAbsoluteTime,
  calculateMarkerPosition,
  getTimelineEvents,
  generateTimeTickMarks,
  getCategoryColor,
  getNextEvidence,
  getPreviousEvidence,
} from "@/lib/timeline";
import type { Case, Evidence, TimelineEvent } from "@/types/case";

interface TimelineViewProps {
  caseData: Case;
  evidence: Evidence[];
  onEvidencePress: (evidence: Evidence) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const TIMELINE_PADDING = Spacing.screenPadding * 2;
const TIMELINE_WIDTH = SCREEN_WIDTH - TIMELINE_PADDING;

export function TimelineView({ caseData, evidence, onEvidencePress }: TimelineViewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const [activePhoto, setActivePhoto] = useState<Evidence | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  const timelineRef = useRef<View>(null);
  const timelineLayoutRef = useRef({ x: 0, width: 0 });
  
  const hasBackgroundVideo = Boolean(caseData.backgroundVideoUri);
  const totalDuration = caseData.backgroundVideoDuration || 0;
  
  const photos = evidence
    .filter((e) => e.type === "photo" && e.relativeTimestamp !== undefined)
    .sort((a, b) => (a.relativeTimestamp || 0) - (b.relativeTimestamp || 0));
  
  const timelineEvents = getTimelineEvents(caseData, evidence);
  const tickMarks = generateTimeTickMarks(totalDuration, totalDuration > 1800 ? 600 : 300);
  
  const player = useVideoPlayer(
    hasBackgroundVideo ? caseData.backgroundVideoUri! : null,
    (p) => {
      p.loop = false;
      p.playbackRate = playbackSpeed;
      p.muted = isMuted;
    }
  );

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [player, isMuted]);

  useEffect(() => {
    if (!player) return;
    
    const interval = setInterval(() => {
      if (!isScrubbing) {
        if (player.playing) {
          setCurrentTime(player.currentTime);
          setIsPlaying(true);
          
          const nearbyPhoto = photos.find((p) => {
            const photoTime = p.relativeTimestamp || 0;
            return Math.abs(photoTime - player.currentTime) < 1;
          });
          if (nearbyPhoto && nearbyPhoto.id !== activePhoto?.id) {
            setActivePhoto(nearbyPhoto);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setIsPlaying(false);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [player, photos, activePhoto, isScrubbing]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [player]);

  const handleSeekToTime = useCallback((seconds: number) => {
    if (!player) return;
    const clampedTime = Math.max(0, Math.min(totalDuration, seconds));
    player.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [player, totalDuration]);

  const handleSeekForward = useCallback(() => {
    const newTime = Math.min(totalDuration, currentTime + 10);
    handleSeekToTime(newTime);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentTime, totalDuration, handleSeekToTime]);

  const handleSeekBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeekToTime(newTime);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentTime, handleSeekToTime]);

  const handleMarkerPress = useCallback((evidence: Evidence) => {
    if (evidence.relativeTimestamp !== undefined) {
      handleSeekToTime(evidence.relativeTimestamp);
      setActivePhoto(evidence);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [handleSeekToTime]);

  const handleNextEvidence = useCallback(() => {
    const next = getNextEvidence(evidence, currentTime);
    if (next && next.relativeTimestamp !== undefined) {
      handleSeekToTime(next.relativeTimestamp);
      setActivePhoto(next);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [evidence, currentTime, handleSeekToTime]);

  const handlePreviousEvidence = useCallback(() => {
    const prev = getPreviousEvidence(evidence, currentTime);
    if (prev && prev.relativeTimestamp !== undefined) {
      handleSeekToTime(prev.relativeTimestamp);
      setActivePhoto(prev);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [evidence, currentTime, handleSeekToTime]);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (player) {
      player.playbackRate = nextSpeed;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [player, playbackSpeed]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isMuted]);

  const handleFrameStep = useCallback((forward: boolean) => {
    if (!player) return;
    const step = forward ? 1 / 30 : -1 / 30;
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + step));
    player.currentTime = newTime;
    setCurrentTime(newTime);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [player, currentTime, totalDuration]);

  const handleTimelineLayout = (event: any) => {
    timelineLayoutRef.current = {
      x: event.nativeEvent.layout.x,
      width: event.nativeEvent.layout.width,
    };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsScrubbing(true);
      if (player?.playing) {
        player.pause();
      }
      const locationX = evt.nativeEvent.locationX;
      const progress = Math.max(0, Math.min(1, locationX / timelineLayoutRef.current.width));
      const newTime = progress * totalDuration;
      handleSeekToTime(newTime);
    },
    onPanResponderMove: (evt) => {
      const locationX = evt.nativeEvent.locationX;
      const progress = Math.max(0, Math.min(1, locationX / timelineLayoutRef.current.width));
      const newTime = progress * totalDuration;
      handleSeekToTime(newTime);
    },
    onPanResponderRelease: () => {
      setIsScrubbing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onPanResponderTerminate: () => {
      setIsScrubbing(false);
    },
  });

  const renderPhotoMarker = (photo: Evidence) => {
    if (photo.relativeTimestamp === undefined) return null;
    
    const position = calculateMarkerPosition(photo.relativeTimestamp, totalDuration);
    const primaryCategory = photo.detectedObjects?.[0]?.category;
    const markerColor = getCategoryColor(primaryCategory);
    const isActive = activePhoto?.id === photo.id;
    
    return (
      <Pressable
        key={photo.id}
        onPress={() => handleMarkerPress(photo)}
        style={[
          styles.marker,
          {
            left: `${position * 100}%`,
            backgroundColor: markerColor,
            borderColor: isActive ? Colors.dark.text : "transparent",
            transform: [{ scale: isActive ? 1.3 : 1 }],
          },
        ]}
      >
        <Feather name="camera" size={8} color={Colors.dark.text} />
      </Pressable>
    );
  };

  const renderTimelineBar = () => (
    <View style={styles.timelineBarContainer}>
      <View 
        ref={timelineRef}
        style={styles.timelineBar}
        onLayout={handleTimelineLayout}
        {...panResponder.panHandlers}
      >
        <View 
          style={[
            styles.timelineProgress,
            { width: `${(currentTime / totalDuration) * 100}%` },
          ]}
        />
        
        {photos.map(renderPhotoMarker)}
        
        <View 
          style={[
            styles.playhead,
            { left: `${(currentTime / totalDuration) * 100}%` },
          ]}
        />
      </View>
      
      <View style={styles.tickMarksContainer}>
        {tickMarks.map((tick, index) => (
          <Pressable
            key={index}
            onPress={() => handleSeekToTime(tick.position * totalDuration)}
            style={[styles.tickMark, { left: `${tick.position * 100}%` }]}
          >
            <View style={styles.tickLine} />
            <ThemedText style={styles.tickLabel}>{tick.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      
      <ThemedText style={styles.scrubHint}>
        Drag to scrub through timeline
      </ThemedText>
    </View>
  );

  const renderPlaybackControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.controlsRow}>
        <Pressable onPress={handleSeekBackward} style={styles.controlButton}>
          <Feather name="rewind" size={18} color={Colors.dark.text} />
          <ThemedText style={styles.seekLabel}>10s</ThemedText>
        </Pressable>
        
        <Pressable onPress={handlePreviousEvidence} style={styles.controlButton}>
          <Feather name="skip-back" size={18} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={() => handleFrameStep(false)} style={styles.controlButtonSmall}>
          <Feather name="chevron-left" size={18} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={handlePlayPause} style={styles.playButton}>
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={24} 
            color={Colors.dark.text} 
          />
        </Pressable>
        
        <Pressable onPress={() => handleFrameStep(true)} style={styles.controlButtonSmall}>
          <Feather name="chevron-right" size={18} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={handleNextEvidence} style={styles.controlButton}>
          <Feather name="skip-forward" size={18} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={handleSeekForward} style={styles.controlButton}>
          <Feather name="fast-forward" size={18} color={Colors.dark.text} />
          <ThemedText style={styles.seekLabel}>10s</ThemedText>
        </Pressable>
      </View>
      
      <View style={styles.controlsSecondRow}>
        <View style={styles.leftControls}>
          <Pressable onPress={handleSpeedChange} style={styles.speedButton}>
            <ThemedText style={styles.speedText}>{playbackSpeed}x</ThemedText>
          </Pressable>
          
          <Pressable onPress={handleMuteToggle} style={[styles.muteButton, isMuted && styles.muteButtonActive]}>
            <Feather name={isMuted ? "volume-x" : "volume-2"} size={16} color={isMuted ? Colors.dark.error : Colors.dark.text} />
          </Pressable>
        </View>
        
        <View style={styles.timeDisplay}>
          <ThemedText style={styles.timeText}>
            {formatTimecode(currentTime, true)} / {formatTimecode(totalDuration, true)}
          </ThemedText>
        </View>
        
        <Pressable 
          onPress={() => setIsSplitScreen(!isSplitScreen)} 
          style={[styles.splitButton, isSplitScreen && styles.splitButtonActive]}
        >
          <Feather name="columns" size={16} color={Colors.dark.text} />
        </Pressable>
      </View>
    </View>
  );

  const renderPhotoThumbnails = () => (
    <View style={styles.thumbnailsContainer}>
      <ThemedText style={styles.thumbnailsTitle}>Photos ({photos.length})</ThemedText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailsScroll}
      >
        {photos.map((photo) => {
          const isActive = activePhoto?.id === photo.id;
          return (
            <Pressable
              key={photo.id}
              onPress={() => {
                handleMarkerPress(photo);
                onEvidencePress(photo);
              }}
              style={[styles.thumbnailItem, isActive && styles.thumbnailItemActive]}
            >
              {photo.uri ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Feather name="image" size={20} color={Colors.dark.textSecondary} />
                </View>
              )}
              <View style={styles.thumbnailInfo}>
                <ThemedText style={styles.thumbnailTimecode}>
                  {formatTimecode(photo.relativeTimestamp || 0)}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEventList = () => (
    <View style={styles.eventListContainer}>
      <Pressable 
        onPress={() => setShowEventList(!showEventList)}
        style={styles.eventListHeader}
      >
        <ThemedText style={styles.eventListTitle}>Events ({timelineEvents.length})</ThemedText>
        <Feather 
          name={showEventList ? "chevron-up" : "chevron-down"} 
          size={18} 
          color={Colors.dark.textSecondary} 
        />
      </Pressable>
      
      {showEventList ? (
        <ScrollView style={styles.eventList} nestedScrollEnabled>
          {timelineEvents.map((event, index) => (
            <Pressable
              key={event.id}
              onPress={() => {
                if (event.relativeTimestamp !== undefined) {
                  handleSeekToTime(event.relativeTimestamp);
                }
                if (event.evidenceId) {
                  const evidenceItem = evidence.find((e) => e.id === event.evidenceId);
                  if (evidenceItem) {
                    setActivePhoto(evidenceItem);
                  }
                }
              }}
              style={styles.eventItem}
            >
              <View 
                style={[
                  styles.eventDot,
                  { backgroundColor: getCategoryColor(event.category) },
                ]}
              />
              <View style={styles.eventContent}>
                <ThemedText style={styles.eventLabel}>{event.label}</ThemedText>
                <ThemedText style={styles.eventTime}>
                  {formatAbsoluteTime(event.timestamp)}
                  {event.relativeTimestamp !== undefined ? ` (${formatRelativeTimestamp(event.relativeTimestamp)})` : ""}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const renderSplitView = () => (
    <View style={styles.splitContainer}>
      <View style={styles.splitVideoContainer}>
        {hasBackgroundVideo && player ? (
          <VideoView
            player={player}
            style={styles.splitVideo}
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <View style={styles.noVideoPlaceholder}>
            <Feather name="video-off" size={28} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.noVideoText}>No video</ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.splitPhotoContainer}>
        {activePhoto?.uri ? (
          <Image
            source={{ uri: activePhoto.uri }}
            style={styles.splitPhoto}
            contentFit="contain"
          />
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <Feather name="image" size={28} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.noPhotoText}>Select photo</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  if (!hasBackgroundVideo && photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="clock" size={48} color={Colors.dark.textTertiary} />
        <ThemedText style={styles.emptyTitle}>No Timeline Data</ThemedText>
        <ThemedText style={styles.emptyText}>
          Start an investigation with background recording to capture timeline data
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isSplitScreen ? (
        renderSplitView()
      ) : hasBackgroundVideo && player ? (
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
        </View>
      ) : photos.length > 0 ? (
        <View style={styles.noVideoMessage}>
          <Feather name="video-off" size={20} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.noVideoMessageText}>
            Photo timeline only (no video)
          </ThemedText>
        </View>
      ) : null}
      
      {totalDuration > 0 ? renderTimelineBar() : null}
      
      {hasBackgroundVideo ? renderPlaybackControls() : null}
      
      {photos.length > 0 ? renderPhotoThumbnails() : null}
      
      {renderEventList()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  videoContainer: {
    height: 180,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  video: {
    flex: 1,
  },
  noVideoMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  noVideoMessageText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  timelineBarContainer: {
    marginBottom: Spacing.md,
  },
  timelineBar: {
    height: 40,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    position: "relative",
    overflow: "visible",
  },
  timelineProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    opacity: 0.4,
  },
  marker: {
    position: "absolute",
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginLeft: -9,
    zIndex: 10,
  },
  playhead: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 48,
    backgroundColor: Colors.dark.accent,
    borderRadius: 2,
    marginLeft: -2,
    zIndex: 20,
  },
  tickMarksContainer: {
    position: "relative",
    height: 20,
    marginTop: Spacing.xs,
  },
  tickMark: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -15 }],
  },
  tickLine: {
    width: 1,
    height: 4,
    backgroundColor: Colors.dark.border,
  },
  tickLabel: {
    fontSize: 9,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  scrubHint: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  controlsContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  seekLabel: {
    fontSize: 8,
    color: Colors.dark.textTertiary,
    marginTop: -2,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
    ...Shadows.md,
  },
  controlsSecondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  muteButtonActive: {
    backgroundColor: "rgba(239, 83, 80, 0.2)",
  },
  timeDisplay: {
    flex: 1,
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: Colors.dark.text,
    fontFamily: "monospace",
  },
  splitButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  splitButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  thumbnailsContainer: {
    marginBottom: Spacing.md,
  },
  thumbnailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  thumbnailsScroll: {
    gap: Spacing.sm,
  },
  thumbnailItem: {
    width: 80,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailItemActive: {
    borderColor: Colors.dark.accent,
  },
  thumbnailImage: {
    width: "100%",
    height: 60,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  thumbnailInfo: {
    padding: Spacing.xs,
    alignItems: "center",
  },
  thumbnailTimecode: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.dark.accent,
    fontFamily: "monospace",
  },
  eventListContainer: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  eventListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  eventListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  eventList: {
    maxHeight: 200,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    alignItems: "flex-start",
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  eventTime: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  splitContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  splitVideoContainer: {
    flex: 1,
    height: 140,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  splitVideo: {
    flex: 1,
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  noVideoText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  splitPhotoContainer: {
    flex: 1,
    height: 140,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  splitPhoto: {
    flex: 1,
  },
  noPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  noPhotoText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
});
