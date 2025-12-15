import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal, FlatList } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { TasksStackParamList } from "@/navigation/TasksStackNavigator";
import { Task, CustomerContainer, User, TASK_STATUS_LABELS } from "@shared/schema";
import { openMapsNavigation } from "@/lib/navigation";
import { apiRequest } from "@/lib/query-client";

type UserWithoutPassword = Omit<User, "password">;

type RouteProps = RouteProp<TasksStackParamList, "TaskDetail">;

const ACTIVE_STATUSES = ["OFFEN", "PLANNED", "ASSIGNED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"];
const CLAIM_TTL_MINUTES = 30;

export default function TaskDetailScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { taskId } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [isHandingOver, setIsHandingOver] = useState(false);
  const [claimTimeRemaining, setClaimTimeRemaining] = useState<number | null>(null);

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
  });

  const { data: users = [] } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  const drivers = users.filter((u) => u.role === "DRIVER" || u.role === "driver").filter((u) => u.isActive && u.id !== user?.id);

  const getClaimTimeRemaining = (claimedAt: Date | string | null): number | null => {
    if (!claimedAt) return null;
    const claimTime = new Date(claimedAt).getTime();
    const expiryTime = claimTime + CLAIM_TTL_MINUTES * 60 * 1000;
    const remaining = expiryTime - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  };

  const isClaimExpired = (claimedAt: Date | string | null): boolean => {
    if (!claimedAt) return true;
    const remaining = getClaimTimeRemaining(claimedAt);
    return remaining === 0;
  };

  useEffect(() => {
    if (!task?.claimedAt || !task?.claimedByUserId) {
      setClaimTimeRemaining(null);
      return;
    }
    const updateRemaining = () => {
      const remaining = getClaimTimeRemaining(task.claimedAt);
      setClaimTimeRemaining(remaining);
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 30000);
    return () => clearInterval(interval);
  }, [task?.claimedAt, task?.claimedByUserId]);

  const getClaimerName = (): string => {
    if (!task?.claimedByUserId) return "";
    const claimer = users.find((u) => u.id === task.claimedByUserId);
    return claimer?.name || "Unbekannt";
  };
  
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      Alert.alert("Erfolg", "Auftrag wurde erfolgreich gelöscht", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error) => {
      Alert.alert("Fehler", "Auftrag konnte nicht gelöscht werden");
      console.error("Delete task error:", error);
    },
  });

  const handleClaimTask = async () => {
    if (!user || !task) return;
    setIsClaiming(true);
    try {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, { userId: user.id });
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        const claimerInfo = errorData.claimedBy ? ` von ${errorData.claimedBy}` : "";
        const remainingInfo = errorData.remainingMinutes ? ` (${errorData.remainingMinutes} Min. verbleibend)` : "";
        Alert.alert("Bereits übernommen", `Dieser Auftrag wurde bereits${claimerInfo} übernommen${remainingInfo}.`);
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
        setIsClaiming(false);
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Fehler", errorData.error || "Auftrag konnte nicht übernommen werden.");
        setIsClaiming(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      Alert.alert("Erfolg", "Auftrag erfolgreich übernommen");
    } catch (error) {
      Alert.alert("Fehler", "Auftrag konnte nicht übernommen werden.");
      console.error("Claim task error:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleReleaseTask = async () => {
    if (!user || !task) return;
    setIsReleasing(true);
    try {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/release`, { userId: user.id });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Fehler", errorData.error || "Auftrag konnte nicht freigegeben werden.");
        setIsReleasing(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      Alert.alert("Erfolg", "Auftrag wurde freigegeben");
    } catch (error) {
      Alert.alert("Fehler", "Auftrag konnte nicht freigegeben werden.");
      console.error("Release task error:", error);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleHandover = async (newUserId: string) => {
    if (!user || !task) return;
    setIsHandingOver(true);
    try {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/handover`, { newUserId });
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Fehler", errorData.error || "Übergabe fehlgeschlagen.");
        setIsHandingOver(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      setShowHandoverModal(false);
      Alert.alert("Erfolg", "Auftrag erfolgreich übergeben");
    } catch (error) {
      Alert.alert("Fehler", "Übergabe fehlgeschlagen.");
      console.error("Handover task error:", error);
    } finally {
      setIsHandingOver(false);
    }
  };

  const claimExpired = task?.claimedAt ? isClaimExpired(task.claimedAt) : true;
  const isClaimedByCurrentUser = task?.claimedByUserId === user?.id;
  const isClaimedByOther = task?.claimedByUserId && !isClaimedByCurrentUser && !claimExpired;
  
  const canClaim = task && 
    (task.status === "OFFEN" || task.status === "PLANNED") && 
    !task.assignedTo &&
    (!task.claimedByUserId || claimExpired);
  
  const canRelease = task && 
    (task.status === "OFFEN" || task.status === "PLANNED") && 
    isClaimedByCurrentUser && 
    !claimExpired;
  
  const canHandover = task && 
    !["COMPLETED", "CANCELLED"].includes(task.status) && 
    (isAdmin || task.assignedTo === user?.id || task.claimedByUserId === user?.id);

  const { data: container } = useQuery<CustomerContainer>({
    queryKey: [`/api/containers/customer/${task?.containerID}`],
    enabled: !!task?.containerID,
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Nicht geplant";
    const d = new Date(date);
    return d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNavigation = async () => {
    if (!container?.latitude || !container?.longitude) {
      Alert.alert(
        "Navigation nicht verfügbar",
        "Standortkoordinaten sind für diesen Container nicht verfügbar.",
        [{ text: "OK" }]
      );
      return;
    }

    await openMapsNavigation({
      latitude: container.latitude,
      longitude: container.longitude,
      label: `${container.customerName} - ${container.location}`,
    });
  };

  const goToScanner = () => {
    const tabNav = navigation.getParent();
    if (tabNav) {
      tabNav.navigate("ScannerTab");
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      "Auftrag löschen",
      "Möchten Sie diesen Auftrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            setIsDeleting(true);
            deleteTaskMutation.mutate();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  if (!task) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.errorState}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText type="h4">Aufgabe nicht gefunden</ThemedText>
        </View>
      </ThemedView>
    );
  }

  type FeatherIconName = "plus-circle" | "user-check" | "check-circle" | "log-in" | "truck" | "log-out" | "check-square" | "x-circle" | "circle";

  const lifecycleSteps: { label: string; timestamp: Date | string | null; status: string; icon: FeatherIconName }[] = [
    { label: "Offen", timestamp: task.createdAt, status: "OFFEN", icon: "circle" },
    { label: "Zugewiesen", timestamp: task.assignedAt, status: "ASSIGNED", icon: "user-check" },
    { label: "Angenommen", timestamp: task.acceptedAt, status: "ACCEPTED", icon: "check-circle" },
    { label: "Abgeholt", timestamp: task.pickedUpAt, status: "PICKED_UP", icon: "log-in" },
    { label: "Unterwegs", timestamp: task.inTransitAt, status: "IN_TRANSIT", icon: "truck" },
    { label: "Geliefert", timestamp: task.deliveredAt, status: "DELIVERED", icon: "log-out" },
    { label: "Abgeschlossen", timestamp: task.completedAt, status: "COMPLETED", icon: "check-square" },
  ];

  if (task.status === "CANCELLED") {
    lifecycleSteps.push({ 
      label: "Storniert", 
      timestamp: task.cancelledAt, 
      status: "CANCELLED", 
      icon: "x-circle"
    });
  }

  const hasAnyTimestamp = lifecycleSteps.some(step => step.timestamp);
  const isActive = ACTIVE_STATUSES.includes(task.status);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ ...styles.headerCard, backgroundColor: theme.cardSurface }}>
          <View style={styles.headerRow}>
            <View style={styles.containerInfo}>
              <Feather name="package" size={32} color={theme.primary} />
              <View>
                <ThemedText type="h3" style={[styles.containerId, { color: theme.primary }]}>
                  {task.containerID}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {task.materialType}
                </ThemedText>
              </View>
            </View>
            <StatusBadge status={task.status} />
          </View>
        </Card>

        <Card style={{ ...styles.infoCard, backgroundColor: theme.cardSurface }}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Abholungsdetails
          </ThemedText>
          
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={20} color={theme.textSecondary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Standort</ThemedText>
              <ThemedText type="body" numberOfLines={3} ellipsizeMode="tail" style={styles.infoText}>
                {container?.location || "Wird geladen..."}
              </ThemedText>
              {container?.customerName ? (
                <ThemedText type="small" numberOfLines={2} ellipsizeMode="tail" style={[styles.infoText, { color: theme.textSecondary }]}>
                  {container.customerName}
                </ThemedText>
              ) : null}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="clock" size={20} color={theme.textSecondary} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Geplante Zeit</ThemedText>
              <ThemedText type="body">{formatDate(task.scheduledTime)}</ThemedText>
            </View>
          </View>

          {task.plannedQuantity || task.estimatedAmount ? (
            <View style={styles.infoRow}>
              <Feather name="truck" size={20} color={theme.textSecondary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Geschätzte Menge</ThemedText>
                <ThemedText type="body">{task.plannedQuantity || task.estimatedAmount} {task.plannedQuantityUnit || "kg"}</ThemedText>
              </View>
            </View>
          ) : null}

          {task.priority && task.priority !== "normal" ? (
            <View style={styles.infoRow}>
              <Feather name="alert-triangle" size={20} color={theme.warning} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Priorität</ThemedText>
                <ThemedText type="body" style={{ color: theme.warning }}>
                  {task.priority === "high" ? "Hoch" : task.priority === "urgent" ? "Dringend" : task.priority}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </Card>

        {task.notes ? (
          <Card style={{ ...styles.notesCard, backgroundColor: theme.cardSurface }}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Anweisungen
            </ThemedText>
            <ThemedText type="body">
              {task.notes}
            </ThemedText>
          </Card>
        ) : null}

        {hasAnyTimestamp ? (
          <Card style={{ ...styles.timestampCard, backgroundColor: theme.cardSurface }}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Aktivitätsverlauf
            </ThemedText>
            {lifecycleSteps.map((step, index) => {
              if (!step.timestamp && step.status !== task.status) return null;
              const isCompleted = !!step.timestamp;
              const isCurrent = step.status === task.status && !step.timestamp;
              
              let stepColor = theme.textSecondary;
              if (isCompleted) {
                stepColor = step.status === "CANCELLED" ? theme.statusCancelled : theme.statusCompleted;
              } else if (isCurrent) {
                stepColor = theme.statusInProgress;
              }

              return (
                <View key={step.status} style={styles.timestampRow}>
                  <View style={styles.timelineIndicator}>
                    <View style={[styles.timestampDot, { backgroundColor: stepColor }]} />
                    {index < lifecycleSteps.length - 1 && lifecycleSteps[index + 1]?.timestamp ? (
                      <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                    ) : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Feather name={step.icon} size={16} color={stepColor} />
                      <ThemedText type="body" style={{ marginLeft: Spacing.xs, color: isCompleted ? theme.text : theme.textSecondary }}>
                        {step.label}
                      </ThemedText>
                    </View>
                    {step.timestamp ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {formatDate(step.timestamp)}
                      </ThemedText>
                    ) : isCurrent ? (
                      <ThemedText type="small" style={{ color: theme.statusInProgress }}>
                        Aktueller Status
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}

        {(canClaim || canRelease || isClaimedByOther) ? (
          <Card style={{ ...styles.claimCard, backgroundColor: theme.cardSurface }}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {canRelease ? "Auftrag übernommen" : isClaimedByOther ? "Auftrag reserviert" : "Auftrag verfügbar"}
            </ThemedText>
            
            {canRelease ? (
              <View style={styles.claimStatusRow}>
                <Feather name="clock" size={16} color={theme.info} />
                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
                  {claimTimeRemaining !== null && claimTimeRemaining > 0 
                    ? `Noch ${claimTimeRemaining} Min. reserviert` 
                    : "Reservierung läuft ab"}
                </ThemedText>
              </View>
            ) : isClaimedByOther ? (
              <View style={styles.claimStatusRow}>
                <Feather name="user" size={16} color={theme.warning} />
                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
                  Übernommen von {getClaimerName()}
                  {claimTimeRemaining !== null && claimTimeRemaining > 0 
                    ? ` (${claimTimeRemaining} Min. verbleibend)` 
                    : " (Abgelaufen)"}
                </ThemedText>
              </View>
            ) : claimExpired && task?.claimedByUserId ? (
              <View style={styles.claimStatusRow}>
                <Feather name="alert-circle" size={16} color={theme.error} />
                <ThemedText type="small" style={{ color: theme.error }}>
                  Vorherige Reservierung abgelaufen
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Dieser Auftrag ist verfügbar. Sie können ihn übernehmen.
              </ThemedText>
            )}

            {canClaim ? (
              <Button 
                onPress={handleClaimTask} 
                disabled={isClaiming}
                style={[styles.claimButton, { backgroundColor: theme.primary, marginTop: Spacing.md }]}
              >
                <View style={styles.buttonContent}>
                  {isClaiming ? (
                    <ActivityIndicator size="small" color={theme.textOnPrimary} />
                  ) : (
                    <Feather name="user-check" size={20} color={theme.textOnPrimary} />
                  )}
                  <ThemedText type="body" style={{ color: theme.textOnPrimary, fontWeight: "600" }}>
                    {isClaiming ? "Wird übernommen..." : "Übernehmen"}
                  </ThemedText>
                </View>
              </Button>
            ) : null}

            {canRelease ? (
              <Button 
                onPress={handleReleaseTask} 
                disabled={isReleasing}
                style={[styles.releaseButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, marginTop: Spacing.md }]}
              >
                <View style={styles.buttonContent}>
                  {isReleasing ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <Feather name="unlock" size={20} color={theme.text} />
                  )}
                  <ThemedText type="body" style={{ color: theme.text, fontWeight: "600" }}>
                    {isReleasing ? "Wird freigegeben..." : "Freigeben"}
                  </ThemedText>
                </View>
              </Button>
            ) : null}
          </Card>
        ) : null}

        {canHandover ? (
          <Card style={{ ...styles.handoverCard, backgroundColor: theme.cardSurface }}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Auftrag übergeben
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
              Übertragen Sie diesen Auftrag an einen anderen Fahrer.
            </ThemedText>
            <Button 
              onPress={() => setShowHandoverModal(true)} 
              style={[styles.handoverButton, { backgroundColor: theme.info }]}
            >
              <View style={styles.buttonContent}>
                <Feather name="user-plus" size={20} color={theme.textOnPrimary} />
                <ThemedText type="body" style={{ color: theme.textOnPrimary, fontWeight: "600" }}>
                  Übergabe
                </ThemedText>
              </View>
            </Button>
          </Card>
        ) : null}

        {isActive ? (
          <View style={styles.actions}>
            <Button onPress={handleNavigation} style={[styles.secondaryButton, { backgroundColor: theme.cardSurface, borderColor: theme.primary }]}>
              <View style={styles.buttonContent}>
                <Feather name="navigation" size={20} color={theme.primary} />
                <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
                  Navigation starten
                </ThemedText>
              </View>
            </Button>
            <Button onPress={goToScanner} style={[styles.primaryButton, { backgroundColor: theme.accent }]}>
              <View style={styles.buttonContent}>
                <Feather name="maximize" size={20} color={theme.textOnAccent} />
                <ThemedText type="body" style={{ color: theme.textOnAccent, fontWeight: "600" }}>
                  QR-Code scannen
                </ThemedText>
              </View>
            </Button>
          </View>
        ) : null}

        {isAdmin ? (
          <Card style={{ ...styles.adminCard, backgroundColor: theme.cardSurface, borderColor: theme.error }}>
            <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.error }]}>
              Admin-Aktionen
            </ThemedText>
            <Button 
              onPress={handleDeleteTask} 
              disabled={isDeleting || deleteTaskMutation.isPending}
              style={[styles.deleteButton, { backgroundColor: theme.error }]}
            >
              <View style={styles.buttonContent}>
                {isDeleting || deleteTaskMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.textOnAccent} />
                ) : (
                  <Feather name="trash-2" size={20} color={theme.textOnAccent} />
                )}
                <ThemedText type="body" style={{ color: theme.textOnAccent, fontWeight: "600" }}>
                  {isDeleting || deleteTaskMutation.isPending ? "Wird gelöscht..." : "Auftrag löschen"}
                </ThemedText>
              </View>
            </Button>
          </Card>
        ) : null}
      </ScrollView>

      <Modal
        visible={showHandoverModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHandoverModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardSurface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Auftrag übergeben</ThemedText>
              <Pressable onPress={() => setShowHandoverModal(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              Wählen Sie einen Fahrer, an den der Auftrag übergeben werden soll:
            </ThemedText>
            {drivers.length === 0 ? (
              <View style={styles.noDriversState}>
                <Feather name="users" size={32} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                  Keine anderen aktiven Fahrer verfügbar
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.driverItem, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => handleHandover(item.id)}
                    disabled={isHandingOver}
                  >
                    <View style={[styles.driverAvatar, { backgroundColor: theme.primary }]}>
                      <ThemedText type="small" style={{ color: theme.textOnPrimary, fontWeight: "600" }}>
                        {item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>{item.name}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.email}</ThemedText>
                    </View>
                    {isHandingOver ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                    )}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              />
            )}
            <Button 
              onPress={() => setShowHandoverModal(false)} 
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.lg }]}
            >
              <ThemedText type="body" style={{ color: theme.text }}>Abbrechen</ThemedText>
            </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerCard: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  containerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  containerId: {
    fontWeight: "700",
  },
  infoCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  infoText: {
    flexShrink: 1,
  },
  notesCard: {
    padding: Spacing.lg,
  },
  timestampCard: {
    padding: Spacing.lg,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.sm,
  },
  timelineIndicator: {
    alignItems: "center",
    width: 24,
  },
  timestampDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginTop: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  primaryButton: {
    paddingVertical: Spacing.lg,
  },
  secondaryButton: {
    borderWidth: 2,
    paddingVertical: Spacing.lg,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  adminCard: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
  },
  deleteButton: {
    paddingVertical: Spacing.md,
  },
  claimCard: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  claimStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  claimButton: {
    paddingVertical: Spacing.lg,
  },
  releaseButton: {
    paddingVertical: Spacing.lg,
    borderWidth: 1,
  },
  handoverCard: {
    padding: Spacing.lg,
  },
  handoverButton: {
    paddingVertical: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  driverItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  noDriversState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
  },
});
