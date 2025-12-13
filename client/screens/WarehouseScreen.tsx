import React from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Alert, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { WarehouseContainer } from "@shared/schema";

export default function WarehouseScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data: containers = [], isLoading, refetch, isRefetching } = useQuery<WarehouseContainer[]>({
    queryKey: ["/api/containers/warehouse"],
  });

  const emptyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/warehouse-containers/${id}/empty`);
      return res.json();
    },
    onSuccess: () => {
      Alert.alert("Erfolg", "Container wurde geleert");
      queryClient.invalidateQueries({ queryKey: ["/api/containers/warehouse"] });
    },
    onError: (error: Error) => {
      Alert.alert("Fehler", error.message || "Container konnte nicht geleert werden");
    },
  });

  const handleEmpty = (container: WarehouseContainer) => {
    if (Platform.OS === "web") {
      if (confirm(`Container "${container.materialType}" wirklich leeren?`)) {
        emptyMutation.mutate(container.id);
      }
    } else {
      Alert.alert(
        "Container leeren",
        `Container "${container.materialType}" wirklich leeren? Aktuelle Menge: ${container.currentAmount.toFixed(0)} ${container.quantityUnit}`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Leeren", style: "destructive", onPress: () => emptyMutation.mutate(container.id) },
        ]
      );
    }
  };

  const getFillPercentage = (container: WarehouseContainer) => {
    if (container.maxCapacity <= 0) return 0;
    return Math.round((container.currentAmount / container.maxCapacity) * 100);
  };

  const getFillStatus = (percentage: number): "success" | "warning" | "critical" => {
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "success";
  };

  const getFillColor = (percentage: number) => {
    if (percentage >= 90) return theme.error;
    if (percentage >= 70) return theme.warning;
    return theme.success;
  };

  const renderContainer = ({ item }: { item: WarehouseContainer }) => {
    const fillPercentage = getFillPercentage(item);
    const fillColor = getFillColor(fillPercentage);

    return (
      <Card style={{ backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}>
        <View style={styles.containerRow}>
          <View style={[styles.fillIndicator, { backgroundColor: fillColor }]} />
          <View style={styles.containerContent}>
            <View style={styles.containerHeader}>
              <View style={styles.containerTitleRow}>
                <Feather name="archive" size={20} color={theme.primary} />
                <ThemedText type="bodyBold" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text, marginLeft: Spacing.sm, flex: 1 }}>
                  {item.materialType}
                </ThemedText>
              </View>
              <StatusBadge 
                status={getFillStatus(fillPercentage)} 
                size="small"
                label={`${fillPercentage}%`}
              />
            </View>

            <View style={styles.containerDetails}>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText type="small" numberOfLines={2} ellipsizeMode="tail" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                  {item.location}
                </ThemedText>
              </View>
              {item.warehouseZone ? (
                <View style={styles.detailRow}>
                  <Feather name="grid" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                    Zone: {item.warehouseZone}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.capacitySection}>
              <View style={[styles.capacityBar, { backgroundColor: theme.backgroundSecondary }]}>
                <View 
                  style={[
                    styles.capacityFill, 
                    { 
                      backgroundColor: fillColor,
                      width: `${Math.min(fillPercentage, 100)}%`,
                    }
                  ]} 
                />
              </View>
              <View style={styles.capacityRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
                  {item.currentAmount.toFixed(0)} / {item.maxCapacity} {item.quantityUnit}
                </ThemedText>
                {item.currentAmount > 0 ? (
                  <Pressable
                    style={[styles.emptyButton, { backgroundColor: isDark ? theme.errorLight : `${theme.error}15` }]}
                    onPress={() => handleEmpty(item)}
                    disabled={emptyMutation.isPending}
                  >
                    <Feather name="trash-2" size={14} color={theme.error} />
                    <ThemedText type="small" style={{ color: theme.error, marginLeft: Spacing.xs }}>
                      {emptyMutation.isPending ? "..." : "Leeren"}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="archive"
      title="Keine Lagercontainer"
      message="Es wurden noch keine Lagercontainer angelegt."
    />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isLoading ? (
        <LoadingScreen fullScreen={false} message="Lagercontainer werden geladen..." />
      ) : (
        <FlatList
          data={containers}
          keyExtractor={(item) => item.id}
          renderItem={renderContainer}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
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
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  containerRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  fillIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  containerContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  containerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minWidth: 0,
  },
  containerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  containerDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  capacitySection: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  capacityBar: {
    height: 8,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
