import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import ManageDriversScreen from "@/screens/ManageDriversScreen";
import AutomotiveManagementScreen from "@/screens/AutomotiveManagementScreen";
import DepartmentManagementScreen from "@/screens/DepartmentManagementScreen";
import ActivityScreen from "@/screens/ActivityScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import ScheduleManagementScreen from "@/screens/ScheduleManagementScreen";
import ManualTaskScreen from "@/screens/ManualTaskScreen";
import StandMappingScreen from "@/screens/StandMappingScreen";
import LayoutManagementScreen from "@/screens/LayoutManagementScreen";
import MapEditorScreen from "@/screens/MapEditorScreen";
import QRCenterScreen from "@/screens/QRCenterScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

export type ProfileStackParamList = {
  Profile: undefined;
  AdminDashboard: undefined;
  ManageDrivers: undefined;
  AutomotiveManagement: undefined;
  DepartmentManagement: undefined;
  Activity: undefined;
  Analytics: undefined;
  ScheduleManagement: undefined;
  ManualTask: undefined;
  StandMapping: undefined;
  LayoutManagement: undefined;
  MapEditor: undefined;
  QRCenter: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAdmin ? (
        <>
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ headerTitle: "Dashboard" }}
          />
          <Stack.Screen
            name="ManageDrivers"
            component={ManageDriversScreen}
            options={{ headerTitle: "Fahrer verwalten" }}
          />
          <Stack.Screen
            name="AutomotiveManagement"
            component={AutomotiveManagementScreen}
            options={{ headerTitle: "Automotive Fabrik" }}
          />
          <Stack.Screen
            name="DepartmentManagement"
            component={DepartmentManagementScreen}
            options={{ headerTitle: "Abteilungen" }}
          />
          <Stack.Screen
            name="Activity"
            component={ActivityScreen}
            options={{ headerTitle: "Aktivität" }}
          />
          <Stack.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ headerTitle: "Statistiken" }}
          />
          <Stack.Screen
            name="ScheduleManagement"
            component={ScheduleManagementScreen}
            options={{ headerTitle: "Zeitpläne" }}
          />
          <Stack.Screen
            name="ManualTask"
            component={ManualTaskScreen}
            options={{ headerTitle: "Neue Aufgabe" }}
          />
          <Stack.Screen
            name="StandMapping"
            component={StandMappingScreen}
            options={{ headerTitle: "Stellplatz-Zuordnung" }}
          />
          <Stack.Screen
            name="LayoutManagement"
            component={LayoutManagementScreen}
            options={{ headerTitle: "Layout-Verwaltung" }}
          />
          <Stack.Screen
            name="MapEditor"
            component={MapEditorScreen}
            options={{ headerTitle: "Karten-Editor" }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerTitle: "Profil" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: "Profil" }}
        />
      )}
      <Stack.Screen
        name="QRCenter"
        component={QRCenterScreen}
        options={{ headerTitle: "QR-Center" }}
      />
    </Stack.Navigator>
  );
}
