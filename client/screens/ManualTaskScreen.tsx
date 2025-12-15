import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { Pressable } from "react-native";

interface Hall {
  id: string;
  name: string;
  code: string;
}

interface Station {
  id: string;
  name: string;
  hallId: string;
}

interface StandWithMaterial {
  id: string;
  identifier: string;
  materialId: string | null;
  materialName: string | null;
  materialCode: string | null;
}

export default function ManualTaskScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const { data: halls = [], isLoading: hallsLoading } = useQuery<Hall[]>({
    queryKey: ["/api/halls"],
  });

  const { data: stations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations", { hallId: selectedHallId }],
    queryFn: async () => {
      if (!selectedHallId) return [];
      const response = await apiRequest("GET", `/api/stations?hallId=${selectedHallId}`);
      return response.json();
    },
    enabled: !!selectedHallId,
  });

  const { data: standsData = [], isLoading: standsLoading } = useQuery<StandWithMaterial[]>({
    queryKey: ["/api/admin/stands-with-materials", { stationId: selectedStationId }],
    queryFn: async () => {
      if (!selectedStationId) return [];
      const response = await apiRequest("GET", `/api/admin/stands-with-materials?stationId=${selectedStationId}`);
      return response.json();
    },
    enabled: !!selectedStationId,
  });

  useEffect(() => {
    setSelectedStationId(null);
    setSelectedStandId(null);
  }, [selectedHallId]);

  useEffect(() => {
    setSelectedStandId(null);
  }, [selectedStationId]);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/tasks", {
        hallId: selectedHallId,
        stationId: selectedStationId,
        standId: selectedStandId,
        scheduledFor: scheduledDate?.toISOString() || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (Platform.OS === "web") {
        window.alert("Aufgabe erfolgreich erstellt!");
      } else {
        Alert.alert("Erfolg", "Aufgabe erfolgreich erstellt!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
      if (Platform.OS === "web") {
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      if (Platform.OS === "web") {
        window.alert(`Fehler: ${error.message}`);
      } else {
        Alert.alert("Fehler", error.message);
      }
    },
  });

  const selectedHall = halls.find((h) => h.id === selectedHallId);
  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const selectedStand = standsData.find((s) => s.id === selectedStandId);

  const canSubmit = selectedHallId && selectedStationId && selectedStandId;

  const DropdownItem = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={[
        styles.dropdownItem,
        {
          backgroundColor: selected ? theme.accent : theme.cardSurface,
          borderColor: selected ? theme.accent : theme.cardBorder,
        },
      ]}
      onPress={onPress}
    >
      <ThemedText
        type="body"
        style={{ color: selected ? theme.textOnAccent : theme.textPrimary }}
      >
        {label}
      </ThemedText>
      {selected ? (
        <Feather name="check" size={18} color={theme.textOnAccent} />
      ) : null}
    </Pressable>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ ...styles.card, backgroundColor: theme.cardSurface }}>
          <View style={styles.sectionHeader}>
            <Feather name="home" size={20} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.primary }}>
              1. Halle auswählen
            </ThemedText>
          </View>
          {hallsLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : halls.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Keine Hallen verfügbar
            </ThemedText>
          ) : (
            <View style={styles.dropdownList}>
              {halls.map((hall) => (
                <DropdownItem
                  key={hall.id}
                  label={`${hall.code} - ${hall.name}`}
                  selected={selectedHallId === hall.id}
                  onPress={() => setSelectedHallId(hall.id)}
                />
              ))}
            </View>
          )}
        </Card>

        <Card style={{ ...styles.card, backgroundColor: theme.cardSurface, opacity: selectedHallId ? 1 : 0.5 }}>
          <View style={styles.sectionHeader}>
            <Feather name="grid" size={20} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.primary }}>
              2. Station auswählen
            </ThemedText>
          </View>
          {!selectedHallId ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Bitte zuerst eine Halle auswählen
            </ThemedText>
          ) : stationsLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : stations.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Keine Stationen in dieser Halle
            </ThemedText>
          ) : (
            <View style={styles.dropdownList}>
              {stations.map((station) => (
                <DropdownItem
                  key={station.id}
                  label={station.name}
                  selected={selectedStationId === station.id}
                  onPress={() => setSelectedStationId(station.id)}
                />
              ))}
            </View>
          )}
        </Card>

        <Card style={{ ...styles.card, backgroundColor: theme.cardSurface, opacity: selectedStationId ? 1 : 0.5 }}>
          <View style={styles.sectionHeader}>
            <Feather name="box" size={20} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.primary }}>
              3. Stand auswählen
            </ThemedText>
          </View>
          {!selectedStationId ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Bitte zuerst eine Station auswählen
            </ThemedText>
          ) : standsLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : standsData.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Keine Stände in dieser Station
            </ThemedText>
          ) : (
            <View style={styles.dropdownList}>
              {standsData.map((stand) => (
                <DropdownItem
                  key={stand.id}
                  label={`${stand.identifier}${stand.materialName ? ` (${stand.materialName})` : ""}`}
                  selected={selectedStandId === stand.id}
                  onPress={() => setSelectedStandId(stand.id)}
                />
              ))}
            </View>
          )}
        </Card>

        {canSubmit ? (
          <Card style={{ ...styles.summaryCard, backgroundColor: isDark ? theme.successLight : `${theme.success}10`, borderColor: theme.success }}>
            <View style={styles.summaryHeader}>
              <Feather name="check-circle" size={20} color={theme.success} />
              <ThemedText type="bodyBold" style={{ color: theme.success }}>
                Zusammenfassung
              </ThemedText>
            </View>
            <View style={styles.summaryContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Halle: {selectedHall?.code} - {selectedHall?.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Station: {selectedStation?.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Stand: {selectedStand?.identifier}
                {selectedStand?.materialName ? ` (${selectedStand.materialName})` : ""}
              </ThemedText>
            </View>
          </Card>
        ) : null}

        <Button
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? theme.accent : theme.backgroundTertiary,
              opacity: canSubmit ? 1 : 0.5,
            },
          ]}
          onPress={() => createTaskMutation.mutate()}
          disabled={!canSubmit || createTaskMutation.isPending}
        >
          {createTaskMutation.isPending ? (
            <ActivityIndicator color={theme.textOnAccent} />
          ) : (
            <View style={styles.buttonContent}>
              <Feather name="plus-circle" size={20} color={theme.textOnAccent} />
              <ThemedText type="bodyBold" style={{ color: theme.textOnAccent }}>
                Aufgabe erstellen
              </ThemedText>
            </View>
          )}
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dropdownList: {
    gap: Spacing.sm,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: IndustrialDesign.minTouchTarget,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryContent: {
    gap: Spacing.xs,
  },
  submitButton: {
    minHeight: IndustrialDesign.buttonHeight,
    marginTop: Spacing.md,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
