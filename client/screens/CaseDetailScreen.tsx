import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { ActivityItem } from "@/components/ActivityItem";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
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
        color={activeTab === tab ? Colors.dark.accent : Colors.dark.textSecondary}
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
        color={evidenceFilter === filter ? Colors.dark.buttonText : Colors.dark.textSecondary}
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
      {evidence.length === 0 ? (
        <EmptyState
          image={require("../../assets/images/empty-investigation.png")}
          title="No Evidence Yet"
          description="Start an investigation to capture evidence"
          actionLabel="Begin Investigation"
          onAction={handleStartInvestigation}
        />
      ) : (
        <FlatList
          data={evidence}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EvidenceCard evidence={item} onPress={() => handleEvidencePress(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
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
          <Feather
            name={evidenceFilter === "photo" ? "image" : evidenceFilter === "video" ? "video" : evidenceFilter === "audio" ? "mic" : evidenceFilter === "note" ? "file-text" : "grid"}
            size={48}
            color={Colors.dark.textSecondary}
          />
          <ThemedText style={styles.emptyTabText}>
            No {evidenceFilter === "all" ? "evidence" : `${evidenceFilter}s`} captured yet
          </ThemedText>
        </View>
      ) : (
        <View style={styles.evidenceGrid}>
          {filteredEvidence.map((item) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              compact
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
        <ThemedText style={styles.emptyTabText}>No activity recorded yet</ThemedText>
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
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      data={[{ key: "content" }]}
      keyExtractor={(item) => item.key}
      renderItem={() => (
        <>
          <View style={styles.header}>
            <View style={styles.caseIdRow}>
              <ThemedText style={styles.caseId}>{caseData.caseId}</ThemedText>
              <StatusBadge status={caseData.status} />
            </View>
            <ThemedText style={styles.title}>{caseData.title}</ThemedText>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={14} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.metaText}>{caseData.location}</ThemedText>
            </View>
            <View style={styles.metaRow}>
              <Feather name="user" size={14} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.metaText}>{caseData.leadOfficer}</ThemedText>
              <View style={styles.dot} />
              <Feather name="clock" size={14} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.metaText}>
                {format(new Date(caseData.createdAt), "MMM d, yyyy")}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{evidence.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Evidence Items</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{activityLog.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Activity Logs</ThemedText>
            </View>
          </View>

          <View style={styles.actions}>
            <Button onPress={handleStartInvestigation} style={styles.investigateButton}>
              Continue Investigation
            </Button>
            <Button
              onPress={handleGenerateReport}
              style={styles.reportButton}
              disabled={evidence.length === 0 || isGeneratingReport}
            >
              {isGeneratingReport ? "Generating PDF..." : "Generate PDF Report"}
            </Button>
          </View>

          <View style={styles.tabBar}>
            {renderTabButton("timeline", "Timeline", "clock")}
            {renderTabButton("evidence", "Evidence", "image")}
            {renderTabButton("activity", "Activity", "activity")}
          </View>

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
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    color: Colors.dark.textSecondary,
  },
  header: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  caseIdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseId: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.accent,
    fontFamily: Fonts?.mono,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  investigateButton: {
    backgroundColor: Colors.dark.success,
  },
  reportButton: {
    backgroundColor: Colors.dark.primary,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: Colors.dark.accent,
  },
  tabContent: {
    minHeight: 200,
  },
  listContent: {
    gap: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },
  filterScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
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
    color: Colors.dark.textSecondary,
    marginTop: Spacing.lg,
  },
  emptyFilterState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
});
