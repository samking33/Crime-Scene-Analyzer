import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { ActivityItem } from "@/components/ActivityItem";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { getCase, getEvidence, getActivityLog, setActiveCase, createReport } from "@/lib/storage";
import { format } from "date-fns";
import type { Case, Evidence, ActivityLog } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, "CaseDetail">["route"];

type TabType = "timeline" | "evidence" | "activity";

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
  const [isLoading, setIsLoading] = useState(true);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createReport(caseData);
    navigation.navigate("Main", { screen: "ReportsTab" });
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
            <EvidenceCard evidence={item} onPress={() => {}} />
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
      {evidence.length === 0 ? (
        <ThemedText style={styles.emptyTabText}>No evidence captured yet</ThemedText>
      ) : (
        <View style={styles.evidenceGrid}>
          {evidence.map((item) => (
            <EvidenceCard key={item.id} evidence={item} compact onPress={() => {}} />
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
              disabled={evidence.length === 0}
            >
              Generate Report
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
    marginTop: Spacing["3xl"],
  },
});
