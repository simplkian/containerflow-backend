import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { EmptyState } from "@/components/EmptyState";
import { getMaterialColors } from "@shared/materialColors";

const OutdoorMap = require("../../assets/images/OUT_1765592733817.png");
const K13Map = require("../../assets/images/K13_1765592733815.png");
const K18Map = require("../../assets/images/K18_1765592733816.png");
const K19Map = require("../../assets/images/K19_1765592733816.png");
const K25Map = require("../../assets/images/K25_1765592733817.png");

interface PositionMeta {
  x: number;
  y: number;
  mapCode?: string;
  label?: string;
}

interface HallData {
  id: string;
  code: string;
  name: string;
  positionMeta: PositionMeta | null;
}

interface StationData {
  id: string;
  code: string;
  name: string;
  hallId: string;
  positionMeta: PositionMeta | null;
}

interface MapData {
  halls: HallData[];
  stations: StationData[];
}

interface BoxDetail {
  id: string;
  serial: string;
  qrCode: string;
  status: string;
  standId: string | null;
}

interface TaskDetail {
  id: string;
  status: string;
  taskType: string;
  createdAt: string;
}

interface MaterialDetail {
  id: string;
  name: string;
  code: string;
  hazardClass?: string;
}

interface StandDetail {
  id: string;
  identifier: string;
  qrCode: string;
  dailyFull: boolean;
  materialId: string | null;
  material: MaterialDetail | null;
  boxes: BoxDetail[];
  openTasks: TaskDetail[];
}

interface StationDetails {
  id: string;
  code: string;
  name: string;
  hallId: string;
  hall: { id: string; name: string; code: string } | null;
  stands: StandDetail[];
  totalBoxes: number;
  totalOpenTasks: number;
}

const hallFloorPlans: Record<string, any> = {
  K13: K13Map,
  K18: K18Map,
  K19: K19Map,
  K25: K25Map,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const MAP_ASPECT_RATIO = 1.2;
const MAP_HEIGHT = MAP_WIDTH / MAP_ASPECT_RATIO;

const SNAP_POINTS = {
  CLOSED: SCREEN_HEIGHT,
  COLLAPSED: SCREEN_HEIGHT - (SCREEN_HEIGHT * 0.25),
  MEDIUM: SCREEN_HEIGHT - (SCREEN_HEIGHT * 0.50),
  EXPANDED: SCREEN_HEIGHT - (SCREEN_HEIGHT * 0.85),
};

const SPRING_CONFIG = {
  damping: 25,
  stiffness: 300,
  mass: 0.5,
};

const BOX_STATUS_LABELS: Record<string, string> = {
  AT_STAND: "Am Stellplatz",
  IN_TRANSIT: "Unterwegs",
  AT_WAREHOUSE: "Im Lager",
  DISPOSED: "Entsorgt",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  PICKED_UP: "Abgeholt",
  IN_TRANSIT: "Unterwegs",
  DROPPED_OFF: "Abgestellt",
  TAKEN_OVER: "Übernommen",
  WEIGHED: "Gewogen",
  DISPOSED: "Entsorgt",
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [selectedHall, setSelectedHall] = useState<HallData | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const translateY = useSharedValue(SNAP_POINTS.CLOSED);
  const context = useSharedValue({ y: 0 });

  const { data: mapData, isLoading, error } = useQuery<MapData>({
    queryKey: ["/api/factory/map-data"],
  });

  const { data: stationDetails, isLoading: loadingDetails } = useQuery<StationDetails>({
    queryKey: [`/api/stations/${selectedStation?.id}/details`],
    enabled: !!selectedStation,
  });

  const openBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(true);
    translateY.value = withSpring(SNAP_POINTS.COLLAPSED, SPRING_CONFIG);
  }, [translateY]);

  const closeBottomSheet = useCallback(() => {
    translateY.value = withSpring(SNAP_POINTS.CLOSED, SPRING_CONFIG, (finished) => {
      if (finished) {
        runOnJS(setIsBottomSheetVisible)(false);
        runOnJS(setSelectedStation)(null);
      }
    });
  }, [translateY]);

  useEffect(() => {
    if (selectedStation) {
      openBottomSheet();
    }
  }, [selectedStation, openBottomSheet]);

  const snapToNearest = (velocity: number) => {
    "worklet";
    const currentY = translateY.value;
    const snapPoints = [SNAP_POINTS.EXPANDED, SNAP_POINTS.MEDIUM, SNAP_POINTS.COLLAPSED, SNAP_POINTS.CLOSED];
    
    if (velocity > 500) {
      const lowerSnaps = snapPoints.filter(p => p > currentY);
      if (lowerSnaps.length > 0) {
        return lowerSnaps[0];
      }
      return SNAP_POINTS.CLOSED;
    } else if (velocity < -500) {
      const higherSnaps = snapPoints.filter(p => p < currentY).reverse();
      if (higherSnaps.length > 0) {
        return higherSnaps[0];
      }
      return SNAP_POINTS.EXPANDED;
    }
    
    let closest = snapPoints[0];
    let minDistance = Math.abs(currentY - snapPoints[0]);
    for (const point of snapPoints) {
      const distance = Math.abs(currentY - point);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }
    return closest;
  };

  const handleSheetClosed = useCallback(() => {
    setIsBottomSheetVisible(false);
    setSelectedStation(null);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      translateY.value = Math.min(SNAP_POINTS.CLOSED, Math.max(SNAP_POINTS.EXPANDED, newY));
    })
    .onEnd((event) => {
      const snapPoint = snapToNearest(event.velocityY);
      translateY.value = withSpring(snapPoint, SPRING_CONFIG, (finished) => {
        if (finished && snapPoint === SNAP_POINTS.CLOSED) {
          runOnJS(handleSheetClosed)();
        }
      });
    });

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - (translateY.value - SNAP_POINTS.EXPANDED) / (SNAP_POINTS.CLOSED - SNAP_POINTS.EXPANDED),
  }));

  const handleMapLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMapDimensions({ width, height });
  }, []);

  const handleHallPress = (hall: HallData) => {
    if (hallFloorPlans[hall.code]) {
      setSelectedHall(hall);
    }
  };

  const handleBackPress = () => {
    setSelectedHall(null);
    setSelectedStation(null);
  };

  const handleStationPress = (station: StationData) => {
    setSelectedStation(station);
  };

  const closeStationDrawer = () => {
    closeBottomSheet();
  };

  const stationsForHall = selectedHall
    ? mapData?.stations.filter((s) => s.hallId === selectedHall.id) || []
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return theme.warning;
      case "PICKED_UP":
      case "IN_TRANSIT":
        return theme.info;
      case "DROPPED_OFF":
      case "TAKEN_OVER":
        return theme.accent;
      case "WEIGHED":
      case "DISPOSED":
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  const getBoxStatusColor = (status: string) => {
    switch (status) {
      case "AT_STAND":
        return theme.success;
      case "IN_TRANSIT":
        return theme.warning;
      case "AT_WAREHOUSE":
        return theme.info;
      default:
        return theme.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText style={styles.loadingText}>Karte wird geladen...</ThemedText>
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
          message="Die Werkskarte konnte nicht geladen werden. Bitte versuchen Sie es später erneut."
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {selectedHall ? (
            <Pressable
              onPress={handleBackPress}
              style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="arrow-left" size={20} color={theme.text} />
            </Pressable>
          ) : null}
          <ThemedText style={styles.title}>
            {selectedHall ? selectedHall.name : "Werksplan Kaiserslautern"}
          </ThemedText>
        </View>

        <Card style={styles.mapCard}>
          <View style={styles.mapContainer} onLayout={handleMapLayout}>
            <Image
              source={selectedHall ? hallFloorPlans[selectedHall.code] : OutdoorMap}
              style={styles.mapImage}
              contentFit="fill"
            />

            {selectedHall ? (
              stationsForHall.map((station) => {
                if (!station.positionMeta) return null;
                const { x, y } = station.positionMeta;
                const isSelected = selectedStation?.id === station.id;
                return (
                  <Pressable
                    key={station.id}
                    onPress={() => handleStationPress(station)}
                    style={[
                      styles.marker,
                      styles.stationMarker,
                      {
                        left: x * mapDimensions.width - 16,
                        top: y * mapDimensions.height - 16,
                        backgroundColor: isSelected ? theme.accent : theme.info,
                        transform: [{ scale: isSelected ? 1.2 : 1 }],
                      },
                    ]}
                  >
                    <Feather name="target" size={16} color="#FFFFFF" />
                  </Pressable>
                );
              })
            ) : (
              mapData.halls.map((hall) => {
                if (!hall.positionMeta) return null;
                const { x, y } = hall.positionMeta;
                const hasFloorPlan = !!hallFloorPlans[hall.code];
                return (
                  <Pressable
                    key={hall.id}
                    onPress={() => handleHallPress(hall)}
                    style={[
                      styles.marker,
                      styles.hallMarker,
                      {
                        left: x * mapDimensions.width - 20,
                        top: y * mapDimensions.height - 20,
                        backgroundColor: hasFloorPlan ? theme.accent : theme.textSecondary,
                      },
                    ]}
                  >
                    <ThemedText style={styles.markerLabel}>{hall.code}</ThemedText>
                  </Pressable>
                );
              })
            )}
          </View>
        </Card>

        {selectedHall ? (
          <View style={styles.legendSection}>
            <ThemedText style={styles.legendTitle}>Stationen in {selectedHall.code}</ThemedText>
            <ThemedText style={styles.legendHint}>
              Tippen Sie auf eine Station um Details anzuzeigen
            </ThemedText>
            {stationsForHall.length === 0 ? (
              <ThemedText style={styles.legendItem}>Keine Stationen gefunden</ThemedText>
            ) : (
              stationsForHall.map((station) => (
                <Pressable 
                  key={station.id} 
                  style={[
                    styles.stationRow, 
                    { backgroundColor: selectedStation?.id === station.id ? theme.backgroundSecondary : 'transparent' }
                  ]}
                  onPress={() => handleStationPress(station)}
                >
                  <View style={[styles.stationDot, { backgroundColor: selectedStation?.id === station.id ? theme.accent : theme.info }]} />
                  <View style={styles.stationInfo}>
                    <ThemedText style={styles.stationCode}>{station.code}</ThemedText>
                    <ThemedText style={styles.stationName}>{station.name}</ThemedText>
                  </View>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <View style={styles.legendSection}>
            <ThemedText style={styles.legendTitle}>Gebäude</ThemedText>
            <ThemedText style={styles.legendHint}>
              Tippen Sie auf ein Gebäude um die Stationen anzuzeigen
            </ThemedText>
            <View style={styles.legendItems}>
              {mapData.halls
                .filter((h) => hallFloorPlans[h.code])
                .map((hall) => (
                  <Pressable
                    key={hall.id}
                    onPress={() => handleHallPress(hall)}
                    style={[styles.legendChip, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                    <ThemedText style={styles.legendChipText}>{hall.code}</ThemedText>
                  </Pressable>
                ))}
            </View>
          </View>
        )}
      </ScrollView>

      {isBottomSheetVisible ? (
        <>
          <Animated.View 
            style={[styles.bottomSheetOverlay, overlayStyle]} 
            pointerEvents={isBottomSheetVisible ? "auto" : "none"}
          >
            <Pressable style={styles.overlayPressable} onPress={closeStationDrawer} />
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomSheet,
              { backgroundColor: theme.backgroundRoot },
              bottomSheetStyle,
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View style={styles.bottomSheetHandleArea}>
                <View style={[styles.drawerHandle, { backgroundColor: theme.border }]} />
              </View>
            </GestureDetector>

            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleContainer}>
                <Feather name="map-pin" size={24} color={theme.accent} />
                <View>
                  <ThemedText style={styles.drawerTitle}>
                    {selectedStation?.name}
                  </ThemedText>
                  <ThemedText style={[styles.drawerSubtitle, { color: theme.textSecondary }]}>
                    {selectedStation?.code} - {stationDetails?.hall?.name || selectedHall?.name}
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={closeStationDrawer} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {loadingDetails ? (
              <View style={styles.drawerLoading}>
                <ActivityIndicator size="small" color={theme.accent} />
                <ThemedText style={{ color: theme.textSecondary }}>Laden...</ThemedText>
              </View>
            ) : stationDetails ? (
              <ScrollView 
                style={[styles.drawerScrollView, { paddingBottom: insets.bottom }]}
                contentContainerStyle={styles.drawerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="target" size={20} color={theme.info} />
                    <ThemedText style={styles.summaryNumber}>{stationDetails.stands.length}</ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Stellplätze</ThemedText>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="package" size={20} color={theme.success} />
                    <ThemedText style={styles.summaryNumber}>{stationDetails.totalBoxes}</ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Boxen</ThemedText>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="clipboard" size={20} color={theme.warning} />
                    <ThemedText style={styles.summaryNumber}>{stationDetails.totalOpenTasks}</ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Offene Tasks</ThemedText>
                  </View>
                </View>

                {stationDetails.stands.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="inbox" size={32} color={theme.textTertiary} />
                    <ThemedText style={{ color: theme.textSecondary }}>Keine Stellplätze vorhanden</ThemedText>
                  </View>
                ) : (
                  stationDetails.stands.map((stand) => (
                    <Card key={stand.id} style={styles.standCard}>
                      <View style={styles.standHeader}>
                        <View style={styles.standInfo}>
                          <ThemedText style={styles.standIdentifier}>{stand.identifier}</ThemedText>
                          {stand.material ? (
                            (() => {
                              const materialColors = getMaterialColors(stand.material.code);
                              return (
                                <View style={[styles.materialBadge, { backgroundColor: materialColors.background, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm }]}>
                                  <View style={[styles.materialDot, { backgroundColor: materialColors.primary }]} />
                                  <ThemedText style={[styles.materialName, { color: materialColors.text }]}>
                                    {materialColors.label}
                                  </ThemedText>
                                </View>
                              );
                            })()
                          ) : null}
                        </View>
                        <View style={styles.standBadges}>
                          {stand.dailyFull ? (
                            <View style={[styles.dailyBadge, { backgroundColor: theme.warning + '20' }]}>
                              <Feather name="clock" size={12} color={theme.warning} />
                              <ThemedText style={[styles.dailyText, { color: theme.warning }]}>Täglich</ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {stand.boxes.length > 0 ? (
                        <View style={styles.boxesSection}>
                          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                            Boxen ({stand.boxes.length})
                          </ThemedText>
                          {stand.boxes.map((box) => (
                            <View key={box.id} style={[styles.boxRow, { borderColor: theme.border }]}>
                              <View style={styles.boxInfo}>
                                <Feather name="package" size={14} color={getBoxStatusColor(box.status)} />
                                <ThemedText style={styles.boxSerial}>{box.serial}</ThemedText>
                              </View>
                              <StatusBadge 
                                status={box.status === "AT_STAND" ? "success" : box.status === "IN_TRANSIT" ? "warning" : "info"} 
                                label={BOX_STATUS_LABELS[box.status] || box.status} 
                                size="small" 
                              />
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.noBoxes}>
                          <Feather name="package" size={14} color={theme.textTertiary} />
                          <ThemedText style={[styles.noBoxesText, { color: theme.textTertiary }]}>
                            Keine Boxen am Stellplatz
                          </ThemedText>
                        </View>
                      )}

                      {stand.openTasks.length > 0 ? (
                        <View style={styles.tasksSection}>
                          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                            Offene Aufgaben ({stand.openTasks.length})
                          </ThemedText>
                          {stand.openTasks.map((task) => (
                            <View key={task.id} style={[styles.taskRow, { borderColor: theme.border }]}>
                              <View style={styles.taskInfo}>
                                <View style={[styles.taskDot, { backgroundColor: getStatusColor(task.status) }]} />
                                <ThemedText style={styles.taskType}>
                                  {task.taskType === "DAILY_FULL" ? "Tagesabholung" : "Manuell"}
                                </ThemedText>
                              </View>
                              <StatusBadge 
                                status={task.status === "OPEN" ? "warning" : "info"} 
                                label={TASK_STATUS_LABELS[task.status] || task.status} 
                                size="small" 
                              />
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </Card>
                  ))
                )}
                <View style={{ height: insets.bottom + Spacing.xl }} />
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="alert-circle" size={32} color={theme.textTertiary} />
                <ThemedText style={{ color: theme.textSecondary }}>Keine Daten verfügbar</ThemedText>
              </View>
            )}
          </Animated.View>
        </>
      ) : null}
    </ThemedView>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.h3,
    flex: 1,
  },
  mapCard: {
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
  legendSection: {
    marginTop: Spacing.xl,
  },
  legendTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  legendHint: {
    ...Typography.small,
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendChipText: {
    ...Typography.smallBold,
  },
  legendItem: {
    ...Typography.body,
    opacity: 0.7,
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  stationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stationInfo: {
    flex: 1,
  },
  stationCode: {
    ...Typography.smallBold,
  },
  stationName: {
    ...Typography.caption,
    opacity: 0.7,
  },
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
  },
  overlayPressable: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetHandleArea: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  drawerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  drawerTitle: {
    ...Typography.h4,
  },
  drawerSubtitle: {
    ...Typography.small,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  drawerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing["3xl"],
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  summaryNumber: {
    ...Typography.h3,
  },
  summaryLabel: {
    ...Typography.caption,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  standCard: {
    gap: Spacing.md,
  },
  standHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  standInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  standIdentifier: {
    ...Typography.h4,
  },
  materialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  materialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  materialName: {
    ...Typography.small,
    fontWeight: "600",
  },
  standBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  dailyText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  sectionLabel: {
    ...Typography.smallBold,
    marginBottom: Spacing.xs,
  },
  boxesSection: {
    gap: Spacing.xs,
  },
  boxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  boxInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  boxSerial: {
    ...Typography.body,
  },
  noBoxes: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  noBoxesText: {
    ...Typography.small,
  },
  tasksSection: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskType: {
    ...Typography.body,
  },
});
