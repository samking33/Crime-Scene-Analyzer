import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import CasesScreen from "@/screens/CasesScreen";
import InvestigationScreen from "@/screens/InvestigationScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";
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
      <Feather name="plus" size={22} color={Colors.dark.accent} />
    </HeaderButton>
  );
}

export default function MainTabNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="CasesTab"
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: Colors.dark.backgroundRoot,
            web: Colors.dark.backgroundRoot,
          }),
          borderTopWidth: 1,
          borderTopColor: Colors.dark.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        ...screenOptions,
      }}
    >
      <Tab.Screen
        name="CasesTab"
        component={CasesScreen}
        options={{
          title: "Cases",
          headerTitle: () => <HeaderTitle title="Cases" />,
          headerRight: () => <CasesHeaderRight />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InvestigationTab"
        component={InvestigationScreen}
        options={{
          title: "Investigate",
          headerTitle: () => <HeaderTitle title="Investigation" showIcon={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          title: "Reports",
          headerTitle: () => <HeaderTitle title="Reports" showIcon={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerTitle: () => <HeaderTitle title="Profile" showIcon={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
