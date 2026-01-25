import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import CasesScreen from "@/screens/CasesScreen";
import InvestigationScreen from "@/screens/InvestigationScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  CasesTab: undefined;
  InvestigationTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

function CasesHeaderRight() {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <HeaderButton
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate("NewCase");
      }}
    >
      <Feather name="plus" size={22} color={Colors.dark.primary} />
    </HeaderButton>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="CasesTab"
      screenOptions={{
        headerTitleAlign: "center",
        headerTransparent: true,
        headerTintColor: Colors.dark.text,
        headerStyle: {
          backgroundColor: Platform.select({
            ios: undefined,
            android: Colors.dark.backgroundRoot,
            web: Colors.dark.backgroundRoot,
          }),
        },
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "rgba(30, 37, 48, 0.95)",
            web: "rgba(30, 37, 48, 0.95)",
          }),
          borderTopWidth: 1,
          borderTopColor: Colors.dark.border,
          elevation: 0,
          height: Platform.select({ ios: 88, android: 70, web: 70 }),
          paddingTop: Spacing.sm,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, styles.tabBarBlur]}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
          ),
      }}
    >
      <Tab.Screen
        name="CasesTab"
        component={CasesScreen}
        options={{
          title: "Cases",
          headerTitle: () => <HeaderTitle title="Cases" />,
          headerRight: () => <CasesHeaderRight />,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Feather name="folder" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="InvestigationTab"
        component={InvestigationScreen}
        options={{
          title: "Investigate",
          headerTitle: () => <HeaderTitle title="Investigation" showIcon={false} />,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Feather name="camera" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          title: "Reports",
          headerTitle: () => <HeaderTitle title="Reports" showIcon={false} />,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Feather name="file-text" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerTitle: () => <HeaderTitle title="Profile" showIcon={false} />,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
              <Feather name="user" size={size - 2} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBlur: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  tabBarAndroid: {
    backgroundColor: "rgba(30, 37, 48, 0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  tabIconContainer: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  tabIconContainerActive: {
    backgroundColor: "rgba(41, 98, 255, 0.15)",
  },
});
