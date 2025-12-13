import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  LayoutChangeEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest } from "@/lib/query-client";

const OutdoorMap = require("../../assets/images/OUT_1765592733817.png");
const K13Map = require("../../assets/images/K13_1765592733815.png");
const K18Map = require("../../assets/images/K18_1765592733816.png");
const K19Map = require("../../assets/images/K19_1765592733816.png");
const K25Map = require("../../assets/images/K25_1765592733817.png");

interface HallData {
  id: string;
  code: string;
  name: string;
  mapMarker: { x: number; y: number } | null;
}

interface StationData {
  id: string;
  code: string;
  name: string;
  hallId: string;
  hallCode: string;
  position: { x: number; y: number } | null;
}

interface MapEditorData {
  halls: HallData[];
  stations: StationData[];
  missing: {
    halls: HallData[];
    stations: StationData[];
  };
}

type EditorMode = "hall" | "station";

const hallFloorPlans: Record<string, any> = {
  K13: K13Map,
  K18: K18Map,
  K19: K19Map,
  K25: K25Map,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAP_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const MAP_ASPECT_RATIO = 1.2;
const MAP_HEIGHT = MAP_WIDTH / MAP_ASPECT_RATIO;

export default function MapEditorScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [editorMode, setEditorMode] = useState<EditorMode>("hall");
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDropdown, setShowDropdown] = useState<"mode" | "hall" | "station" | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const crosshairOpacity = useSharedValue(0);

  const { data: mapData, isLoading, error } = useQuery<MapEditorData>({
    queryKey: ["/api/admin/map-editor/data"],
  });

  const hallMarkerMutation = useMutation({
    mutationFn: async ({ hallId, x, y }: { hallId: string; x: number | null; y: number | null }) => {
      await apiRequest("PATCH", `/api/admin/halls/${hallId}/map-marker`, { x, y });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/map-editor/data"] });
      setTapPosition(null);
    },
  });

  const stationPositionMutation = useMutation({
    mutationFn: async ({ stationId, x, y }: { stationId: string; x: number | null; y: number | null }) => {
      await apiRequest("PATCH", `/api/admin/stations/${stationId}/position`, { x, y });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/map-editor/data"] });
      setTapPosition(null);
    },
  });

  const handleMapLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMapDimensions({ width, height });
  }, []);

  const handleTap = useCallback((x: number, y: number) => {
    const normalizedX = Math.max(0, Math.min(1, x / mapDimensions.width));
    const normalizedY = Math.max(0, Math.min(1, y / mapDimensions.height));
    setTapPosition({ x: normalizedX, y: normalizedY });
  }, [mapDimensions]);

  const handleSaveMarker = useCallback(() => {
    if (!tapPosition) return;

    if (editorMode === "hall" && selectedHallId) {
      hallMarkerMutation.mutate({
        hallId: selectedHallId,
        x: tapPosition.x,
        y: tapPosition.y,
      });
    } else if (editorMode === "station" && selectedStationId) {
      stationPositionMutation.mutate({
        stationId: selectedStationId,
        x: tapPosition.x,
        y: tapPosition.y,
      });
    }
  }, [tapPosition, editorMode, selectedHallId, selectedStationId, hallMarkerMutation, stationPositionMutation]);

  const handleRemoveMarker = useCallback(() => {
    if (editorMode === "hall" && selectedHallId) {
      hallMarkerMutation.mutate({
        hallId: selectedHallId,
        x: null,
        y: null,
      });
    } else if (editorMode === "station" && selectedStationId) {
      stationPositionMutation.mutate({
        stationId: selectedStationId,
        x: null,
        y: null,
      });
    }
  }, [editorMode, selectedHallId, selectedStationId, hallMarkerMutation, stationPositionMutation]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = Math.max(1, Math.min(3, scale.value));
      scale.value = withSpring(savedScale.value, { damping: 15 });
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      const maxTranslate = (scale.value - 1) * mapDimensions.width / 2;
      savedTranslateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateX.value));
      savedTranslateY.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateY.value));
      translateX.value = withSpring(savedTranslateX.value, { damping: 15 });
      translateY.value = withSpring(savedTranslateY.value, { damping: 15 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      const adjustedX = (e.x - translateX.value) / scale.value;
      const adjustedY = (e.y - translateY.value) / scale.value;
      runOnJS(handleTap)(adjustedX, adjustedY);
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(pinchGesture, panGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const crosshairStyle = useAnimatedStyle(() => ({
    opacity: crosshairOpacity.value,
  }));

  const selectedHall = useMemo(() => {
    if (!mapData || !selectedHallId) return null;
    return mapData.halls.find((h) => h.id === selectedHallId) || null;
  }, [mapData, selectedHallId]);

  const selectedStation = useMemo(() => {
    if (!mapData || !selectedStationId) return null;
    return mapData.stations.find((s) => s.id === selectedStationId) || null;
  }, [mapData, selectedStationId]);

  const stationsForSelectedHall = useMemo(() => {
    if (!mapData || !selectedHallId || editorMode !== "station") return [];
    return mapData.stations.filter((s) => s.hallId === selectedHallId);
  }, [mapData, selectedHallId, editorMode]);

  const hallsWithFloorPlans = useMemo(() => {
    if (!mapData) return [];
    return mapData.halls.filter((h) => hallFloorPlans[h.code]);
  }, [mapData]);

  const hallsExcludingOut = useMemo(() => {
    if (!mapData) return [];
    return mapData.halls.filter((h) => h.code !== "OUT");
  }, [mapData]);

  const currentMapImage = useMemo(() => {
    if (editorMode === "station" && selectedHall) {
      return hallFloorPlans[selectedHall.code] || OutdoorMap;
    }
    return OutdoorMap;
  }, [editorMode, selectedHall]);

  const renderDropdown = (
    type: "mode" | "hall" | "station",
    options: { id: string; label: string }[],
    selectedValue: string | null,
    onSelect: (id: string) => void,
    placeholder: string
  ) => {
    const isOpen = showDropdown === type;
    return (
      <View style={styles.dropdownContainer}>
        <Pressable
          style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          onPress={() => setShowDropdown(isOpen ? null : type)}
        >
          <ThemedText style={styles.dropdownText}>
            {selectedValue
              ? options.find((o) => o.id === selectedValue)?.label || placeholder
              : placeholder}
          </ThemedText>
          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
        </Pressable>
        {isOpen ? (
          <View style={[styles.dropdownMenu, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    selectedValue === option.id && { backgroundColor: theme.backgroundSecondary },
                  ]}
                  onPress={() => {
                    onSelect(option.id);
                    setShowDropdown(null);
                  }}
                >
                  <ThemedText style={styles.dropdownItemText}>{option.label}</ThemedText>
                  {selectedValue === option.id ? (
                    <Feather name="check" size={16} color={theme.accent} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText style={styles.loadingText}>Kartendaten werden geladen...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !mapData) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="map"
          title="Kartendaten nicht verfügbar"
          message="Die Kartendaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut."
        />
      </ThemedView>
    );
  }

  const isMutating = hallMarkerMutation.isPending || stationPositionMutation.isPending;
  const hasSelection = editorMode === "hall" ? !!selectedHallId : !!selectedStationId;
  const currentMarker = editorMode === "hall" ? selectedHall?.mapMarker : selectedStation?.position;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>Karten-Editor</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Marker für Hallen und Stationen setzen
            </ThemedText>
          </View>

          <View style={styles.controls}>
            {renderDropdown(
              "mode",
              [
                { id: "hall", label: "Hallenmarker setzen" },
                { id: "station", label: "Stationsmarker setzen" },
              ],
              editorMode,
              (id) => {
                setEditorMode(id as EditorMode);
                setSelectedHallId(null);
                setSelectedStationId(null);
                setTapPosition(null);
              },
              "Modus wählen"
            )}

            {editorMode === "hall" ? (
              renderDropdown(
                "hall",
                hallsExcludingOut.map((h) => ({ id: h.id, label: `${h.code} - ${h.name}` })),
                selectedHallId,
                (id) => {
                  setSelectedHallId(id);
                  setTapPosition(null);
                },
                "Halle wählen"
              )
            ) : (
              <>
                {renderDropdown(
                  "hall",
                  hallsWithFloorPlans.map((h) => ({ id: h.id, label: `${h.code} - ${h.name}` })),
                  selectedHallId,
                  (id) => {
                    setSelectedHallId(id);
                    setSelectedStationId(null);
                    setTapPosition(null);
                  },
                  "Halle wählen"
                )}
                {selectedHallId ? (
                  renderDropdown(
                    "station",
                    stationsForSelectedHall.map((s) => ({ id: s.id, label: `${s.code} - ${s.name}` })),
                    selectedStationId,
                    (id) => {
                      setSelectedStationId(id);
                      setTapPosition(null);
                    },
                    "Station wählen"
                  )
                ) : null}
              </>
            )}
          </View>

          <Card style={styles.mapCard}>
            <View style={styles.mapWrapper}>
              <GestureDetector gesture={composedGesture}>
                <Animated.View
                  style={[styles.mapContainer, animatedStyle]}
                  onLayout={handleMapLayout}
                >
                  <Image source={currentMapImage} style={styles.mapImage} contentFit="fill" />

                  {editorMode === "hall" ? (
                    mapData.halls
                      .filter((h) => h.mapMarker && h.code !== "OUT")
                      .map((hall) => {
                        const { x, y } = hall.mapMarker!;
                        const isSelected = hall.id === selectedHallId;
                        return (
                          <View
                            key={hall.id}
                            style={[
                              styles.marker,
                              styles.hallMarker,
                              {
                                left: x * mapDimensions.width - 20,
                                top: y * mapDimensions.height - 20,
                                backgroundColor: isSelected ? theme.accent : theme.primary,
                                borderWidth: isSelected ? 3 : 0,
                                borderColor: "#FFFFFF",
                              },
                            ]}
                          >
                            <ThemedText style={styles.markerLabel}>{hall.code}</ThemedText>
                          </View>
                        );
                      })
                  ) : (
                    stationsForSelectedHall
                      .filter((s) => s.position)
                      .map((station) => {
                        const { x, y } = station.position!;
                        const isSelected = station.id === selectedStationId;
                        return (
                          <View
                            key={station.id}
                            style={[
                              styles.marker,
                              styles.stationMarker,
                              {
                                left: x * mapDimensions.width - 16,
                                top: y * mapDimensions.height - 16,
                                backgroundColor: isSelected ? theme.accent : theme.info,
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: "#FFFFFF",
                              },
                            ]}
                          >
                            <Feather name="target" size={16} color="#FFFFFF" />
                          </View>
                        );
                      })
                  )}

                  {tapPosition ? (
                    <View
                      style={[
                        styles.crosshair,
                        {
                          left: tapPosition.x * mapDimensions.width - 20,
                          top: tapPosition.y * mapDimensions.height - 20,
                        },
                      ]}
                    >
                      <View style={[styles.crosshairVertical, { backgroundColor: theme.error }]} />
                      <View style={[styles.crosshairHorizontal, { backgroundColor: theme.error }]} />
                      <View style={[styles.crosshairCenter, { backgroundColor: theme.error }]} />
                    </View>
                  ) : null}
                </Animated.View>
              </GestureDetector>
            </View>

            <View style={styles.mapHint}>
              <Feather name="info" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
                Tippen Sie auf die Karte um die Position zu setzen. Pinch zum Zoomen, Wischen zum Verschieben.
              </ThemedText>
            </View>
          </Card>

          {hasSelection ? (
            <View style={styles.actionSection}>
              <View style={styles.positionInfo}>
                {tapPosition ? (
                  <ThemedText style={styles.positionText}>
                    Neue Position: X={tapPosition.x.toFixed(3)}, Y={tapPosition.y.toFixed(3)}
                  </ThemedText>
                ) : currentMarker ? (
                  <ThemedText style={styles.positionText}>
                    Aktuelle Position: X={currentMarker.x.toFixed(3)}, Y={currentMarker.y.toFixed(3)}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.positionText, { color: theme.textSecondary }]}>
                    Kein Marker gesetzt
                  </ThemedText>
                )}
              </View>

              <View style={styles.actionButtons}>
                <Button
                  variant="primary"
                  disabled={!tapPosition || isMutating}
                  loading={isMutating}
                  onPress={handleSaveMarker}
                  icon="check"
                  style={styles.actionButton}
                >
                  Speichern
                </Button>
                {currentMarker ? (
                  <Button
                    variant="danger"
                    disabled={isMutating}
                    onPress={handleRemoveMarker}
                    icon="trash-2"
                    style={styles.actionButton}
                  >
                    Entfernen
                  </Button>
                ) : null}
                {tapPosition ? (
                  <Button
                    variant="tertiary"
                    onPress={() => setTapPosition(null)}
                    icon="x"
                    style={styles.actionButton}
                  >
                    Abbrechen
                  </Button>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.missingSection}>
            <ThemedText style={styles.sectionTitle}>
              <Feather name="alert-circle" size={18} color={theme.warning} /> Fehlt
            </ThemedText>

            {mapData.missing.halls.length > 0 ? (
              <View style={styles.missingGroup}>
                <ThemedText style={[styles.missingGroupTitle, { color: theme.textSecondary }]}>
                  Hallen ohne Marker ({mapData.missing.halls.length})
                </ThemedText>
                <View style={styles.chipContainer}>
                  {mapData.missing.halls.map((hall) => (
                    <Pressable
                      key={hall.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: selectedHallId === hall.id ? theme.accent : theme.border,
                          borderWidth: selectedHallId === hall.id ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        setEditorMode("hall");
                        setSelectedHallId(hall.id);
                        setTapPosition(null);
                      }}
                    >
                      <ThemedText style={styles.chipText}>{hall.code}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {mapData.missing.stations.length > 0 ? (
              <View style={styles.missingGroup}>
                <ThemedText style={[styles.missingGroupTitle, { color: theme.textSecondary }]}>
                  Stationen ohne Marker ({mapData.missing.stations.length})
                </ThemedText>
                <View style={styles.chipContainer}>
                  {mapData.missing.stations.slice(0, 20).map((station) => (
                    <Pressable
                      key={station.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: selectedStationId === station.id ? theme.accent : theme.border,
                          borderWidth: selectedStationId === station.id ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        const hall = mapData.halls.find((h) => h.id === station.hallId);
                        if (hall && hallFloorPlans[hall.code]) {
                          setEditorMode("station");
                          setSelectedHallId(station.hallId);
                          setSelectedStationId(station.id);
                          setTapPosition(null);
                        }
                      }}
                    >
                      <ThemedText style={styles.chipText}>{station.code}</ThemedText>
                    </Pressable>
                  ))}
                  {mapData.missing.stations.length > 20 ? (
                    <View style={[styles.chip, { backgroundColor: theme.backgroundTertiary }]}>
                      <ThemedText style={[styles.chipText, { color: theme.textSecondary }]}>
                        +{mapData.missing.stations.length - 20} weitere
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {mapData.missing.halls.length === 0 && mapData.missing.stations.length === 0 ? (
              <View style={styles.allSetContainer}>
                <Feather name="check-circle" size={24} color={theme.success} />
                <ThemedText style={[styles.allSetText, { color: theme.success }]}>
                  Alle Marker sind gesetzt!
                </ThemedText>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
  },
  controls: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    zIndex: 100,
  },
  dropdownContainer: {
    zIndex: 10,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dropdownText: {
    ...Typography.body,
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dropdownItemText: {
    ...Typography.body,
    flex: 1,
  },
  mapCard: {
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  mapWrapper: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    overflow: "hidden",
  },
  mapContainer: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  marker: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  hallMarker: {
    width: 40,
    height: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  stationMarker: {
    width: 32,
    height: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  crosshair: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairVertical: {
    position: "absolute",
    width: 2,
    height: 40,
  },
  crosshairHorizontal: {
    position: "absolute",
    width: 40,
    height: 2,
  },
  crosshairCenter: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  hintText: {
    ...Typography.caption,
    flex: 1,
  },
  actionSection: {
    marginBottom: Spacing.xl,
  },
  positionInfo: {
    marginBottom: Spacing.md,
  },
  positionText: {
    ...Typography.small,
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  missingSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  missingGroup: {
    marginBottom: Spacing.lg,
  },
  missingGroupTitle: {
    ...Typography.smallBold,
    marginBottom: Spacing.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  allSetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  allSetText: {
    ...Typography.bodyBold,
  },
});
