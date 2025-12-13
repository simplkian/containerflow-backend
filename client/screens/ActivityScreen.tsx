import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { FilterChip } from "@/components/FilterChip";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const ACTION_LABELS: Record<string, string> = {
  'STATUS_CHANGED': 'Status geändert',
  'TASK_CREATED': 'Aufgabe erstellt',
  'WEIGHT_RECORDED': 'Gewicht erfasst',
  'PLACEMENT_CHANGED': 'Standort geändert',
  'STATUS_OPEN': 'Geöffnet',
  'STATUS_PICKED_UP': 'Abgeholt',
  'STATUS_IN_TRANSIT': 'Transport',
  'STATUS_DROPPED_OFF': 'Abgestellt',
  'STATUS_TAKEN_OVER': 'Übernommen',
  'STATUS_WEIGHED': 'Verwogen',
  'STATUS_DISPOSED': 'Entsorgt',
};

const ACTION_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  'STATUS_CHANGED': 'refresh-cw',
  'TASK_CREATED': 'plus-circle',
  'WEIGHT_RECORDED': 'activity',
  'PLACEMENT_CHANGED': 'map-pin',
  'STATUS_OPEN': 'inbox',
  'STATUS_PICKED_UP': 'package',
  'STATUS_IN_TRANSIT': 'truck',
  'STATUS_DROPPED_OFF': 'download',
  'STATUS_TAKEN_OVER': 'user-check',
  'STATUS_WEIGHED': 'activity',
  'STATUS_DISPOSED': 'check-circle',
};

type DateRangeFilter = 'today' | '7days' | '30days';

interface ActivityEvent {
  id: string;
  action: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  departmentName: string | null;
  materialName: string | null;
  stationName: string | null;
  hallName: string | null;
  boxSerial: string | null;
  details: Record<string, unknown> | null;
}

interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 20;

export default function ActivityScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [dateRange, setDateRange] = useState<DateRangeFilter>('7days');
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const to = now.toISOString();
    let from: string;

    switch (dateRange) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        from = todayStart.toISOString();
        break;
      case '7days':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = sevenDaysAgo.toISOString();
        break;
      case '30days':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        from = thirtyDaysAgo.toISOString();
        break;
      default:
        const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = defaultFrom.toISOString();
    }

    return { from, to };
  }, [dateRange]);

  const { from, to } = getDateRange();

  const queryParams = useMemo(() => ({
    from,
    to,
    page: String(page),
    limit: String(ITEMS_PER_PAGE),
  }), [from, to, page]);

  const { data, isLoading, refetch, isRefetching, isFetching } = useQuery<ActivityResponse>({
    queryKey: ['/api/activity', queryParams],
  });

  React.useEffect(() => {
    if (data?.events) {
      if (page === 1) {
        setAllEvents(data.events);
      } else {
        setAllEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = data.events.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }
    }
  }, [data, page]);

  React.useEffect(() => {
    setPage(1);
    setAllEvents([]);
  }, [dateRange]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setAllEvents([]);
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore, isFetching]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const getActionIcon = (action: string): keyof typeof Feather.glyphMap => {
    return ACTION_ICONS[action] || 'circle';
  };

  const getActionColor = (action: string) => {
    if (action.includes('DISPOSED') || action.includes('COMPLETED')) {
      return theme.statusCompleted;
    }
    if (action.includes('TRANSIT') || action.includes('PICKED_UP')) {
      return theme.warning;
    }
    if (action.includes('CREATED') || action.includes('OPEN')) {
      return theme.statusOpen;
    }
    if (action.includes('WEIGHED') || action.includes('WEIGHT')) {
      return theme.info;
    }
    return theme.primary;
  };

  const buildContextString = (event: ActivityEvent) => {
    const parts: string[] = [];
    
    if (event.materialName) {
      parts.push(event.materialName);
    }
    if (event.hallName && event.stationName) {
      parts.push(`${event.hallName} / ${event.stationName}`);
    } else if (event.stationName) {
      parts.push(event.stationName);
    } else if (event.hallName) {
      parts.push(event.hallName);
    }
    if (event.boxSerial) {
      parts.push(`Box ${event.boxSerial}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const buildActorString = (event: ActivityEvent) => {
    const parts: string[] = [];
    
    if (event.userName) {
      parts.push(event.userName);
    }
    if (event.userRole) {
      parts.push(event.userRole);
    }
    if (event.departmentName) {
      parts.push(event.departmentName);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'System';
  };

  const renderEvent = ({ item }: { item: ActivityEvent }) => {
    const actionColor = getActionColor(item.action);
    const contextString = buildContextString(item);
    const actorString = buildActorString(item);

    return (
      <Card style={styles.eventCard}>
        <View style={styles.eventRow}>
          <View style={[styles.timelineIndicator, { backgroundColor: actionColor }]}>
            <Feather name={getActionIcon(item.action)} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.eventContent}>
            <View style={styles.eventHeader}>
              <ThemedText type="captionBold" style={{ color: theme.textSecondary }}>
                {formatTimestamp(item.timestamp)}
              </ThemedText>
            </View>
            
            <ThemedText type="bodyBold" style={{ color: theme.text, marginTop: Spacing.xs }}>
              {getActionLabel(item.action)}
            </ThemedText>
            
            <View style={styles.actorRow}>
              <Feather name="user" size={12} color={theme.textSecondary} />
              <ThemedText type="small" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                {actorString}
              </ThemedText>
            </View>
            
            {contextString ? (
              <View style={styles.contextRow}>
                <Feather name="info" size={12} color={theme.textTertiary} />
                <ThemedText type="caption" numberOfLines={2} ellipsizeMode="tail" style={{ color: theme.textTertiary, marginLeft: Spacing.xs, flex: 1 }}>
                  {contextString}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    );
  };

  const renderFooter = () => {
    if (!isFetching || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
          Lade weitere Ereignisse...
        </ThemedText>
      </View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="activity"
      title="Keine Aktivitäten"
      message={
        dateRange === 'today'
          ? "Heute wurden noch keine Aktivitäten aufgezeichnet"
          : `In den letzten ${dateRange === '7days' ? '7' : '30'} Tagen wurden keine Aktivitäten gefunden`
      }
    />
  );

  if (isLoading && page === 1 && allEvents.length === 0) {
    return <LoadingScreen message="Aktivitäten werden geladen..." />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterSection, { paddingTop: headerHeight + Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterChip
            label="Heute"
            selected={dateRange === 'today'}
            onPress={() => setDateRange('today')}
          />
          <FilterChip
            label="7 Tage"
            selected={dateRange === '7days'}
            onPress={() => setDateRange('7days')}
          />
          <FilterChip
            label="30 Tage"
            selected={dateRange === '30days'}
            onPress={() => setDateRange('30days')}
          />
        </ScrollView>
        
        <View style={styles.countInfo}>
          <Feather name="list" size={14} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {data?.total !== undefined ? `${data.total} Ereignisse` : '...'}
          </ThemedText>
        </View>
      </View>

      <FlatList
        data={allEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
          allEvents.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && page === 1}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filterScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  countInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventCard: {
    marginBottom: 0,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});
