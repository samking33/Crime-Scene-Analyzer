import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
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
const TIMELINE_PADDING = Spacing.lg * 2;
const TIMELINE_WIDTH = SCREEN_WIDTH - TIMELINE_PADDING;

export function TimelineView({ caseData, evidence, onEvidencePress }: TimelineViewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const [activePhoto, setActivePhoto] = useState<Evidence | null>(null);
  
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
    }
  );

  useEffect(() => {
    if (!player) return;
    
    const interval = setInterval(() => {
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
    }, 100);
    
    return () => clearInterval(interval);
  }, [player, photos, activePhoto]);

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
    player.currentTime = seconds;
    setCurrentTime(seconds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [player]);

  const handleMarkerPress = useCallback((evidence: Evidence) => {
    if (evidence.relativeTimestamp !== undefined) {
      handleSeekToTime(evidence.relativeTimestamp);
      setActivePhoto(evidence);
    }
  }, [handleSeekToTime]);

  const handleNextEvidence = useCallback(() => {
    const next = getNextEvidence(evidence, currentTime);
    if (next && next.relativeTimestamp !== undefined) {
      handleSeekToTime(next.relativeTimestamp);
      setActivePhoto(next);
    }
  }, [evidence, currentTime, handleSeekToTime]);

  const handlePreviousEvidence = useCallback(() => {
    const prev = getPreviousEvidence(evidence, currentTime);
    if (prev && prev.relativeTimestamp !== undefined) {
      handleSeekToTime(prev.relativeTimestamp);
      setActivePhoto(prev);
    }
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

  const handleFrameStep = useCallback((forward: boolean) => {
    if (!player) return;
    const step = forward ? 1 / 30 : -1 / 30;
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + step));
    player.currentTime = newTime;
    setCurrentTime(newTime);
  }, [player, currentTime, totalDuration]);

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
      <View style={styles.timelineBar}>
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
    </View>
  );

  const renderPlaybackControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.controlsRow}>
        <Pressable onPress={handlePreviousEvidence} style={styles.controlButton}>
          <Feather name="skip-back" size={20} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={() => handleFrameStep(false)} style={styles.controlButton}>
          <Feather name="chevron-left" size={20} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={handlePlayPause} style={styles.playButton}>
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={28} 
            color={Colors.dark.text} 
          />
        </Pressable>
        
        <Pressable onPress={() => handleFrameStep(true)} style={styles.controlButton}>
          <Feather name="chevron-right" size={20} color={Colors.dark.text} />
        </Pressable>
        
        <Pressable onPress={handleNextEvidence} style={styles.controlButton}>
          <Feather name="skip-forward" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>
      
      <View style={styles.controlsSecondRow}>
        <Pressable onPress={handleSpeedChange} style={styles.speedButton}>
          <ThemedText style={styles.speedText}>{playbackSpeed}x</ThemedText>
        </Pressable>
        
        <View style={styles.timeDisplay}>
          <ThemedText style={styles.timeText}>
            {formatTimecode(currentTime, true)} / {formatTimecode(totalDuration, true)}
          </ThemedText>
        </View>
        
        <Pressable 
          onPress={() => setIsSplitScreen(!isSplitScreen)} 
          style={[styles.splitButton, isSplitScreen && styles.splitButtonActive]}
        >
          <Feather name="columns" size={18} color={Colors.dark.text} />
        </Pressable>
      </View>
    </View>
  );

  const renderPhotoThumbnails = () => (
    <View style={styles.thumbnailsContainer}>
      <ThemedText style={styles.thumbnailsTitle}>Photos Timeline</ThemedText>
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
                <ThemedText style={styles.thumbnailAbsolute}>
                  {formatAbsoluteTime(photo.timestamp)}
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
        <ThemedText style={styles.eventListTitle}>Timeline Events</ThemedText>
        <Feather 
          name={showEventList ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.dark.textSecondary} 
        />
      </Pressable>
      
      {showEventList ? (
        <View style={styles.eventList}>
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
                <View style={styles.eventTimeRow}>
                  <ThemedText style={styles.eventTime}>
                    {formatAbsoluteTime(event.timestamp)}
                  </ThemedText>
                  {event.relativeTimestamp !== undefined ? (
                    <ThemedText style={styles.eventRelative}>
                      ({formatRelativeTimestamp(event.relativeTimestamp)} into recording)
                    </ThemedText>
                  ) : null}
                </View>
                {event.details ? (
                  <ThemedText style={styles.eventDetails} numberOfLines={2}>
                    {event.details}
                  </ThemedText>
                ) : null}
              </View>
              {index < timelineEvents.length - 1 ? (
                <View style={styles.eventLine} />
              ) : null}
            </Pressable>
          ))}
        </View>
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
            <Feather name="video-off" size={32} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.noVideoText}>No background video</ThemedText>
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
            <Feather name="image" size={32} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.noPhotoText}>
              Select a photo from the timeline
            </ThemedText>
          </View>
        )}
        {activePhoto ? (
          <View style={styles.photoInfoOverlay}>
            <ThemedText style={styles.photoInfoText}>
              {formatTimecode(activePhoto.relativeTimestamp || 0)} - {activePhoto.aiSummary?.substring(0, 50) || "Photo evidence"}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!hasBackgroundVideo && photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="clock" size={48} color={Colors.dark.textSecondary} />
        <ThemedText style={styles.emptyTitle}>No Timeline Data</ThemedText>
        <ThemedText style={styles.emptyText}>
          Start an investigation with background recording to capture timeline data
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Feather name="video-off" size={24} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.noVideoMessageText}>
            No background video - viewing photo timeline only
          </ThemedText>
        </View>
      ) : null}
      
      {totalDuration > 0 ? renderTimelineBar() : null}
      
      {hasBackgroundVideo ? renderPlaybackControls() : null}
      
      {photos.length > 0 ? renderPhotoThumbnails() : null}
      
      {renderEventList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
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
    height: 200,
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
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  noVideoMessageText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  timelineBarContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  timelineBar: {
    height: 32,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    position: "relative",
    overflow: "visible",
  },
  timelineProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    opacity: 0.3,
  },
  marker: {
    position: "absolute",
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginLeft: -10,
    zIndex: 10,
  },
  playhead: {
    position: "absolute",
    top: -4,
    width: 3,
    height: 40,
    backgroundColor: Colors.dark.accent,
    borderRadius: 1.5,
    marginLeft: -1.5,
    zIndex: 20,
  },
  tickMarksContainer: {
    position: "relative",
    height: 24,
    marginTop: Spacing.xs,
  },
  tickMark: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -20 }],
  },
  tickLine: {
    width: 1,
    height: 6,
    backgroundColor: Colors.dark.border,
  },
  tickLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  controlsContainer: {
    marginBottom: Spacing.lg,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsSecondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  timeDisplay: {
    flex: 1,
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontFamily: "monospace",
  },
  splitButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  splitButtonActive: {
    backgroundColor: Colors.dark.accent,
  },
  thumbnailsContainer: {
    marginBottom: Spacing.lg,
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
    width: 100,
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
    height: 70,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundDefault,
  },
  thumbnailInfo: {
    padding: Spacing.xs,
  },
  thumbnailTimecode: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.accent,
    fontFamily: "monospace",
  },
  thumbnailAbsolute: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    position: "relative",
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
    marginTop: 4,
  },
  eventLine: {
    position: "absolute",
    left: 5,
    top: 20,
    bottom: -8,
    width: 2,
    backgroundColor: Colors.dark.border,
  },
  eventContent: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  eventTimeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontFamily: "monospace",
  },
  eventRelative: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  eventDetails: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  splitContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  splitVideoContainer: {
    height: 150,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  splitVideo: {
    flex: 1,
  },
  splitPhotoContainer: {
    height: 150,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  splitPhoto: {
    flex: 1,
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  noVideoText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  noPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  noPhotoText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  photoInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: Spacing.sm,
  },
  photoInfoText: {
    fontSize: 12,
    color: Colors.dark.text,
  },
});
