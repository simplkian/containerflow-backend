import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { TasksStackParamList } from "@/navigation/TasksStackNavigator";
import { AUTOMOTIVE_TASK_STATUS_LABELS } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<TasksStackParamList, "Tasks">;

type CategoryTab = "offen" | "unterwegs" | "abgestellt" | "entsorgung" | "abgeschlossen" | "geplant";

const CATEGORY_CONFIG: Record<CategoryTab, { label: string; statuses: string[]; icon: keyof typeof Feather.glyphMap }> = {
  offen: { label: "Offen", statuses: ["OPEN"], icon: "inbox" },
  unterwegs: { label: "Unterwegs", statuses: ["PICKED_UP", "IN_TRANSIT"], icon: "truck" },
  abgestellt: { label: "Abgestellt", statuses: ["DROPPED_OFF"], icon: "download" },
  entsorgung: { label: "Entsorgung", statuses: ["TAKEN_OVER", "WEIGHED"], icon: "activity" },
  abgeschlossen: { label: "Abgeschlossen", statuses: ["DISPOSED", "CANCELLED"], icon: "check-circle" },
  geplant: { label: "Geplant", statuses: [], icon: "calendar" },
};

const CLAIM_TTL_MINUTES = 30;

interface TaskWithDetails {
  id: string;
  title?: string | null;
  description?: string | null;
  status: string;
  taskType?: string | null;
  priority?: string | null;
  boxId?: string | null;
  standId?: string | null;
  scheduledFor?: string | Date | null;
  createdAt: string | Date;
  claimedAt?: string | Date | null;
  claimedByUserId?: string | null;
  weightKg?: number | null;
  stand?: { id: string; identifier: string; stationId: string } | null;
  station?: { id: string; name: string; hallId: string } | null;
  hall?: { id: string; name: string; code: string } | null;
  material?: { id: string; name: string; code: string } | null;
  claimedByUser?: { id: string; name: string; email: string } | null;
}

export default function AutomotiveTasksScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<CategoryTab>("offen");

  const { data: allTasks = [], isLoading, refetch, isRefetching } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/automotive/tasks"],
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const categorizedTasks = useMemo(() => {
    const result: Record<CategoryTab, TaskWithDetails[]> = {
      offen: [],
      unterwegs: [],
      abgestellt: [],
      entsorgung: [],
      abgeschlossen: [],
      geplant: [],
    };

    allTasks.forEach((task) => {
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null;
      const isScheduledForFuture = scheduledFor && scheduledFor >= tomorrow;

      if (task.status === "OPEN" && isScheduledForFuture) {
        result.geplant.push(task);
      } else if (CATEGORY_CONFIG.offen.statuses.includes(task.status)) {
        result.offen.push(task);
      } else if (CATEGORY_CONFIG.unterwegs.statuses.includes(task.status)) {
        result.unterwegs.push(task);
      } else if (CATEGORY_CONFIG.abgestellt.statuses.includes(task.status)) {
        result.abgestellt.push(task);
      } else if (CATEGORY_CONFIG.entsorgung.statuses.includes(task.status)) {
        result.entsorgung.push(task);
      } else if (CATEGORY_CONFIG.abgeschlossen.statuses.includes(task.status)) {
        result.abgeschlossen.push(task);
      }
    });

    result.offen.sort((a, b) => {
      const aScheduled = a.scheduledFor ? new Date(a.scheduledFor) : null;
      const bScheduled = b.scheduledFor ? new Date(b.scheduledFor) : null;
      const aIsToday = aScheduled && aScheduled >= today && aScheduled < tomorrow;
      const bIsToday = bScheduled && bScheduled >= today && bScheduled < tomorrow;
      
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    result.geplant.sort((a, b) => {
      const aDate = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const bDate = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return aDate - bDate;
    });

    return result;
  }, [allTasks, today, tomorrow]);

  const taskCounts = useMemo(() => ({
    offen: categorizedTasks.offen.length,
    unterwegs: categorizedTasks.unterwegs.length,
    abgestellt: categorizedTasks.abgestellt.length,
    entsorgung: categorizedTasks.entsorgung.length,
    abgeschlossen: categorizedTasks.abgeschlossen.length,
    geplant: categorizedTasks.geplant.length,
  }), [categorizedTasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return theme.statusOpen;
      case "PICKED_UP":
      case "IN_TRANSIT": return theme.warning;
      case "DROPPED_OFF": return theme.info;
      case "TAKEN_OVER":
      case "WEIGHED": return theme.accent;
      case "DISPOSED": return theme.statusCompleted;
      case "CANCELLED": return theme.statusCancelled;
      default: return theme.statusOpen;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Feather.glyphMap => {
    switch (status) {
      case "OPEN": return "inbox";
      case "PICKED_UP": return "package";
      case "IN_TRANSIT": return "truck";
      case "DROPPED_OFF": return "download";
      case "TAKEN_OVER": return "user-check";
      case "WEIGHED": return "activity";
      case "DISPOSED": return "check-circle";
      case "CANCELLED": return "x-circle";
      default: return "circle";
    }
  };

  const getClaimInfo = (task: TaskWithDetails) => {
    if (!task.claimedByUser || !task.claimedAt) return null;

    const claimedAt = new Date(task.claimedAt);
    const expiryTime = new Date(claimedAt.getTime() + CLAIM_TTL_MINUTES * 60 * 1000);
    const now = new Date();
    const remainingMs = expiryTime.getTime() - now.getTime();
    
    if (remainingMs <= 0) return null;

    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return {
      userName: task.claimedByUser.name,
      remainingMinutes,
      isExpiringSoon: remainingMinutes <= 5,
    };
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    const day = d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return `${day}, ${time}`;
  };

  const getLocationString = (task: TaskWithDetails) => {
    const parts = [];
    if (task.hall) parts.push(task.hall.code);
    if (task.station) parts.push(task.station.name);
    if (task.stand) parts.push(task.stand.identifier);
    return parts.length > 0 ? parts.join(" / ") : "Unbekannter Standort";
  };

  const renderTask = ({ item }: { item: TaskWithDetails }) => {
    const statusLabel = AUTOMOTIVE_TASK_STATUS_LABELS[item.status] || item.status;
    const claimInfo = getClaimInfo(item);
    const scheduledFor = item.scheduledFor ? new Date(item.scheduledFor) : null;
    const isScheduledToday = scheduledFor && scheduledFor >= today && scheduledFor < tomorrow;

    return (
      <Card
        style={{ backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}
        onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
      >
        <View style={styles.taskRow}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <View style={styles.taskContent}>
            <View style={styles.taskMainInfo}>
              <View style={styles.taskTitleRow}>
                <Feather name={getStatusIcon(item.status)} size={18} color={getStatusColor(item.status)} />
                <ThemedText type="bodyBold" style={{ color: theme.text, marginLeft: Spacing.sm, flex: 1 }} numberOfLines={1}>
                  {item.title || `Aufgabe ${item.id.substring(0, 8)}`}
                </ThemedText>
                {isScheduledToday ? (
                  <View style={[styles.todayBadge, { backgroundColor: theme.accent }]}>
                    <ThemedText type="captionBold" style={{ color: theme.textOnAccent }}>
                      Heute
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                <ThemedText type="captionBold" style={{ color: getStatusColor(item.status) }}>
                  {statusLabel}
                </ThemedText>
              </View>

              <View style={styles.taskLocation}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.xs, flex: 1 }} numberOfLines={1}>
                  {getLocationString(item)}
                </ThemedText>
              </View>

              {claimInfo ? (
                <View style={[
                  styles.claimBadge, 
                  { backgroundColor: claimInfo.isExpiringSoon ? theme.warning + "20" : theme.info + "20" }
                ]}>
                  <Feather 
                    name="user" 
                    size={12} 
                    color={claimInfo.isExpiringSoon ? theme.warning : theme.info} 
                  />
                  <ThemedText 
                    type="caption" 
                    style={{ 
                      color: claimInfo.isExpiringSoon ? theme.warning : theme.info, 
                      marginLeft: Spacing.xs 
                    }}
                  >
                    {claimInfo.userName} ({claimInfo.remainingMinutes} Min.)
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    {formatDateTime(item.createdAt) || "Unbekannt"}
                  </ThemedText>
                </View>
                {item.material ? (
                  <View style={styles.metaItem}>
                    <Feather name="box" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {item.material.name}
                    </ThemedText>
                  </View>
                ) : null}
                {item.weightKg ? (
                  <View style={styles.metaItem}>
                    <Feather name="activity" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {item.weightKg} kg
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.chevronContainer}>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case "offen": return "Keine offenen Aufgaben vorhanden";
      case "unterwegs": return "Keine Aufgaben unterwegs";
      case "abgestellt": return "Keine abgestellten Aufgaben";
      case "entsorgung": return "Keine Aufgaben in Entsorgung";
      case "abgeschlossen": return "Keine abgeschlossenen Aufgaben";
      case "geplant": return "Keine geplanten Aufgaben";
      default: return "Keine Aufgaben vorhanden";
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      icon={CATEGORY_CONFIG[activeTab].icon}
      title="Keine Aufgaben"
      message={getEmptyStateMessage()}
    />
  );

  const CategoryTabButton = ({ tab }: { tab: CategoryTab }) => {
    const isSelected = activeTab === tab;
    const config = CATEGORY_CONFIG[tab];
    const count = taskCounts[tab];

    return (
      <Pressable
        style={[
          styles.tabButton,
          {
            backgroundColor: isSelected ? theme.primary : theme.cardSurface,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Feather 
          name={config.icon} 
          size={16} 
          color={isSelected ? theme.textOnPrimary : theme.textSecondary} 
        />
        <ThemedText
          type="smallBold"
          numberOfLines={1}
          style={{ color: isSelected ? theme.textOnPrimary : theme.text, marginLeft: Spacing.xs }}
        >
          {config.label}
        </ThemedText>
        <View style={[
          styles.countBadge,
          { backgroundColor: isSelected ? theme.accent : theme.backgroundSecondary }
        ]}>
          <ThemedText
            type="captionBold"
            numberOfLines={1}
            style={{ color: isSelected ? theme.textOnAccent : theme.text }}
          >
            {count}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabContainer, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <CategoryTabButton tab="offen" />
          <CategoryTabButton tab="unterwegs" />
          <CategoryTabButton tab="abgestellt" />
          <CategoryTabButton tab="entsorgung" />
          <CategoryTabButton tab="abgeschlossen" />
          <CategoryTabButton tab="geplant" />
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingScreen fullScreen={false} message="Aufgaben werden geladen..." />
      ) : (
        <FlatList
          data={categorizedTasks[activeTab]}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    paddingVertical: Spacing.md,
  },
  tabScrollContent: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  tabButton: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 40,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    minWidth: 24,
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  taskMainInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  taskLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  claimBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronContainer: {
    paddingLeft: Spacing.sm,
  },
});
