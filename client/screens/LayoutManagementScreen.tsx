import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, Modal, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Hall {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Station {
  id: string;
  name: string;
  code: string;
  hallId: string;
  isActive: boolean;
}

interface Material {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Stand {
  id: string;
  identifier: string;
  materialId: string | null;
  stationId: string;
  isActive: boolean;
}

interface Box {
  id: string;
  qrCode: string;
  standId: string | null;
  isActive: boolean;
}

type TabType = "stations" | "stands";

export default function LayoutManagementScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("stations");
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const [moveStationModalVisible, setMoveStationModalVisible] = useState(false);
  const [stationToMove, setStationToMove] = useState<Station | null>(null);
  const [targetHallId, setTargetHallId] = useState<string | null>(null);

  const [editStandModalVisible, setEditStandModalVisible] = useState(false);
  const [standToEdit, setStandToEdit] = useState<Stand | null>(null);
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);
  const [editStationId, setEditStationId] = useState<string | null>(null);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const { data: halls = [], isLoading: hallsLoading } = useQuery<Hall[]>({
    queryKey: ["/api/halls"],
  });

  const { data: allStations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: allStands = [], isLoading: standsLoading } = useQuery<Stand[]>({
    queryKey: ["/api/stands", { includeInactive: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stands?includeInactive=true");
      return response.json();
    },
  });

  const { data: allBoxes = [] } = useQuery<Box[]>({
    queryKey: ["/api/boxes", { includeInactive: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/boxes?includeInactive=true");
      return response.json();
    },
  });

  const filteredStations = selectedHallId
    ? allStations.filter((s) => s.hallId === selectedHallId)
    : allStations;

  const filteredStands = selectedStationId
    ? allStands.filter((s) => s.stationId === selectedStationId)
    : selectedHallId
    ? allStands.filter((s) => {
        const station = allStations.find((st) => st.id === s.stationId);
        return station?.hallId === selectedHallId;
      })
    : allStands;

  const moveStationMutation = useMutation({
    mutationFn: async ({ stationId, hallId }: { stationId: string; hallId: string }) => {
      const response = await apiRequest("PATCH", `/api/stations/${stationId}`, { hallId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      setMoveStationModalVisible(false);
      setStationToMove(null);
      setTargetHallId(null);
      if (Platform.OS === "web") {
        window.alert("Station erfolgreich verschoben!");
      } else {
        Alert.alert("Erfolg", "Station erfolgreich verschoben!");
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

  const editStandMutation = useMutation({
    mutationFn: async ({
      standId,
      materialId,
      stationId,
      isActive,
    }: {
      standId: string;
      materialId?: string | null;
      stationId?: string;
      isActive?: boolean;
    }) => {
      const body: any = {};
      if (materialId !== undefined) body.materialId = materialId;
      if (stationId !== undefined) body.stationId = stationId;
      if (isActive !== undefined) body.isActive = isActive;
      const response = await apiRequest("PATCH", `/api/stands/${standId}`, body);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stands", { includeInactive: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes", { includeInactive: true }] });
      setEditStandModalVisible(false);
      setStandToEdit(null);
      if (Platform.OS === "web") {
        window.alert("Stellplatz erfolgreich aktualisiert!");
      } else {
        Alert.alert("Erfolg", "Stellplatz erfolgreich aktualisiert!");
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

  const openMoveStationModal = (station: Station) => {
    setStationToMove(station);
    setTargetHallId(null);
    setMoveStationModalVisible(true);
  };

  const openEditStandModal = (stand: Stand) => {
    setStandToEdit(stand);
    setEditMaterialId(stand.materialId);
    setEditStationId(stand.stationId);
    setEditIsActive(stand.isActive);
    setEditStandModalVisible(true);
  };

  const handleMoveStation = () => {
    if (!stationToMove || !targetHallId) return;
    moveStationMutation.mutate({ stationId: stationToMove.id, hallId: targetHallId });
  };

  const handleEditStand = () => {
    if (!standToEdit) return;
    const changes: any = {};
    if (editMaterialId !== standToEdit.materialId) changes.materialId = editMaterialId;
    if (editStationId !== standToEdit.stationId) changes.stationId = editStationId;
    if (editIsActive !== standToEdit.isActive) changes.isActive = editIsActive;

    if (Object.keys(changes).length === 0) {
      if (Platform.OS === "web") {
        window.alert("Keine Änderungen vorgenommen");
      } else {
        Alert.alert("Info", "Keine Änderungen vorgenommen");
      }
      return;
    }

    editStandMutation.mutate({ standId: standToEdit.id, ...changes });
  };

  const getHallName = (hallId: string) => halls.find((h) => h.id === hallId)?.name || "Unbekannt";
  const getStationName = (stationId: string) => allStations.find((s) => s.id === stationId)?.name || "Unbekannt";
  const getMaterialName = (materialId: string | null) =>
    materialId ? materials.find((m) => m.id === materialId)?.name || "Unbekannt" : "Kein Material";

  const standHasActiveBoxes = (standId: string) =>
    allBoxes.some((b) => b.standId === standId && b.isActive);

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <Pressable
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.accent : theme.cardSurface,
          borderColor: activeTab === tab ? theme.accent : theme.border,
        },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <ThemedText
        type="bodyBold"
        style={{ color: activeTab === tab ? theme.textOnAccent : theme.text }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const FilterDropdown = ({
    label,
    options,
    selectedId,
    onSelect,
    placeholder,
  }: {
    label: string;
    options: { id: string; name: string }[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    placeholder: string;
  }) => (
    <View style={styles.filterContainer}>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
        {label}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Pressable
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedId === null ? theme.accent : theme.cardSurface,
              borderColor: selectedId === null ? theme.accent : theme.border,
            },
          ]}
          onPress={() => onSelect(null)}
        >
          <ThemedText
            type="small"
            style={{ color: selectedId === null ? theme.textOnAccent : theme.text }}
          >
            {placeholder}
          </ThemedText>
        </Pressable>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedId === opt.id ? theme.accent : theme.cardSurface,
                borderColor: selectedId === opt.id ? theme.accent : theme.border,
              },
            ]}
            onPress={() => onSelect(opt.id)}
          >
            <ThemedText
              type="small"
              style={{ color: selectedId === opt.id ? theme.textOnAccent : theme.text }}
            >
              {opt.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderStationsTab = () => (
    <View style={styles.listContainer}>
      <FilterDropdown
        label="Halle filtern"
        options={halls.map((h) => ({ id: h.id, name: `${h.code} - ${h.name}` }))}
        selectedId={selectedHallId}
        onSelect={setSelectedHallId}
        placeholder="Alle Hallen"
      />

      {stationsLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.xl }} />
      ) : filteredStations.length === 0 ? (
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xl, textAlign: "center" }}>
          Keine Stationen gefunden
        </ThemedText>
      ) : (
        halls
          .filter((h) => !selectedHallId || h.id === selectedHallId)
          .map((hall) => {
            const hallStations = filteredStations.filter((s) => s.hallId === hall.id);
            if (hallStations.length === 0) return null;
            return (
              <View key={hall.id} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <Feather name="home" size={18} color={theme.primary} />
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    {hall.code} - {hall.name}
                  </ThemedText>
                </View>
                {hallStations.map((station) => (
                  <Card
                    key={station.id}
                    style={{
                      ...styles.itemCard,
                      backgroundColor: theme.cardSurface,
                      opacity: station.isActive ? 1 : 0.6,
                    }}
                  >
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <ThemedText type="bodyBold">{station.name}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Code: {station.code}
                        </ThemedText>
                      </View>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
                        onPress={() => openMoveStationModal(station)}
                      >
                        <Feather name="move" size={16} color={theme.primary} />
                        <ThemedText type="small" style={{ color: theme.primary }}>
                          Verschieben
                        </ThemedText>
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            );
          })
      )}
    </View>
  );

  const renderStandsTab = () => (
    <View style={styles.listContainer}>
      <FilterDropdown
        label="Halle filtern"
        options={halls.map((h) => ({ id: h.id, name: `${h.code} - ${h.name}` }))}
        selectedId={selectedHallId}
        onSelect={(id) => {
          setSelectedHallId(id);
          setSelectedStationId(null);
        }}
        placeholder="Alle Hallen"
      />

      {selectedHallId ? (
        <FilterDropdown
          label="Station filtern"
          options={allStations
            .filter((s) => s.hallId === selectedHallId)
            .map((s) => ({ id: s.id, name: s.name }))}
          selectedId={selectedStationId}
          onSelect={setSelectedStationId}
          placeholder="Alle Stationen"
        />
      ) : null}

      {standsLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.xl }} />
      ) : filteredStands.length === 0 ? (
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xl, textAlign: "center" }}>
          Keine Stellplätze gefunden
        </ThemedText>
      ) : (
        allStations
          .filter((station) => {
            if (selectedStationId) return station.id === selectedStationId;
            if (selectedHallId) return station.hallId === selectedHallId;
            return true;
          })
          .map((station) => {
            const stationStands = filteredStands.filter((s) => s.stationId === station.id);
            if (stationStands.length === 0) return null;
            const hall = halls.find((h) => h.id === station.hallId);
            return (
              <View key={station.id} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <Feather name="grid" size={18} color={theme.primary} />
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    {station.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    ({hall?.code || "?"})
                  </ThemedText>
                </View>
                {stationStands.map((stand) => (
                  <Card
                    key={stand.id}
                    style={{
                      ...styles.itemCard,
                      backgroundColor: theme.cardSurface,
                      opacity: stand.isActive ? 1 : 0.6,
                    }}
                  >
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <ThemedText type="bodyBold">{stand.identifier}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {getMaterialName(stand.materialId)}
                        </ThemedText>
                        {!stand.isActive ? (
                          <View style={[styles.statusBadge, { backgroundColor: theme.error }]}>
                            <ThemedText type="small" style={{ color: theme.textOnAccent, fontSize: 10 }}>
                              Inaktiv
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
                        onPress={() => openEditStandModal(stand)}
                      >
                        <Feather name="edit-2" size={16} color={theme.primary} />
                        <ThemedText type="small" style={{ color: theme.primary }}>
                          Bearbeiten
                        </ThemedText>
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            );
          })
      )}
    </View>
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
        <View style={styles.tabsContainer}>
          <TabButton tab="stations" label="Stationen" />
          <TabButton tab="stands" label="Stellplätze" />
        </View>

        {activeTab === "stations" ? renderStationsTab() : renderStandsTab()}
      </ScrollView>

      <Modal
        visible={moveStationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveStationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardSurface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Station verschieben</ThemedText>
              <Pressable onPress={() => setMoveStationModalVisible(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {stationToMove ? (
              <>
                <ThemedText type="body" style={{ marginBottom: Spacing.md }}>
                  "{stationToMove.name}" von "{getHallName(stationToMove.hallId)}" in eine andere Halle verschieben:
                </ThemedText>

                <View style={styles.optionsList}>
                  {halls
                    .filter((h) => h.id !== stationToMove.hallId && h.isActive)
                    .map((hall) => (
                      <Pressable
                        key={hall.id}
                        style={[
                          styles.optionItem,
                          {
                            backgroundColor: targetHallId === hall.id ? theme.accent : theme.backgroundSecondary,
                            borderColor: targetHallId === hall.id ? theme.accent : theme.border,
                          },
                        ]}
                        onPress={() => setTargetHallId(hall.id)}
                      >
                        <ThemedText
                          type="body"
                          style={{ color: targetHallId === hall.id ? theme.textOnAccent : theme.text }}
                        >
                          {hall.code} - {hall.name}
                        </ThemedText>
                        {targetHallId === hall.id ? (
                          <Feather name="check" size={18} color={theme.textOnAccent} />
                        ) : null}
                      </Pressable>
                    ))}
                </View>

                <View style={styles.modalActions}>
                  <Button
                    style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => setMoveStationModalVisible(false)}
                  >
                    <ThemedText type="body" style={{ color: theme.text }}>
                      Abbrechen
                    </ThemedText>
                  </Button>
                  <Button
                    style={[
                      styles.modalButton,
                      { backgroundColor: targetHallId ? theme.accent : theme.backgroundTertiary },
                    ]}
                    onPress={handleMoveStation}
                    disabled={!targetHallId || moveStationMutation.isPending}
                  >
                    {moveStationMutation.isPending ? (
                      <ActivityIndicator color={theme.textOnAccent} size="small" />
                    ) : (
                      <ThemedText type="bodyBold" style={{ color: theme.textOnAccent }}>
                        Verschieben
                      </ThemedText>
                    )}
                  </Button>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={editStandModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditStandModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardSurface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Stellplatz bearbeiten</ThemedText>
              <Pressable onPress={() => setEditStandModalVisible(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {standToEdit ? (
              <ScrollView style={{ maxHeight: 400 }}>
                <ThemedText type="bodyBold" style={{ marginBottom: Spacing.lg }}>
                  {standToEdit.identifier}
                </ThemedText>

                {!editIsActive && standToEdit.isActive && standHasActiveBoxes(standToEdit.id) ? (
                  <View
                    style={[
                      styles.warningBanner,
                      { backgroundColor: isDark ? theme.warningLight : `${theme.warning}20`, borderColor: theme.warning },
                    ]}
                  >
                    <Feather name="alert-triangle" size={18} color={theme.warning} />
                    <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
                      Dieser Stellplatz hat aktive Boxen. Beim Deaktivieren werden alle Boxen vom Stellplatz abgemeldet.
                    </ThemedText>
                  </View>
                ) : null}

                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  Material
                </ThemedText>
                <View style={styles.optionsList}>
                  <Pressable
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: editMaterialId === null ? theme.accent : theme.backgroundSecondary,
                        borderColor: editMaterialId === null ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => setEditMaterialId(null)}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: editMaterialId === null ? theme.textOnAccent : theme.text }}
                    >
                      Kein Material
                    </ThemedText>
                  </Pressable>
                  {materials
                    .filter((m) => m.isActive)
                    .map((material) => (
                      <Pressable
                        key={material.id}
                        style={[
                          styles.optionItem,
                          {
                            backgroundColor: editMaterialId === material.id ? theme.accent : theme.backgroundSecondary,
                            borderColor: editMaterialId === material.id ? theme.accent : theme.border,
                          },
                        ]}
                        onPress={() => setEditMaterialId(material.id)}
                      >
                        <ThemedText
                          type="body"
                          style={{ color: editMaterialId === material.id ? theme.textOnAccent : theme.text }}
                        >
                          {material.code} - {material.name}
                        </ThemedText>
                        {editMaterialId === material.id ? (
                          <Feather name="check" size={18} color={theme.textOnAccent} />
                        ) : null}
                      </Pressable>
                    ))}
                </View>

                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xs }}>
                  Station
                </ThemedText>
                <View style={styles.optionsList}>
                  {allStations
                    .filter((s) => s.isActive)
                    .map((station) => {
                      const hall = halls.find((h) => h.id === station.hallId);
                      return (
                        <Pressable
                          key={station.id}
                          style={[
                            styles.optionItem,
                            {
                              backgroundColor: editStationId === station.id ? theme.accent : theme.backgroundSecondary,
                              borderColor: editStationId === station.id ? theme.accent : theme.border,
                            },
                          ]}
                          onPress={() => setEditStationId(station.id)}
                        >
                          <ThemedText
                            type="body"
                            style={{ color: editStationId === station.id ? theme.textOnAccent : theme.text }}
                          >
                            {station.name} ({hall?.code || "?"})
                          </ThemedText>
                          {editStationId === station.id ? (
                            <Feather name="check" size={18} color={theme.textOnAccent} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                </View>

                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xs }}>
                  Status
                </ThemedText>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[
                      styles.toggleOption,
                      {
                        backgroundColor: editIsActive ? theme.success : theme.backgroundSecondary,
                        borderColor: editIsActive ? theme.success : theme.border,
                      },
                    ]}
                    onPress={() => setEditIsActive(true)}
                  >
                    <Feather name="check-circle" size={16} color={editIsActive ? theme.textOnAccent : theme.textSecondary} />
                    <ThemedText
                      type="body"
                      style={{ color: editIsActive ? theme.textOnAccent : theme.text }}
                    >
                      Aktiv
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleOption,
                      {
                        backgroundColor: !editIsActive ? theme.error : theme.backgroundSecondary,
                        borderColor: !editIsActive ? theme.error : theme.border,
                      },
                    ]}
                    onPress={() => setEditIsActive(false)}
                  >
                    <Feather name="x-circle" size={16} color={!editIsActive ? theme.textOnAccent : theme.textSecondary} />
                    <ThemedText
                      type="body"
                      style={{ color: !editIsActive ? theme.textOnAccent : theme.text }}
                    >
                      Inaktiv
                    </ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setEditStandModalVisible(false)}
              >
                <ThemedText type="body" style={{ color: theme.text }}>
                  Abbrechen
                </ThemedText>
              </Button>
              <Button
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleEditStand}
                disabled={editStandMutation.isPending}
              >
                {editStandMutation.isPending ? (
                  <ActivityIndicator color={theme.textOnAccent} size="small" />
                ) : (
                  <ThemedText type="bodyBold" style={{ color: theme.textOnAccent }}>
                    Speichern
                  </ThemedText>
                )}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  listContainer: {
    gap: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minHeight: IndustrialDesign.minTouchTarget,
    justifyContent: "center",
  },
  groupContainer: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  itemCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: IndustrialDesign.minTouchTarget,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: IndustrialDesign.minTouchTarget,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButton: {
    flex: 1,
    minHeight: IndustrialDesign.buttonHeight,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: IndustrialDesign.minTouchTarget,
  },
});
