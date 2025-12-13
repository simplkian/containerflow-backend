import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, Modal, ActivityIndicator, Platform, ScrollView, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Box, Stand, Station, Hall, Material, WarehouseContainer, Task,
  AUTOMOTIVE_TASK_STATUS_LABELS, BOX_STATUS_LABELS
} from "@shared/schema";

type ScanType = "box" | "stand" | "warehouse" | null;

interface BoxScanResult {
  type: "box";
  box: Box;
  stand?: Stand | null;
  task?: Task | null;
}

interface StandScanResult {
  type: "stand";
  stand: Stand;
  station?: Station | null;
  hall?: Hall | null;
  material?: Material | null;
  boxes: Box[];
}

interface WarehouseScanResult {
  type: "warehouse";
  container: WarehouseContainer;
}

type ScanResult = BoxScanResult | StandScanResult | WarehouseScanResult;

const AUTOMOTIVE_STATUS_FLOW = ["OPEN", "PICKED_UP", "IN_TRANSIT", "DROPPED_OFF", "TAKEN_OVER", "WEIGHED", "DISPOSED"];

const getNextAction = (status: string): { nextStatus: string; label: string; icon: string } | null => {
  switch (status) {
    case "OPEN":
      return { nextStatus: "PICKED_UP", label: "Abholen", icon: "package" };
    case "PICKED_UP":
      return { nextStatus: "IN_TRANSIT", label: "Transport starten", icon: "truck" };
    case "IN_TRANSIT":
      return { nextStatus: "DROPPED_OFF", label: "Absetzen", icon: "log-out" };
    case "DROPPED_OFF":
      return { nextStatus: "TAKEN_OVER", label: "Übernehmen", icon: "check-square" };
    case "TAKEN_OVER":
      return { nextStatus: "WEIGHED", label: "Wiegen", icon: "activity" };
    case "WEIGHED":
      return { nextStatus: "DISPOSED", label: "Entsorgen", icon: "trash-2" };
    default:
      return null;
  }
};

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [pendingStandForPlacement, setPendingStandForPlacement] = useState<StandScanResult | null>(null);
  const scanLock = useRef(false);

  const parseQRCode = (rawData: string): string => {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed.qrCode) return parsed.qrCode;
      if (parsed.id) return parsed.id;
      if (parsed.code) return parsed.code;
      return rawData;
    } catch {
      return rawData;
    }
  };

  const fetchTaskForBox = async (box: Box): Promise<Task | null> => {
    if (!box.currentTaskId) return null;
    try {
      const response = await apiRequest("GET", `/api/automotive/tasks/${box.currentTaskId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      console.log("No task found for box");
    }
    return null;
  };

  const fetchStandForBox = async (box: Box): Promise<Stand | null> => {
    if (!box.standId) return null;
    try {
      const response = await apiRequest("GET", `/api/automotive/stands/${box.standId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      console.log("No stand found for box");
    }
    return null;
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanLock.current || isProcessing) return;
    scanLock.current = true;

    const qrCode = parseQRCode(result.data);
    setIsProcessing(true);
    setError(null);

    try {
      // If in placement mode, check if this is a box to place at the pending stand
      if (pendingStandForPlacement) {
        let response = await apiRequest("GET", `/api/boxes/qr/${encodeURIComponent(qrCode)}`);
        if (response.ok) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Place the box at the pending stand
          await placeBox(pendingStandForPlacement.stand.qrCode, qrCode);
          return;
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("Bitte scannen Sie einen gültigen Box QR-Code.");
          scanLock.current = false;
          setIsProcessing(false);
          return;
        }
      }

      let response = await apiRequest("GET", `/api/boxes/qr/${encodeURIComponent(qrCode)}`);
      if (response.ok) {
        const box: Box = await response.json();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const [task, stand] = await Promise.all([
          fetchTaskForBox(box),
          fetchStandForBox(box)
        ]);
        setScanResult({ type: "box", box, task, stand });
        return;
      }

      response = await apiRequest("GET", `/api/stands/qr/${encodeURIComponent(qrCode)}`);
      if (response.ok) {
        const data = await response.json();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScanResult({ 
          type: "stand", 
          stand: data.stand, 
          station: data.station, 
          hall: data.hall, 
          material: data.material, 
          boxes: data.boxes || [] 
        });
        return;
      }

      response = await apiRequest("GET", `/api/containers/warehouse/qr/${encodeURIComponent(qrCode)}`);
      if (response.ok) {
        const container: WarehouseContainer = await response.json();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScanResult({ type: "warehouse", container });
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("QR-Code nicht erkannt. Bitte scannen Sie eine Box, einen Stellplatz oder einen Lagercontainer.");
      scanLock.current = false;
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Scan fehlgeschlagen. Bitte erneut versuchen.");
      scanLock.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string, weightKg?: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      const body: any = { status: newStatus };
      if (weightKg !== undefined) {
        body.weightKg = weightKg;
      }

      const response = await apiRequest("PUT", `/api/automotive/tasks/${taskId}/status`, body);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Statusänderung fehlgeschlagen.");
        setIsProcessing(false);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(`Status geändert: ${AUTOMOTIVE_TASK_STATUS_LABELS[newStatus] || newStatus}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/stands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/warehouse"] });

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError("Statusänderung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionPress = (taskId: string, nextStatus: string) => {
    if (nextStatus === "WEIGHED") {
      const weight = parseFloat(weightInput);
      if (isNaN(weight) || weight <= 0) {
        setWeightError("Bitte geben Sie ein gültiges Gewicht ein (> 0 kg)");
        return;
      }
      setWeightError(null);
      updateTaskStatus(taskId, nextStatus, weight);
    } else {
      updateTaskStatus(taskId, nextStatus);
    }
  };

  const createTaskForBox = async (boxId: string, standId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/automotive/tasks", {
        boxId,
        standId,
        taskType: "MANUAL",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Aufgabe konnte nicht erstellt werden.");
        setIsProcessing(false);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("Aufgabe erfolgreich erstellt!");
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/boxes"] });

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError("Aufgabenerstellung fehlgeschlagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setScanResult(null);
    setError(null);
    setSuccess(null);
    setWeightInput("");
    setWeightError(null);
    setPendingStandForPlacement(null);
    scanLock.current = false;
  };

  const pickupBox = async (boxQr: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/scan/pickup-box", { boxQr });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Box abholen fehlgeschlagen.");
        scanLock.current = false;
        setIsProcessing(false);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("Box erfolgreich abgeholt!");
      
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/stands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError("Box abholen fehlgeschlagen. Bitte erneut versuchen.");
      scanLock.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const placeBox = async (standQr: string, boxQr: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/scan/place-box", { standQr, boxQr });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Box platzieren fehlgeschlagen.");
        setPendingStandForPlacement(null);
        scanLock.current = false;
        setIsProcessing(false);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("Box erfolgreich am Stellplatz platziert!");
      
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automotive/stands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setError("Box platzieren fehlgeschlagen. Bitte erneut versuchen.");
      setPendingStandForPlacement(null);
      scanLock.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const enterPlacementMode = (standResult: StandScanResult) => {
    setPendingStandForPlacement(standResult);
    setScanResult(null);
    scanLock.current = false;
  };

  const renderBoxContent = (result: BoxScanResult) => {
    const { box, task, stand } = result;
    const nextAction = task ? getNextAction(task.status) : null;
    const requiresWeight = nextAction?.nextStatus === "WEIGHED";

    return (
      <>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">Box gescannt</ThemedText>
          <Pressable onPress={closeModal} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <Card style={{ ...styles.infoCard, backgroundColor: theme.backgroundSecondary }}>
          <View style={styles.cardHeader}>
            <Feather name="box" size={28} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">{box.serial}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {BOX_STATUS_LABELS[box.status] || box.status}
              </ThemedText>
            </View>
            <StatusBadge 
              status={box.status === "AT_STAND" ? "success" : box.status === "IN_TRANSIT" ? "warning" : "info"} 
              size="small"
              label={BOX_STATUS_LABELS[box.status] || box.status}
            />
          </View>

          {stand ? (
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          ) : null}

          {stand ? (
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText type="body">Stellplatz: {stand.identifier}</ThemedText>
            </View>
          ) : null}
        </Card>

        {task ? (
          <Card style={{ ...styles.infoCard, backgroundColor: theme.infoLight }}>
            <View style={styles.cardHeader}>
              <Feather name="clipboard" size={24} color={theme.info} />
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyBold" style={{ color: theme.info }}>
                  Aktive Aufgabe
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Status: {AUTOMOTIVE_TASK_STATUS_LABELS[task.status] || task.status}
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ ...styles.infoCard, backgroundColor: theme.warningLight }}>
            <View style={styles.cardHeader}>
              <Feather name="alert-circle" size={24} color={theme.warning} />
              <ThemedText type="body" style={{ color: theme.warning }}>
                Keine aktive Aufgabe für diese Box
              </ThemedText>
            </View>
          </Card>
        )}

        {success ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.successLight }]}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, flex: 1 }}>
              {success}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.errorLight }]}>
            <Feather name="alert-circle" size={20} color={theme.error} />
            <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {task && nextAction && requiresWeight ? (
          <Card style={[styles.weightCard, { backgroundColor: theme.cardSurface }]}>
            <ThemedText type="bodyBold" style={{ marginBottom: Spacing.sm }}>
              Gewicht eingeben
            </ThemedText>
            <View style={[styles.weightInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: weightError ? theme.error : theme.border }]}>
              <Feather name="activity" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.weightInput, { color: theme.text }]}
                value={weightInput}
                onChangeText={(text) => {
                  setWeightInput(text);
                  setWeightError(null);
                }}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>kg</ThemedText>
            </View>
            {weightError ? (
              <ThemedText type="small" style={{ color: theme.error, marginTop: Spacing.xs }}>
                {weightError}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.modalActions}>
          <Button onPress={closeModal} style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}>
            Schließen
          </Button>
          {box.status === "AT_STAND" && box.qrCode ? (
            <Button
              onPress={() => pickupBox(box.qrCode)}
              disabled={isProcessing}
              style={[styles.actionButton, { backgroundColor: theme.warning }]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <>
                  <Feather name="log-out" size={18} color={theme.textOnPrimary} style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="bodyBold" style={{ color: theme.textOnPrimary }}>
                    Box abholen
                  </ThemedText>
                </>
              )}
            </Button>
          ) : null}
          {task && nextAction ? (
            <Button
              onPress={() => handleActionPress(task.id, nextAction.nextStatus)}
              disabled={isProcessing}
              style={[styles.actionButton, { backgroundColor: theme.accent }]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <>
                  <Feather name={nextAction.icon as any} size={18} color={theme.textOnPrimary} style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="bodyBold" style={{ color: theme.textOnPrimary }}>
                    {nextAction.label}
                  </ThemedText>
                </>
              )}
            </Button>
          ) : null}
        </View>
      </>
    );
  };

  const renderStandContent = (result: StandScanResult) => {
    const { stand, station, hall, material, boxes: standBoxes } = result;
    const boxAtStand = standBoxes.find(b => b.status === "AT_STAND" && !b.currentTaskId);
    const boxWithTask = standBoxes.find(b => b.currentTaskId);

    return (
      <>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">Stellplatz gescannt</ThemedText>
          <Pressable onPress={closeModal} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <Card style={{ ...styles.infoCard, backgroundColor: theme.backgroundSecondary }}>
          <View style={styles.cardHeader}>
            <Feather name="map-pin" size={28} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">{stand.identifier}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {station?.name || "Station"} {hall ? `- ${hall.name}` : ""}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {material ? (
            <View style={styles.infoRow}>
              <Feather name="layers" size={16} color={theme.textSecondary} />
              <ThemedText type="body">Material: {material.name}</ThemedText>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Feather name="box" size={16} color={theme.textSecondary} />
            <ThemedText type="body">
              Boxen am Platz: {standBoxes.filter(b => b.status === "AT_STAND").length}
            </ThemedText>
          </View>
        </Card>

        {boxWithTask ? (
          <Card style={{ ...styles.infoCard, backgroundColor: theme.infoLight }}>
            <View style={styles.cardHeader}>
              <Feather name="box" size={24} color={theme.info} />
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyBold" style={{ color: theme.info }}>
                  Box mit Aufgabe: {boxWithTask.serial}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Scannen Sie die Box für Details
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : boxAtStand ? (
          <Card style={{ ...styles.infoCard, backgroundColor: theme.warningLight }}>
            <View style={styles.cardHeader}>
              <Feather name="box" size={24} color={theme.warning} />
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyBold" style={{ color: theme.warning }}>
                  Box ohne Aufgabe: {boxAtStand.serial}
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ ...styles.infoCard, backgroundColor: theme.successLight }}>
            <View style={styles.cardHeader}>
              <Feather name="check-circle" size={24} color={theme.success} />
              <ThemedText type="body" style={{ color: theme.success }}>
                Keine Box am Stellplatz
              </ThemedText>
            </View>
          </Card>
        )}

        {success ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.successLight }]}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, flex: 1 }}>
              {success}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.errorLight }]}>
            <Feather name="alert-circle" size={20} color={theme.error} />
            <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.modalActions}>
          <Button onPress={closeModal} style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}>
            Schließen
          </Button>
          <Button
            onPress={() => enterPlacementMode(result)}
            disabled={isProcessing}
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="log-in" size={18} color={theme.textOnPrimary} style={{ marginRight: Spacing.sm }} />
            <ThemedText type="bodyBold" style={{ color: theme.textOnPrimary }}>
              Box hier platzieren
            </ThemedText>
          </Button>
          {boxAtStand ? (
            <Button
              onPress={() => createTaskForBox(boxAtStand.id, stand.id)}
              disabled={isProcessing}
              style={[styles.actionButton, { backgroundColor: theme.accent }]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <>
                  <Feather name="plus" size={18} color={theme.textOnPrimary} style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="bodyBold" style={{ color: theme.textOnPrimary }}>
                    Aufgabe erstellen
                  </ThemedText>
                </>
              )}
            </Button>
          ) : null}
        </View>
      </>
    );
  };

  const renderWarehouseContent = (result: WarehouseScanResult) => {
    const { container } = result;
    const fillPercentage = container.maxCapacity > 0 
      ? Math.round((container.currentAmount / container.maxCapacity) * 100) 
      : 0;

    return (
      <>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">Lagercontainer gescannt</ThemedText>
          <Pressable onPress={closeModal} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <Card style={{ ...styles.infoCard, backgroundColor: theme.backgroundSecondary }}>
          <View style={styles.cardHeader}>
            <Feather name="archive" size={28} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">{container.id}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {container.location}
              </ThemedText>
            </View>
            <StatusBadge 
              status={fillPercentage >= 90 ? "critical" : fillPercentage >= 70 ? "warning" : "success"} 
              size="small"
              label={`${fillPercentage}%`}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.infoRow}>
            <Feather name="layers" size={16} color={theme.textSecondary} />
            <ThemedText type="body">Material: {container.materialType}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Feather name="database" size={16} color={theme.textSecondary} />
            <ThemedText type="body">
              Kapazität: {container.currentAmount.toFixed(0)} / {container.maxCapacity} {container.quantityUnit}
            </ThemedText>
          </View>

          {container.warehouseZone ? (
            <View style={styles.infoRow}>
              <Feather name="grid" size={16} color={theme.textSecondary} />
              <ThemedText type="body">Zone: {container.warehouseZone}</ThemedText>
            </View>
          ) : null}
        </Card>

        {success ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.successLight }]}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, flex: 1 }}>
              {success}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.errorLight }]}>
            <Feather name="alert-circle" size={20} color={theme.error} />
            <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.modalActions}>
          <Button onPress={closeModal} style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}>
            Schließen
          </Button>
        </View>
      </>
    );
  };

  const renderModalContent = () => {
    if (!scanResult) return null;

    if (success) {
      return (
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: `${theme.success}20` }]}>
            <Feather name="check-circle" size={48} color={theme.success} />
          </View>
          <ThemedText type="h3" style={{ textAlign: "center", marginTop: Spacing.lg }}>
            {success}
          </ThemedText>
        </View>
      );
    }

    switch (scanResult.type) {
      case "box":
        return renderBoxContent(scanResult);
      case "stand":
        return renderStandContent(scanResult);
      case "warehouse":
        return renderWarehouseContent(scanResult);
      default:
        return null;
    }
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.permissionContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.permissionContent}>
          <Feather name="camera-off" size={64} color={theme.textSecondary} />
          <ThemedText type="h4" style={styles.permissionTitle}>
            Kamerazugriff erforderlich
          </ThemedText>
          <ThemedText type="body" style={[styles.permissionText, { color: theme.textSecondary }]}>
            ContainerFlow benötigt Kamerazugriff zum Scannen von QR-Codes.
          </ThemedText>
          <Button onPress={requestPermission} style={[styles.permissionButton, { backgroundColor: theme.accent }]}>
            Kamera aktivieren
          </Button>
          {permission.status === "denied" && !permission.canAskAgain && Platform.OS !== "web" ? (
            <ThemedText type="small" style={[styles.permissionHint, { color: theme.textSecondary }]}>
              Bitte aktivieren Sie den Kamerazugriff in Ihren Geräteeinstellungen.
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanResult ? undefined : handleBarCodeScanned}
      />

      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          {pendingStandForPlacement ? (
            <View style={[styles.scanModeIndicator, { backgroundColor: theme.primary }]}>
              <Feather name="log-in" size={18} color={theme.textOnPrimary} />
              <ThemedText type="smallBold" style={{ color: theme.textOnPrimary, marginLeft: Spacing.xs }}>
                Box scannen für: {pendingStandForPlacement.stand.identifier}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.scanModeIndicator, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
              <Feather name="maximize" size={18} color={theme.accent} />
              <ThemedText type="smallBold" style={{ color: theme.textOnPrimary, marginLeft: Spacing.xs }}>
                Box / Stellplatz / Container scannen
              </ThemedText>
            </View>
          )}

          <View style={styles.headerButtons}>
            {pendingStandForPlacement ? (
              <Pressable
                style={[styles.flashButton, { backgroundColor: theme.error }]}
                onPress={() => setPendingStandForPlacement(null)}
              >
                <Feather name="x" size={20} color={theme.textOnPrimary} />
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.flashButton, { backgroundColor: flashOn ? theme.accent : "rgba(0,0,0,0.6)" }]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Feather name={flashOn ? "zap" : "zap-off"} size={20} color={theme.textOnPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.cornerTopLeft, { borderColor: pendingStandForPlacement ? theme.primary : theme.accent }]} />
            <View style={[styles.cornerTopRight, { borderColor: pendingStandForPlacement ? theme.primary : theme.accent }]} />
            <View style={[styles.cornerBottomLeft, { borderColor: pendingStandForPlacement ? theme.primary : theme.accent }]} />
            <View style={[styles.cornerBottomRight, { borderColor: pendingStandForPlacement ? theme.primary : theme.accent }]} />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {pendingStandForPlacement ? (
            <View style={[styles.helpText, { backgroundColor: theme.primary }]}>
              <Feather name="box" size={16} color={theme.textOnPrimary} />
              <ThemedText type="small" style={{ color: theme.textOnPrimary, marginLeft: Spacing.xs }}>
                Scannen Sie jetzt eine Box zum Platzieren
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.helpText, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
              <Feather name="info" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textOnPrimary, marginLeft: Spacing.xs }}>
                Scannen Sie einen QR-Code zum Fortfahren
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={!!scanResult}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardSurface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  permissionTitle: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  permissionText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["3xl"],
  },
  permissionHint: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  scanModeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 12,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  helpText: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  infoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  weightCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  weightInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  modalActions: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
