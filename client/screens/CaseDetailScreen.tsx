import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { ActivityItem } from "@/components/ActivityItem";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { TimelineView } from "@/components/TimelineView";
import { Colors, Spacing, BorderRadius, Shadows, GradientColors } from "@/constants/theme";
import { getCase, getEvidence, getActivityLog, setActiveCase, createReport, updateReport, getProfile } from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";
import { format } from "date-fns";
import type { Case, Evidence, ActivityLog, EvidenceType } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "CaseDetail">["route"];

type TabType = "timeline" | "evidence" | "activity";
type EvidenceFilter = "all" | EvidenceType;

export default function CaseDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { caseId } = route.params;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [caseResult, evidenceResult, activityResult] = await Promise.all([
        getCase(caseId),
        getEvidence(caseId),
        getActivityLog(caseId),
      ]);
      setCaseData(caseResult);
      setEvidence(evidenceResult);
      setActivityLog(activityResult);
    } catch (error) {
      console.error("Failed to load case data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartInvestigation = async () => {
    if (!caseData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setActiveCase(caseData.id);
    navigation.navigate("Main", { screen: "InvestigationTab" });
  };

  const handleGenerateReport = async () => {
    if (!caseData) return;
    
    setIsGeneratingReport(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const profile = await getProfile();
      
      const url = new URL("/api/generate-report", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseData,
          evidence,
          activityLog,
          profile,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      const { html } = await response.json();
      
      const { uri } = await Print.printToFileAsync({ html });
      
      const report = await createReport(caseData);
      await updateReport(report.id, { pdfUri: uri, status: "exported" });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Share Report - ${caseData.caseId}`,
        });
      }
      
      navigation.navigate("Main", { screen: "ReportsTab" });
    } catch (error) {
      console.error("Failed to generate report:", error);
      Alert.alert("Error", "Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleEvidencePress = (item: Evidence) => {
    navigation.navigate("EvidenceViewer", { evidence: item });
  };

  const filteredEvidence = evidenceFilter === "all"
    ? evidence
    : evidence.filter((e) => e.type === evidenceFilter);

  const evidenceTypeCounts = {
    all: evidence.length,
    photo: evidence.filter((e) => e.type === "photo").length,
    video: evidence.filter((e) => e.type === "video").length,
    audio: evidence.filter((e) => e.type === "audio").length,
    note: evidence.filter((e) => e.type === "note").length,
  };

  if (isLoading || !caseData) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Feather.glyphMap) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
      }}
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
    >
      <Feather
        name={icon}
        size={16}
        color={activeTab === tab ? Colors.dark.primary : Colors.dark.textTertiary}
      />
      <ThemedText
        style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderEvidenceFilterButton = (filter: EvidenceFilter, label: string, icon: keyof typeof Feather.glyphMap) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEvidenceFilter(filter);
      }}
      style={[styles.filterButton, evidenceFilter === filter && styles.filterButtonActive]}
    >
      <Feather
        name={icon}
        size={14}
        color={evidenceFilter === filter ? Colors.dark.buttonText : Colors.dark.textTertiary}
      />
      <ThemedText
        style={[styles.filterLabel, evidenceFilter === filter && styles.filterLabelActive]}
      >
        {label} ({evidenceTypeCounts[filter]})
      </ThemedText>
    </Pressable>
  );

  const renderTimelineContent = () => (
    <View style={styles.tabContent}>
      {evidence.length === 0 && !caseData.backgroundVideoUri ? (
        <EmptyState
          image={require("../../assets/images/empty-investigation.png")}
          title="No Timeline Data"
          description="Start an investigation with background recording to capture timeline data"
          actionLabel="Begin Investigation"
          onAction={handleStartInvestigation}
        />
      ) : (
        <TimelineView
          caseData={caseData}
          evidence={evidence}
          onEvidencePress={handleEvidencePress}
        />
      )}
    </View>
  );

  const renderEvidenceContent = () => (
    <View style={styles.tabContent}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {renderEvidenceFilterButton("all", "All", "grid")}
        {renderEvidenceFilterButton("photo", "Photos", "image")}
        {renderEvidenceFilterButton("video", "Videos", "video")}
        {renderEvidenceFilterButton("audio", "Audio", "mic")}
        {renderEvidenceFilterButton("note", "Notes", "file-text")}
      </ScrollView>

      {filteredEvidence.length === 0 ? (
        <View style={styles.emptyFilterState}>
          <View style={styles.emptyIconContainer}>
            <Feather
              name={evidenceFilter === "photo" ? "image" : evidenceFilter === "video" ? "video" : evidenceFilter === "audio" ? "mic" : evidenceFilter === "note" ? "file-text" : "grid"}
              size={32}
              color={Colors.dark.textTertiary}
            />
          </View>
          <ThemedText style={styles.emptyTabText}>
            No {evidenceFilter === "all" ? "evidence" : `${evidenceFilter}s`} captured yet
          </ThemedText>
        </View>
      ) : (
        <View style={styles.evidenceGrid}>
          {filteredEvidence.map((item, index) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              compact
              index={index}
              onPress={() => handleEvidencePress(item)}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderActivityContent = () => (
    <View style={styles.tabContent}>
      {activityLog.length === 0 ? (
        <View style={styles.emptyFilterState}>
          <View style={styles.emptyIconContainer}>
            <Feather name="activity" size={32} color={Colors.dark.textTertiary} />
          </View>
          <ThemedText style={styles.emptyTabText}>No activity recorded yet</ThemedText>
        </View>
      ) : (
        <View style={styles.activityList}>
          {activityLog.map((item, index) => (
            <ActivityItem
              key={item.id}
              activity={item}
              isLast={index === activityLog.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
      data={[{ key: "content" }]}
      keyExtractor={(item) => item.key}
      renderItem={() => (
        <>
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View style={styles.caseIdRow}>
              <View style={styles.caseIdBadge}>
                <ThemedText style={styles.caseId}>{caseData.caseId}</ThemedText>
              </View>
              <StatusBadge status={caseData.status} />
            </View>
            <ThemedText style={styles.title}>{caseData.title}</ThemedText>
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={14} color={Colors.dark.textTertiary} />
                <ThemedText style={styles.metaText}>{caseData.location}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <Feather name="user" size={14} color={Colors.dark.textTertiary} />
                <ThemedText style={styles.metaText}>{caseData.leadOfficer}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={14} color={Colors.dark.textTertiary} />
                <ThemedText style={styles.metaText}>
                  {format(new Date(caseData.createdAt), "MMM d, yyyy")}
                </ThemedText>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(100)} style={styles.statsRow}>
            <View style={[styles.statCard, Shadows.md]}>
              <View style={styles.statIconContainer}>
                <Feather name="image" size={20} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.statValue}>{evidence.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Evidence Items</ThemedText>
            </View>
            <View style={[styles.statCard, Shadows.md]}>
              <View style={[styles.statIconContainer, { backgroundColor: "rgba(67, 160, 71, 0.15)" }]}>
                <Feather name="activity" size={20} color={Colors.dark.success} />
              </View>
              <ThemedText style={styles.statValue}>{activityLog.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Activity Logs</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.actions}>
            <Button
              onPress={handleStartInvestigation}
              icon={<Feather name="camera" size={18} color={Colors.dark.text} />}
            >
              Continue Investigation
            </Button>
            <View style={styles.actionRow}>
              <Button
                onPress={handleGenerateReport}
                variant="secondary"
                disabled={evidence.length === 0 || isGeneratingReport}
                icon={<Feather name="file-text" size={18} color={Colors.dark.primary} />}
              >
                {isGeneratingReport ? "Generating..." : "Generate Report"}
              </Button>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("CategoryDashboard", { caseId });
                }}
                style={styles.categoriesButton}
              >
                <MaterialCommunityIcons name="view-grid" size={20} color={Colors.dark.accent} />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.tabBar}>
            {renderTabButton("timeline", "Timeline", "clock")}
            {renderTabButton("evidence", "Evidence", "image")}
            {renderTabButton("activity", "Activity", "activity")}
          </Animated.View>

          {activeTab === "timeline" && renderTimelineContent()}
          {activeTab === "evidence" && renderEvidenceContent()}
          {activeTab === "activity" && renderActivityContent()}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    color: Colors.dark.textSecondary,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  caseIdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseIdBadge: {
    backgroundColor: "rgba(0, 176, 255, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  caseId: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.accent,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
    lineHeight: 34,
  },
  metaContainer: {
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0, 176, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: "500",
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  categoriesButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 176, 255, 0.3)",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textTertiary,
  },
  tabLabelActive: {
    color: Colors.dark.primary,
  },
  tabContent: {
    minHeight: 200,
  },
  filterScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.screenPadding,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textTertiary,
  },
  filterLabelActive: {
    color: Colors.dark.buttonText,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  activityList: {
    gap: 0,
  },
  emptyTabText: {
    textAlign: "center",
    color: Colors.dark.textTertiary,
    fontSize: 14,
  },
  emptyFilterState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
