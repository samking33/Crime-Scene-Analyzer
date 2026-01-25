import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Fonts } from "@/constants/theme";
import { createCase, getProfile, setActiveCase } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewCaseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [leadOfficer, setLeadOfficer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();

  useEffect(() => {
    const loadDefaults = async () => {
      const profile = await getProfile();
      setLeadOfficer(profile.name);
      
      if (locationPermission?.granted) {
        fetchLocation();
      }
    };
    loadDefaults();
  }, [locationPermission?.granted]);

  const fetchLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      
      if (addresses.length > 0) {
        const addr = addresses[0];
        const parts = [addr.street, addr.city, addr.region].filter(Boolean);
        setLocation(parts.join(", "));
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRequestLocation = async () => {
    if (!locationPermission?.granted) {
      if (locationPermission?.status === "denied" && !locationPermission.canAskAgain) {
        if (Platform.OS !== "web") {
          try {
            await Linking.openSettings();
          } catch (error) {
            console.error("Failed to open settings:", error);
          }
        }
        return;
      }
      const result = await requestLocationPermission();
      if (result.granted) {
        fetchLocation();
      }
    } else {
      fetchLocation();
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const newCase = await createCase({
        title: title.trim(),
        location: location.trim() || "Unknown Location",
        leadOfficer: leadOfficer.trim() || "Unknown Officer",
      });
      
      await setActiveCase(newCase.id);
      
      navigation.goBack();
      navigation.navigate("Main", { screen: "InvestigationTab" });
    } catch (error) {
      console.error("Failed to create case:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = title.trim().length > 0;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.form}>
        <Input
          label="Case Title"
          placeholder="Enter a descriptive case title"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          autoFocus
        />
        
        <View style={styles.locationField}>
          <Input
            label="Location"
            placeholder={isLoadingLocation ? "Fetching location..." : "Enter case location"}
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
          {!locationPermission?.granted ? (
            <Button onPress={handleRequestLocation} style={styles.locationButton}>
              Get Current Location
            </Button>
          ) : null}
        </View>
        
        <Input
          label="Lead Officer"
          placeholder="Officer name"
          value={leadOfficer}
          onChangeText={setLeadOfficer}
          autoCapitalize="words"
        />
        
        <View style={styles.previewSection}>
          <ThemedText style={styles.previewLabel}>Case ID Preview</ThemedText>
          <ThemedText style={styles.previewId}>
            CSI-{new Date().getFullYear()}-XXXXX
          </ThemedText>
          <ThemedText style={styles.previewNote}>
            A unique case ID will be auto-generated
          </ThemedText>
        </View>
      </View>
      
      <Button
        onPress={handleCreate}
        disabled={!isValid || isLoading}
        style={styles.createButton}
      >
        {isLoading ? "Creating..." : "Create Case"}
      </Button>
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
  form: {
    gap: Spacing.xl,
    marginBottom: Spacing["3xl"],
  },
  locationField: {
    gap: Spacing.md,
  },
  locationButton: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  previewSection: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewId: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.accent,
    fontFamily: Fonts?.mono,
  },
  previewNote: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  createButton: {
    backgroundColor: Colors.dark.accent,
  },
});
