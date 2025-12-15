import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import TasksStackNavigator from "@/navigation/TasksStackNavigator";
import ScannerScreen from "@/screens/ScannerScreen";
import ContainersStackNavigator from "@/navigation/ContainersStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import MapScreen from "@/screens/MapScreen";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, IndustrialDesign } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export type MainTabParamList = {
  TasksTab: undefined;
  ScannerTab: undefined;
  ContainersTab: undefined;
  MapTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="ScannerTab"
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          height: Spacing.tabBarHeight,
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
            web: theme.backgroundRoot,
          }),
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="ScannerTab"
        component={ScannerScreen}
        options={{
          title: "Scannen",
          tabBarIcon: ({ color }) => (
            <Feather name="maximize" size={IndustrialDesign.iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{
          title: "Aufgaben",
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={IndustrialDesign.iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ContainersTab"
        component={ContainersStackNavigator}
        options={{
          title: "Lager",
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={IndustrialDesign.iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: "Werksplan",
          tabBarIcon: ({ color }) => (
            <Feather name="map-pin" size={IndustrialDesign.iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: isAdmin ? "Admin" : "Profil",
          tabBarIcon: ({ color }) => (
            <Feather name={isAdmin ? "grid" : "user"} size={IndustrialDesign.iconSize} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
