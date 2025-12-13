import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, TextInput } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
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

interface Stand {
  id: string;
  identifier: string;
  materialId: string | null;
  stationId: string;
  isActive: boolean;
}

interface StandWithMaterial {
  id: string;
  identifier: string;
  materialId: string | null;
  materialName: string | null;
  materialCode: string | null;
}

interface Box {
  id: string;
  serial: string;
  status: string;
  standId: string | null;
  qrCode: string | null;
}

interface Material {
  id: string;
  name: string;
  code: string;
}

export default function StandMappingScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
  const [boxSearchQuery, setBoxSearchQuery] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

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

  const { data: allBoxes = [], isLoading: boxesLoading } = useQuery<Box[]>({
    queryKey: ["/api/boxes"],
  });

  const { data: boxesAtStand = [], isLoading: boxesAtStandLoading, refetch: refetchBoxesAtStand } = useQuery<Box[]>({
    queryKey: ["/api/admin/stands/boxes", selectedStandId],
    queryFn: async () => {
      if (!selectedStandId) return [];
      const response = await apiRequest("GET", `/api/admin/stands/${selectedStandId}/boxes`);
      return response.json();
    },
    enabled: !!selectedStandId,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    setSelectedStationId(null);
    setSelectedStandId(null);
    setSelectedBoxId(null);
  }, [selectedHallId]);

  useEffect(() => {
    setSelectedStandId(null);
    setSelectedBoxId(null);
  }, [selectedStationId]);

  useEffect(() => {
    setSelectedBoxId(null);
    setBoxSearchQuery("");
  }, [selectedStandId]);

  const assignBoxMutation = useMutation({
    mutationFn: async ({ boxId, standId }: { boxId: string; standId: string }) => {
      const response = await apiRequest("POST", `/api/admin/stands/${standId}/assign-box`, {
        boxId,
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error(`Box ist bereits an Stellplatz "${errorData.currentStandIdentifier}" zugewiesen`);
        }
        throw new Error(errorData.error || "Zuweisung fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stands/boxes"] });
      refetchBoxesAtStand();
      setSelectedBoxId(null);
      setBoxSearchQuery("");
      const message = "Box erfolgreich zugewiesen!";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Erfolg", message);
      }
    },
    onError: (error: Error) => {
      const message = `Fehler: ${error.message}`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Fehler", message);
      }
    },
  });

  const removeBoxMutation = useMutation({
    mutationFn: async ({ boxId, standId }: { boxId: string; standId: string }) => {
      const response = await apiRequest("POST", `/api/admin/stands/${standId}/unassign-box`, {
        boxId,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Entfernung fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stands/boxes"] });
      refetchBoxesAtStand();
      const message = "Box erfolgreich entfernt!";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Erfolg", message);
      }
    },
    onError: (error: Error) => {
      const message = `Fehler: ${error.message}`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Fehler", message);
      }
    },
  });

  const selectedHall = halls.find((h) => h.id === selectedHallId);
  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const selectedStand = standsData.find((s) => s.id === selectedStandId);

  const availableBoxes = allBoxes.filter(
    (box) =>
      !box.standId &&
      box.serial.toLowerCase().includes(boxSearchQuery.toLowerCase())
  );

  const currentBoxAtStand = boxesAtStand.length > 0 ? boxesAtStand[0] : null;

  const handleAssignBox = () => {
    if (!selectedBoxId || !selectedStandId) return;
    assignBoxMutation.mutate({ boxId: selectedBoxId, standId: selectedStandId });
  };

  const handleRemoveBox = (boxId: string) => {
    if (!selectedStandId) return;
    if (Platform.OS === "web") {
      if (window.confirm("Box wirklich vom Stellplatz entfernen?")) {
        removeBoxMutation.mutate({ boxId, standId: selectedStandId });
      }
    } else {
      Alert.alert(
        "Box entfernen",
        "Box wirklich vom Stellplatz entfernen?",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Entfernen", style: "destructive", onPress: () => removeBoxMutation.mutate({ boxId, standId: selectedStandId }) },
        ]
      );
    }
  };

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
        style={{ color: selected ? theme.textOnAccent : theme.text }}
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
            <Feather name="map-pin" size={20} color={theme.primary} />
            <ThemedText type="h4" style={{ color: theme.primary }}>
              3. Stellplatz auswählen
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
              Keine Stellplätze in dieser Station
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

        {selectedStandId ? (
          <>
            <Card style={{ ...styles.card, backgroundColor: theme.cardSurface }}>
              <View style={styles.sectionHeader}>
                <Feather name="info" size={20} color={theme.primary} />
                <ThemedText type="h4" style={{ color: theme.primary }}>
                  Stellplatz-Details
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Stellplatz:
                </ThemedText>
                <ThemedText type="bodyBold">
                  {selectedStand?.identifier}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Material:
                </ThemedText>
                <ThemedText type="body">
                  {selectedStand?.materialName || "Nicht zugewiesen"}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.sectionHeader}>
                <Feather name="box" size={20} color={theme.primary} />
                <ThemedText type="bodyBold" style={{ color: theme.primary }}>
                  Aktuelle Box
                </ThemedText>
              </View>

              {boxesAtStandLoading ? (
                <ActivityIndicator color={theme.accent} />
              ) : currentBoxAtStand ? (
                <View style={styles.boxCard}>
                  <View style={styles.boxInfo}>
                    <Feather name="box" size={24} color={theme.success} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="bodyBold">{currentBoxAtStand.serial}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Status: {currentBoxAtStand.status}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textTertiary, fontFamily: 'monospace' }}>
                        stand_id: {currentBoxAtStand.standId || 'null'}
                      </ThemedText>
                    </View>
                    <StatusBadge status="success" size="small" label="Belegt" />
                  </View>
                  <Button
                    style={[styles.removeButton, { backgroundColor: theme.error }]}
                    onPress={() => handleRemoveBox(currentBoxAtStand.id)}
                    disabled={removeBoxMutation.isPending}
                  >
                    {removeBoxMutation.isPending ? (
                      <ActivityIndicator size="small" color={theme.textOnPrimary} />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Feather name="x-circle" size={18} color={theme.textOnPrimary} />
                        <ThemedText type="body" style={{ color: theme.textOnPrimary }}>
                          Box entfernen
                        </ThemedText>
                      </View>
                    )}
                  </Button>
                </View>
              ) : (
                <View style={[styles.emptyBox, { backgroundColor: isDark ? theme.backgroundSecondary : `${theme.warning}10`, borderColor: theme.warning }]}>
                  <Feather name="alert-circle" size={20} color={theme.warning} />
                  <ThemedText type="body" style={{ color: theme.warning }}>
                    Keine Box zugewiesen
                  </ThemedText>
                </View>
              )}
            </Card>

            {!currentBoxAtStand ? (
              <Card style={{ ...styles.card, backgroundColor: theme.cardSurface }}>
                <View style={styles.sectionHeader}>
                  <Feather name="plus-circle" size={20} color={theme.accent} />
                  <ThemedText type="h4" style={{ color: theme.accent }}>
                    Box zuweisen
                  </ThemedText>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <Feather name="search" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Box-Seriennummer suchen..."
                    placeholderTextColor={theme.textSecondary}
                    value={boxSearchQuery}
                    onChangeText={setBoxSearchQuery}
                  />
                </View>

                {boxesLoading ? (
                  <ActivityIndicator color={theme.accent} />
                ) : availableBoxes.length === 0 ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                    {boxSearchQuery ? "Keine passenden verfügbaren Boxen gefunden" : "Keine verfügbaren Boxen (ohne Stellplatz)"}
                  </ThemedText>
                ) : (
                  <View style={styles.boxList}>
                    {availableBoxes.slice(0, 10).map((box) => (
                      <DropdownItem
                        key={box.id}
                        label={box.serial}
                        selected={selectedBoxId === box.id}
                        onPress={() => setSelectedBoxId(box.id)}
                      />
                    ))}
                    {availableBoxes.length > 10 ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                        + {availableBoxes.length - 10} weitere Boxen (Suche eingrenzen)
                      </ThemedText>
                    ) : null}
                  </View>
                )}

                {selectedBoxId ? (
                  <Button
                    style={[styles.assignButton, { backgroundColor: theme.accent }]}
                    onPress={handleAssignBox}
                    disabled={assignBoxMutation.isPending}
                  >
                    {assignBoxMutation.isPending ? (
                      <ActivityIndicator size="small" color={theme.textOnAccent} />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Feather name="check-circle" size={18} color={theme.textOnAccent} />
                        <ThemedText type="bodyBold" style={{ color: theme.textOnAccent }}>
                          Box zuweisen
                        </ThemedText>
                      </View>
                    )}
                  </Button>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  boxCard: {
    gap: Spacing.md,
  },
  boxInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  boxList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  removeButton: {
    minHeight: IndustrialDesign.buttonHeight,
  },
  assignButton: {
    marginTop: Spacing.lg,
    minHeight: IndustrialDesign.buttonHeight,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
