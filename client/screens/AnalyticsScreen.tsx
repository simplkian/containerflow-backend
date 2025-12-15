import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { FilterChip } from "@/components/FilterChip";
import { ProgressBar } from "@/components/ProgressBar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { AUTOMOTIVE_TASK_STATUS_LABELS } from "@shared/schema";

type DateRangeKey = "today" | "7days" | "30days" | "90days";

interface MaterialData {
  materialId: string | null;
  materialName: string | null;
  totalWeightKg: string | null;
  taskCount: number;
}

interface StationData {
  stationId: string;
  stationName: string;
  stationCode: string | null;
  materialId: string | null;
  materialName: string | null;
  totalWeightKg: string | null;
  taskCount: number;
  avgLeadTimeMinutes: string | null;
}

interface HallData {
  hallId: string;
  hallName: string;
  taskCount: number;
  totalWeightKg: string | null;
  avgLeadTimeMinutes: string | null;
}

interface UserPerformanceEntry {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  totalWeightKg: string | null;
  taskCount: number;
}

interface UsersData {
  data: {
    byWeigher: UserPerformanceEntry[];
    byDriver: UserPerformanceEntry[];
  };
}

interface LeadTimesData {
  avgOpenToPickedUpHours: string | null;
  avgPickedUpToDroppedOffHours: string | null;
  avgDroppedOffToDisposedHours: string | null;
  taskCount: number;
}

interface BacklogTask {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
  stationName: string | null;
  materialName: string | null;
}

interface BacklogSummary {
  status: string;
  count: number;
}

interface BacklogResponse {
  olderThanHours: number;
  summary: BacklogSummary[];
  data: Record<string, BacklogTask[]>;
}

const DATE_RANGES: { key: DateRangeKey; label: string; days: number }[] = [
  { key: "today", label: "Heute", days: 0 },
  { key: "7days", label: "7 Tage", days: 7 },
  { key: "30days", label: "30 Tage", days: 30 },
  { key: "90days", label: "90 Tage", days: 90 },
];

function getDateRange(key: DateRangeKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  
  const range = DATE_RANGES.find(r => r.key === key);
  const days = range?.days ?? 7;
  
  if (days === 0) {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return { from: startOfDay.toISOString(), to };
  }
  
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to };
}

export default function AnalyticsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [dateRange, setDateRange] = useState<DateRangeKey>("7days");
  const [materialSortAsc, setMaterialSortAsc] = useState(false);

  const { from, to } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { 
    data: materialsResponse, 
    isLoading: materialsLoading,
    refetch: refetchMaterials,
    isRefetching: materialsRefetching,
  } = useQuery<{ data: MaterialData[]; groupBy: string }>({
    queryKey: ["/api/analytics/materials", { from, to }],
  });

  const { 
    data: stationsResponse, 
    isLoading: stationsLoading,
    refetch: refetchStations,
    isRefetching: stationsRefetching,
  } = useQuery<StationData[]>({
    queryKey: ["/api/analytics/stations", { from, to }],
  });

  const { 
    data: hallsResponse, 
    isLoading: hallsLoading,
    refetch: refetchHalls,
    isRefetching: hallsRefetching,
  } = useQuery<HallData[]>({
    queryKey: ["/api/analytics/halls", { from, to }],
  });

  const { 
    data: usersResponse, 
    isLoading: usersLoading,
    refetch: refetchUsers,
    isRefetching: usersRefetching,
  } = useQuery<UsersData>({
    queryKey: ["/api/analytics/users", { from, to }],
  });

  const { 
    data: leadTimesResponse, 
    isLoading: leadTimesLoading,
    refetch: refetchLeadTimes,
    isRefetching: leadTimesRefetching,
  } = useQuery<{ data: LeadTimesData | null; by: string }>({
    queryKey: ["/api/analytics/lead-times", { from, to, by: "overall" }],
  });

  const { 
    data: backlogResponse, 
    isLoading: backlogLoading,
    refetch: refetchBacklog,
    isRefetching: backlogRefetching,
  } = useQuery<BacklogResponse>({
    queryKey: ["/api/analytics/backlog"],
  });

  const isLoading = materialsLoading || stationsLoading || hallsLoading || usersLoading || leadTimesLoading || backlogLoading;
  const isRefetching = materialsRefetching || stationsRefetching || hallsRefetching || usersRefetching || leadTimesRefetching || backlogRefetching;

  const handleRefresh = () => {
    refetchMaterials();
    refetchStations();
    refetchHalls();
    refetchUsers();
    refetchLeadTimes();
    refetchBacklog();
  };

  const materials = materialsResponse?.data ?? [];
  const stations = stationsResponse ?? [];
  const halls = hallsResponse ?? [];
  const usersData = usersResponse?.data;
  const leadTimes = leadTimesResponse?.data;
  const backlog = backlogResponse;

  const sortedMaterials = useMemo(() => {
    const sorted = [...materials].sort((a, b) => {
      const aWeight = parseFloat(a.totalWeightKg || "0");
      const bWeight = parseFloat(b.totalWeightKg || "0");
      return materialSortAsc ? aWeight - bWeight : bWeight - aWeight;
    });
    return sorted;
  }, [materials, materialSortAsc]);

  const totalKg = useMemo(() => {
    return materials.reduce((sum, m) => sum + parseFloat(m.totalWeightKg || "0"), 0);
  }, [materials]);

  const totalTaskCount = useMemo(() => {
    return materials.reduce((sum, m) => sum + m.taskCount, 0);
  }, [materials]);

  const avgLeadTimeHours = useMemo(() => {
    if (!leadTimes) return null;
    const openToPickup = parseFloat(leadTimes.avgOpenToPickedUpHours || "0");
    const pickupToDropoff = parseFloat(leadTimes.avgPickedUpToDroppedOffHours || "0");
    const dropoffToDisposed = parseFloat(leadTimes.avgDroppedOffToDisposedHours || "0");
    const total = openToPickup + pickupToDropoff + dropoffToDisposed;
    return total > 0 ? total : null;
  }, [leadTimes]);

  const topMaterial = useMemo(() => {
    if (materials.length === 0) return null;
    return [...materials].sort((a, b) => 
      parseFloat(b.totalWeightKg || "0") - parseFloat(a.totalWeightKg || "0")
    )[0];
  }, [materials]);

  const openTasksCount = useMemo(() => {
    if (!backlog?.summary) return 0;
    return backlog.summary.reduce((sum, s) => sum + s.count, 0);
  }, [backlog]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  };

  const formatHours = (hours: string | null) => {
    if (!hours) return "-";
    const num = parseFloat(hours);
    if (isNaN(num)) return "-";
    if (num < 1) return `${Math.round(num * 60)} min`;
    return `${formatNumber(num)} h`;
  };

  const formatMinutes = (minutes: string | null) => {
    if (!minutes) return "-";
    const num = parseFloat(minutes);
    if (isNaN(num)) return "-";
    if (num < 60) return `${Math.round(num)} min`;
    return `${formatNumber(num / 60)} h`;
  };

  const getMaxLeadTime = () => {
    if (!leadTimes) return 24;
    const values = [
      parseFloat(leadTimes.avgOpenToPickedUpHours || "0"),
      parseFloat(leadTimes.avgPickedUpToDroppedOffHours || "0"),
      parseFloat(leadTimes.avgDroppedOffToDisposedHours || "0"),
    ];
    return Math.max(...values, 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return theme.statusOpen;
      case "PICKED_UP":
      case "IN_TRANSIT": return theme.warning;
      case "DROPPED_OFF":
      case "TAKEN_OVER":
      case "WEIGHED": return theme.info;
      default: return theme.textSecondary;
    }
  };

  if (isLoading) {
    return <LoadingScreen fullScreen message="Statistiken werden geladen..." />;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
          />
        }
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateFilters}
        >
          {DATE_RANGES.map((range) => (
            <FilterChip
              key={range.key}
              label={range.label}
              selected={dateRange === range.key}
              onPress={() => setDateRange(range.key)}
              small
            />
          ))}
        </ScrollView>

        <View style={styles.kpiGrid}>
          <Card style={{ ...styles.kpiCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIconContainer, { backgroundColor: theme.success + "20" }]}>
                <Feather name="check-circle" size={20} color={theme.success} />
              </View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Aufgaben erledigt
              </ThemedText>
              <ThemedText type="h4" style={{ color: theme.text }}>
                {formatNumber(totalTaskCount)}
              </ThemedText>
            </View>
          </Card>

          <Card style={{ ...styles.kpiCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIconContainer, { backgroundColor: theme.accent + "20" }]}>
                <Feather name="trending-up" size={20} color={theme.accent} />
              </View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Gesamt kg
              </ThemedText>
              <ThemedText type="h4" style={{ color: theme.text }}>
                {formatNumber(totalKg)}
              </ThemedText>
            </View>
          </Card>

          <Card style={{ ...styles.kpiCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIconContainer, { backgroundColor: theme.info + "20" }]}>
                <Feather name="clock" size={20} color={theme.info} />
              </View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Durchschn. Durchlauf
              </ThemedText>
              <ThemedText type="h4" style={{ color: theme.text }}>
                {avgLeadTimeHours ? `${formatNumber(avgLeadTimeHours)} h` : "-"}
              </ThemedText>
            </View>
          </Card>

          <Card style={{ ...styles.kpiCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIconContainer, { backgroundColor: openTasksCount > 0 ? theme.warning + "20" : theme.success + "20" }]}>
                <Feather name="alert-triangle" size={20} color={openTasksCount > 0 ? theme.warning : theme.success} />
              </View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Rückstand ({">"}24h)
              </ThemedText>
              <ThemedText type="h4" style={{ color: openTasksCount > 0 ? theme.warning : theme.text }}>
                {openTasksCount}
              </ThemedText>
            </View>
          </Card>
        </View>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="package" size={18} color={theme.primary} />
              <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm }}>
                Materialien
              </ThemedText>
            </View>
            <Pressable 
              onPress={() => setMaterialSortAsc(!materialSortAsc)}
              style={styles.sortButton}
            >
              <Feather 
                name={materialSortAsc ? "arrow-up" : "arrow-down"} 
                size={16} 
                color={theme.textSecondary} 
              />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                kg
              </ThemedText>
            </Pressable>
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellMaterial, { color: theme.textSecondary }]}>
              Material
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellCount, { color: theme.textSecondary }]}>
              Anzahl
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellWeight, { color: theme.textSecondary }]}>
              Gewicht
            </ThemedText>
          </View>

          {sortedMaterials.length === 0 ? (
            <View style={styles.emptyRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Keine Daten im Zeitraum
              </ThemedText>
            </View>
          ) : (
            sortedMaterials.map((material, index) => (
              <View 
                key={material.materialId || index} 
                style={[
                  styles.tableRow, 
                  index < sortedMaterials.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.divider } : null
                ]}
              >
                <ThemedText type="small" style={[styles.cellMaterial, { color: theme.text }]} numberOfLines={1}>
                  {material.materialName || "Unbekannt"}
                </ThemedText>
                <ThemedText type="small" style={[styles.cellCount, { color: theme.textSecondary }]}>
                  {material.taskCount}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.cellWeight, { color: theme.text }]}>
                  {formatNumber(parseFloat(material.totalWeightKg || "0"))}
                </ThemedText>
              </View>
            ))
          )}
        </Card>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionTitleRow}>
            <Feather name="map-pin" size={18} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm, marginBottom: Spacing.md }}>
              Stationen
            </ThemedText>
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellStation, { color: theme.textSecondary }]}>
              Station
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellCount, { color: theme.textSecondary }]}>
              Anz.
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellWeightSmall, { color: theme.textSecondary }]}>
              kg
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellLeadTime, { color: theme.textSecondary }]}>
              Zeit
            </ThemedText>
          </View>

          {stations.length === 0 ? (
            <View style={styles.emptyRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Keine Daten im Zeitraum
              </ThemedText>
            </View>
          ) : (
            stations.slice(0, 10).map((station, index) => (
              <View 
                key={`${station.stationId}-${index}`} 
                style={[
                  styles.tableRow, 
                  index < Math.min(stations.length, 10) - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.divider } : null
                ]}
              >
                <ThemedText type="small" style={[styles.cellStation, { color: theme.text }]} numberOfLines={1}>
                  {station.stationName}
                </ThemedText>
                <ThemedText type="small" style={[styles.cellCount, { color: theme.textSecondary }]}>
                  {station.taskCount}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.cellWeightSmall, { color: theme.text }]}>
                  {formatNumber(parseFloat(station.totalWeightKg || "0"))}
                </ThemedText>
                <ThemedText type="small" style={[styles.cellLeadTime, { color: theme.textSecondary }]}>
                  {formatMinutes(station.avgLeadTimeMinutes)}
                </ThemedText>
              </View>
            ))
          )}
          {stations.length > 10 ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              + {stations.length - 10} weitere
            </ThemedText>
          ) : null}
        </Card>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionTitleRow}>
            <Feather name="home" size={18} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm, marginBottom: Spacing.md }}>
              Hallen
            </ThemedText>
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellHall, { color: theme.textSecondary }]}>
              Halle
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellCount, { color: theme.textSecondary }]}>
              Anzahl
            </ThemedText>
            <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellWeight, { color: theme.textSecondary }]}>
              Gewicht
            </ThemedText>
          </View>

          {halls.length === 0 ? (
            <View style={styles.emptyRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Keine Daten im Zeitraum
              </ThemedText>
            </View>
          ) : (
            halls.map((hall, index) => (
              <View 
                key={hall.hallId || index} 
                style={[
                  styles.tableRow, 
                  index < halls.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.divider } : null
                ]}
              >
                <ThemedText type="small" style={[styles.cellHall, { color: theme.text }]} numberOfLines={1}>
                  {hall.hallName || "Unbekannt"}
                </ThemedText>
                <ThemedText type="small" style={[styles.cellCount, { color: theme.textSecondary }]}>
                  {hall.taskCount}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.cellWeight, { color: theme.text }]}>
                  {formatNumber(parseFloat(hall.totalWeightKg || "0"))}
                </ThemedText>
              </View>
            ))
          )}
        </Card>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionTitleRow}>
            <Feather name="users" size={18} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm, marginBottom: Spacing.md }}>
              Benutzer-Leistung
            </ThemedText>
          </View>

          {usersData?.byDriver && usersData.byDriver.length > 0 ? (
            <>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                Fahrer
              </ThemedText>
              <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellUser, { color: theme.textSecondary }]}>
                  Name
                </ThemedText>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellCount, { color: theme.textSecondary }]}>
                  Aufg.
                </ThemedText>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellWeight, { color: theme.textSecondary }]}>
                  kg
                </ThemedText>
              </View>
              {usersData.byDriver.slice(0, 5).map((user, index) => (
                <View 
                  key={user.userId || index} 
                  style={[
                    styles.tableRow, 
                    index < Math.min(usersData.byDriver.length, 5) - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.divider } : null
                  ]}
                >
                  <ThemedText type="small" style={[styles.cellUser, { color: theme.text }]} numberOfLines={1}>
                    {user.userName || user.userEmail || "Unbekannt"}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.cellCount, { color: theme.textSecondary }]}>
                    {user.taskCount}
                  </ThemedText>
                  <ThemedText type="smallBold" style={[styles.cellWeight, { color: theme.text }]}>
                    {formatNumber(parseFloat(user.totalWeightKg || "0"))}
                  </ThemedText>
                </View>
              ))}
            </>
          ) : null}

          {usersData?.byWeigher && usersData.byWeigher.length > 0 ? (
            <View style={{ marginTop: usersData?.byDriver?.length ? Spacing.xl : 0 }}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                Wieger
              </ThemedText>
              <View style={[styles.tableHeader, { borderBottomColor: theme.divider }]}>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellUser, { color: theme.textSecondary }]}>
                  Name
                </ThemedText>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellCount, { color: theme.textSecondary }]}>
                  Aufg.
                </ThemedText>
                <ThemedText type="captionBold" style={[styles.tableHeaderCell, styles.cellWeight, { color: theme.textSecondary }]}>
                  kg
                </ThemedText>
              </View>
              {usersData.byWeigher.slice(0, 5).map((user, index) => (
                <View 
                  key={user.userId || index} 
                  style={[
                    styles.tableRow, 
                    index < Math.min(usersData.byWeigher.length, 5) - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.divider } : null
                  ]}
                >
                  <ThemedText type="small" style={[styles.cellUser, { color: theme.text }]} numberOfLines={1}>
                    {user.userName || user.userEmail || "Unbekannt"}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.cellCount, { color: theme.textSecondary }]}>
                    {user.taskCount}
                  </ThemedText>
                  <ThemedText type="smallBold" style={[styles.cellWeight, { color: theme.text }]}>
                    {formatNumber(parseFloat(user.totalWeightKg || "0"))}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {(!usersData?.byDriver?.length && !usersData?.byWeigher?.length) ? (
            <View style={styles.emptyRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Keine Benutzerdaten im Zeitraum
              </ThemedText>
            </View>
          ) : null}
        </Card>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionTitleRow}>
            <Feather name="activity" size={18} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm, marginBottom: Spacing.md }}>
              Durchlaufzeiten
            </ThemedText>
          </View>

          {!leadTimes || leadTimes.taskCount === 0 ? (
            <View style={styles.emptyRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Keine abgeschlossenen Aufgaben im Zeitraum
              </ThemedText>
            </View>
          ) : (
            <View style={styles.leadTimesContainer}>
              <View style={styles.leadTimeRow}>
                <View style={styles.leadTimeLabel}>
                  <Feather name="inbox" size={16} color={theme.statusOpen} />
                  <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.sm, flex: 1 }}>
                    Offen → Abgeholt
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    {formatHours(leadTimes.avgOpenToPickedUpHours)}
                  </ThemedText>
                </View>
                <ProgressBar 
                  progress={parseFloat(leadTimes.avgOpenToPickedUpHours || "0") / getMaxLeadTime()}
                  color={theme.statusOpen}
                  style={{ marginTop: Spacing.xs }}
                />
              </View>

              <View style={styles.leadTimeRow}>
                <View style={styles.leadTimeLabel}>
                  <Feather name="truck" size={16} color={theme.warning} />
                  <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.sm, flex: 1 }}>
                    Abgeholt → Abgegeben
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    {formatHours(leadTimes.avgPickedUpToDroppedOffHours)}
                  </ThemedText>
                </View>
                <ProgressBar 
                  progress={parseFloat(leadTimes.avgPickedUpToDroppedOffHours || "0") / getMaxLeadTime()}
                  color={theme.warning}
                  style={{ marginTop: Spacing.xs }}
                />
              </View>

              <View style={styles.leadTimeRow}>
                <View style={styles.leadTimeLabel}>
                  <Feather name="check-circle" size={16} color={theme.success} />
                  <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.sm, flex: 1 }}>
                    Abgegeben → Entsorgt
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    {formatHours(leadTimes.avgDroppedOffToDisposedHours)}
                  </ThemedText>
                </View>
                <ProgressBar 
                  progress={parseFloat(leadTimes.avgDroppedOffToDisposedHours || "0") / getMaxLeadTime()}
                  color={theme.success}
                  style={{ marginTop: Spacing.xs }}
                />
              </View>

              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                Basierend auf {leadTimes.taskCount} abgeschlossenen Aufgaben
              </ThemedText>
            </View>
          )}
        </Card>

        <Card style={{ ...styles.sectionCard, backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="alert-triangle" size={18} color={openTasksCount > 0 ? theme.warning : theme.success} />
              <ThemedText type="h4" style={{ color: theme.text, marginLeft: Spacing.sm }}>
                Rückstand ({">"}24h)
              </ThemedText>
            </View>
            {openTasksCount > 0 ? (
              <View style={[styles.backlogBadge, { backgroundColor: theme.warning + "20" }]}>
                <ThemedText type="captionBold" style={{ color: theme.warning }}>
                  {openTasksCount} Aufgaben
                </ThemedText>
              </View>
            ) : null}
          </View>

          {!backlog || backlog.summary.length === 0 ? (
            <View style={styles.emptyRow}>
              <Feather name="check-circle" size={20} color={theme.success} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                Keine überfälligen Aufgaben
              </ThemedText>
            </View>
          ) : (
            <View style={styles.backlogContainer}>
              {backlog.summary.map((item) => (
                <View key={item.status} style={styles.backlogRow}>
                  <View style={[styles.backlogStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <ThemedText type="small" style={{ color: theme.text, flex: 1 }}>
                    {AUTOMOTIVE_TASK_STATUS_LABELS[item.status] || item.status}
                  </ThemedText>
                  <View style={[styles.backlogCount, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                    <ThemedText type="captionBold" style={{ color: getStatusColor(item.status) }}>
                      {item.count}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  dateFilters: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  kpiCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
  },
  kpiContent: {
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cellMaterial: {
    flex: 2,
    paddingRight: Spacing.sm,
  },
  cellCount: {
    width: 50,
    textAlign: "center",
  },
  cellWeight: {
    width: 70,
    textAlign: "right",
  },
  cellStation: {
    flex: 1.2,
    paddingRight: Spacing.sm,
  },
  cellWeightSmall: {
    width: 55,
    textAlign: "right",
  },
  cellLeadTime: {
    width: 55,
    textAlign: "right",
  },
  cellHall: {
    flex: 2,
    paddingRight: Spacing.sm,
  },
  cellUser: {
    flex: 2,
    paddingRight: Spacing.sm,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  leadTimesContainer: {
    gap: Spacing.lg,
  },
  leadTimeRow: {
    gap: Spacing.xs,
  },
  leadTimeLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  backlogContainer: {
    gap: Spacing.md,
  },
  backlogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  backlogStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  backlogCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  backlogBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
