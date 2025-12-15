import React from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, "AdminDashboard">;

interface DashboardStats {
  openTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completedToday: number;
  cancelledTasks: number;
  activeDrivers: number;
  criticalContainers: number;
  totalCapacity: number;
  availableCapacity: number;
  totalTasks: number;
}

export default function AdminDashboardScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();

  const getStatusBackground = (color: string) => {
    if (color === theme.statusOpen) return isDark ? theme.infoLight : `${theme.info}15`;
    if (color === theme.statusInProgress) return isDark ? theme.warningLight : `${theme.warning}15`;
    if (color === theme.statusCompleted || color === theme.success) return isDark ? theme.successLight : `${theme.success}15`;
    if (color === theme.primary) return isDark ? theme.backgroundSecondary : `${theme.primary}15`;
    return isDark ? theme.backgroundSecondary : theme.backgroundSecondary;
  };

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const StatCard = ({
    icon,
    label,
    value,
    color,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: number | string;
    color: string;
    onPress?: () => void;
  }) => (
    <Pressable
      style={[
        styles.statCard,
        { 
          borderLeftColor: color,
          backgroundColor: theme.cardSurface,
          borderColor: theme.cardBorder,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: getStatusBackground(color) }]}>
        <Feather name={icon} size={IndustrialDesign.iconSize} color={color} />
      </View>
      <ThemedText type="h2" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.accent}
          />
        }
      >
        <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.primary }]}>
          Tagesübersicht
        </ThemedText>

        <View style={styles.statsGrid}>
          <StatCard
            icon="inbox"
            label="Offene Aufgaben"
            value={stats?.openTasks || 0}
            color={theme.statusOpen}
          />
          <StatCard
            icon="truck"
            label="In Bearbeitung"
            value={stats?.inProgressTasks || 0}
            color={theme.statusInProgress}
          />
          <StatCard
            icon="check-circle"
            label="Heute erledigt"
            value={stats?.completedToday || 0}
            color={theme.statusCompleted || theme.success}
          />
          <StatCard
            icon="users"
            label="Aktive Fahrer"
            value={stats?.activeDrivers || 0}
            color={theme.primary}
          />
        </View>

        <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.primary }]}>
          Container-Status
        </ThemedText>

        <View style={styles.statsRow}>
          <Card style={{
            ...styles.alertCard,
            backgroundColor: stats?.criticalContainers ? (isDark ? theme.errorLight : `${theme.error}10`) : theme.cardSurface,
            borderWidth: stats?.criticalContainers ? 1 : 0,
            borderColor: stats?.criticalContainers ? theme.error : 'transparent',
          }}>
            <View style={styles.alertContent}>
              <Feather
                name="alert-triangle"
                size={IndustrialDesign.iconSize}
                color={stats?.criticalContainers ? theme.error : theme.success}
              />
              <View>
                <ThemedText type="h3" style={styles.alertValue}>
                  {stats?.criticalContainers || 0}
                </ThemedText>
                <ThemedText type="small" style={[styles.alertLabel, { color: theme.textSecondary }]}>
                  Kritische Container
                </ThemedText>
              </View>
            </View>
          </Card>

          <Card style={{ ...styles.capacityCard, backgroundColor: theme.cardSurface }}>
            <View style={styles.alertContent}>
              <Feather name="database" size={IndustrialDesign.iconSize} color={theme.primary} />
              <View>
                <ThemedText type="h3" style={styles.alertValue}>
                  {stats?.availableCapacity ? `${(stats.availableCapacity / 1000).toFixed(1)}t` : "0t"}
                </ThemedText>
                <ThemedText type="small" style={[styles.alertLabel, { color: theme.textSecondary }]}>
                  Verfügbare Kapazität
                </ThemedText>
              </View>
            </View>
          </Card>
        </View>

        <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.primary }]}>
          Schnellaktionen
        </ThemedText>

        <View style={styles.actionsGrid}>
          <Button
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate("ManualTask")}
          >
            <View style={styles.actionContent}>
              <Feather name="plus-circle" size={20} color={theme.textOnAccent} />
              <ThemedText type="body" style={[styles.actionText, { color: theme.textOnAccent }]}>
                Neue Aufgabe erstellen
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("AutomotiveManagement")}
          >
            <View style={styles.actionContent}>
              <Feather name="box" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Automotive Fabrik
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("ManageDrivers")}
          >
            <View style={styles.actionContent}>
              <Feather name="users" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Fahrer verwalten
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("DepartmentManagement")}
          >
            <View style={styles.actionContent}>
              <Feather name="briefcase" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Abteilungen
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("Activity")}
          >
            <View style={styles.actionContent}>
              <Feather name="activity" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Aktivität
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("Analytics")}
          >
            <View style={styles.actionContent}>
              <Feather name="bar-chart-2" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Statistiken
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("ScheduleManagement")}
          >
            <View style={styles.actionContent}>
              <Feather name="clock" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Zeitpläne
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("StandMapping")}
          >
            <View style={styles.actionContent}>
              <Feather name="map-pin" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Stellplatz-Zuordnung
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("LayoutManagement")}
          >
            <View style={styles.actionContent}>
              <Feather name="layout" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Layout-Verwaltung
              </ThemedText>
            </View>
          </Button>

          <Button
            style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("MapEditor")}
          >
            <View style={styles.actionContent}>
              <Feather name="edit-3" size={20} color={theme.primary} />
              <ThemedText type="body" style={[styles.secondaryText, { color: theme.primary }]}>
                Karten-Editor
              </ThemedText>
            </View>
          </Button>
        </View>

        <Pressable
          style={[styles.profileLink, { minHeight: IndustrialDesign.minTouchTarget }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Feather name="user" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={[styles.profileLinkText, { color: theme.textSecondary }]}>
            Profil anzeigen
          </ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    minHeight: IndustrialDesign.minTouchTarget * 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  alertCard: {
    flex: 1,
  },
  capacityCard: {
    flex: 1,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  alertValue: {
    marginBottom: 2,
  },
  alertLabel: {
    fontWeight: "500",
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionButton: {
    minHeight: IndustrialDesign.buttonHeight,
  },
  secondaryButton: {
    borderWidth: 2,
    minHeight: IndustrialDesign.buttonHeight,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionText: {
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryText: {
    fontWeight: "600",
    fontSize: 16,
  },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  profileLinkText: {
    flex: 1,
  },
});
