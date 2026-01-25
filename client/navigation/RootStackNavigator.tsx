import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import MainTabNavigator, { MainTabParamList } from "@/navigation/MainTabNavigator";
import NewCaseScreen from "@/screens/NewCaseScreen";
import CaseDetailScreen from "@/screens/CaseDetailScreen";
import AddNoteScreen from "@/screens/AddNoteScreen";
import RecordAudioScreen from "@/screens/RecordAudioScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import ActivityLogScreen from "@/screens/ActivityLogScreen";
import EvidenceViewerScreen from "@/screens/EvidenceViewerScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";

import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Evidence } from "@/types/case";

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  NewCase: undefined;
  CaseDetail: { caseId: string };
  AddNote: { caseId: string };
  RecordAudio: { caseId: string };
  EditProfile: undefined;
  ActivityLog: undefined;
  EvidenceViewer: { evidence: Evidence };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={({ navigation }) => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="NewCase"
        component={NewCaseScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "New Case",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{
          headerTitle: "Case Details",
        }}
      />
      <Stack.Screen
        name="AddNote"
        component={AddNoteScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Add Note",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="RecordAudio"
        component={RecordAudioScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Record Audio",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerTitle: "Edit Profile",
        }}
      />
      <Stack.Screen
        name="ActivityLog"
        component={ActivityLogScreen}
        options={{
          headerTitle: "My Activity Log",
        }}
      />
      <Stack.Screen
        name="EvidenceViewer"
        component={EvidenceViewerScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
