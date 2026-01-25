import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getProfile } from "@/lib/storage";
import type { OfficerProfile } from "@/types/case";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  rightText?: string;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingsItem({ icon, label, onPress, rightText, showChevron = true, danger = false }: SettingsItemProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
    >
      <View style={[styles.settingsIcon, danger && styles.dangerIcon]}>
        <Feather name={icon} size={18} color={danger ? Colors.dark.error : Colors.dark.accent} />
      </View>
      <ThemedText style={[styles.settingsLabel, danger && styles.dangerLabel]}>
        {label}
      </ThemedText>
      <View style={styles.settingsRight}>
        {rightText ? (
          <ThemedText style={styles.settingsRightText}>{rightText}</ThemedText>
        ) : null}
        {showChevron ? (
          <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  
  const [profile, setProfile] = useState<OfficerProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const data = await getProfile();
        setProfile(data);
      };
      loadProfile();
    }, [])
  );

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleActivityLog = () => {
    navigation.navigate("ActivityLog");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/officer-avatar.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileName}>
            {profile?.name || "Officer"}
          </ThemedText>
          <View style={styles.badgeRow}>
            <Feather name="shield" size={14} color={Colors.dark.accent} />
            <ThemedText style={styles.badgeNumber}>
              Badge #{profile?.badgeNumber || "000000"}
            </ThemedText>
          </View>
          <ThemedText style={styles.department}>
            {profile?.department || "Police Department"}
          </ThemedText>
        </View>
        <Pressable onPress={handleEditProfile} style={styles.editButton}>
          <Feather name="edit-2" size={18} color={Colors.dark.accent} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Chain of Custody</ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="activity"
            label="My Activity Log"
            onPress={handleActivityLog}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>App Settings</ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="moon"
            label="Dark Mode"
            rightText="On"
            showChevron={false}
            onPress={() => {}}
          />
          <SettingsItem
            icon="bell"
            label="Notifications"
            rightText="Off"
            showChevron={false}
            onPress={() => {}}
          />
          <SettingsItem
            icon="map-pin"
            label="GPS Accuracy"
            rightText="High"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="info"
            label="Version"
            rightText="1.0.0"
            showChevron={false}
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="log-out"
            label="Log Out"
            danger
            showChevron={false}
            onPress={() => {}}
          />
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeNumber: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  department: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  settingsGroup: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingsItemPressed: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIcon: {
    backgroundColor: Colors.dark.error + "20",
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: Spacing.md,
  },
  dangerLabel: {
    color: Colors.dark.error,
  },
  settingsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingsRightText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
