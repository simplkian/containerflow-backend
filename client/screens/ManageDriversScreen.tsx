import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Modal, ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Task, ActivityLog } from "@shared/schema";
import { useTheme } from "@/hooks/useTheme";

const OPEN_STATUSES = ["OFFEN", "PLANNED", "ASSIGNED"];
const IN_PROGRESS_STATUSES = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
const COMPLETED_STATUSES = ["COMPLETED"];
const CANCELLED_STATUSES = ["CANCELLED"];

type UserWithoutPassword = Omit<User, "password">;

interface DriverStats {
  tasksCompletedToday: number;
  tasksInProgress: number;
  lastActivity: Date | null;
}

export default function ManageDriversScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { theme, isDark } = useTheme();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<UserWithoutPassword | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [editFormData, setEditFormData] = useState({ name: "", email: "", password: "", role: "driver" as "driver" | "admin" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const { data: users = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const drivers = users.filter((u) => u.role === "driver");

  const driverStatsMap = useMemo(() => {
    const statsMap = new Map<string, DriverStats>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    drivers.forEach((driver) => {
      const driverTasks = tasks.filter((t) => t.assignedTo === driver.id);
      const tasksCompletedToday = driverTasks.filter((t) => {
        if (!COMPLETED_STATUSES.includes(t.status) || !t.deliveryTimestamp) return false;
        const completedDate = new Date(t.deliveryTimestamp);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      }).length;

      const tasksInProgress = driverTasks.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length;

      const driverLogs = activityLogs.filter((log) => log.userId === driver.id);
      const lastActivity = driverLogs.length > 0
        ? new Date(Math.max(...driverLogs.map((log) => new Date(log.createdAt).getTime())))
        : null;

      statsMap.set(driver.id, {
        tasksCompletedToday,
        tasksInProgress,
        lastActivity,
      });
    });

    return statsMap;
  }, [drivers, tasks, activityLogs]);

  const selectedDriverLogs = useMemo(() => {
    if (!selectedDriver) return [];
    return activityLogs
      .filter((log) => log.userId === selectedDriver.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [selectedDriver, activityLogs]);

  const selectedDriverStats = useMemo(() => {
    if (!selectedDriver) return null;
    const driverTasks = tasks.filter((t) => t.assignedTo === selectedDriver.id);
    const totalCompleted = driverTasks.filter((t) => COMPLETED_STATUSES.includes(t.status)).length;
    const totalCancelled = driverTasks.filter((t) => CANCELLED_STATUSES.includes(t.status)).length;
    const totalInProgress = driverTasks.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length;
    const totalOpen = driverTasks.filter((t) => OPEN_STATUSES.includes(t.status)).length;
    return { totalCompleted, totalCancelled, totalInProgress, totalOpen, totalTasks: driverTasks.length };
  }, [selectedDriver, tasks]);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateDriver = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Bitte füllen Sie alle Felder aus");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("POST", "/api/users", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "driver",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fahrer konnte nicht erstellt werden");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      setEditError("Name und E-Mail sind erforderlich");
      return;
    }

    setIsSubmitting(true);
    setEditError("");

    try {
      const updateData: Record<string, string> = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
      };

      if (editFormData.password.trim()) {
        updateData.password = editFormData.password;
      }

      if (isAdmin && editFormData.role !== selectedDriver.role) {
        updateData.role = editFormData.role;
      }

      await apiRequest("PATCH", `/api/users/${selectedDriver.id}`, updateData);

      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/overview"] });
      setShowEditModal(false);
      setSelectedDriver(null);
      setEditFormData({ name: "", email: "", password: "", role: "driver" });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Fahrer konnte nicht aktualisiert werden");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDriverStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/users/${userId}`, { isActive: !isActive });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (err) {
      console.error("Failed to update driver status:", err);
    }
  };

  const openEditModal = (driver: UserWithoutPassword) => {
    setSelectedDriver(driver);
    setEditFormData({
      name: driver.name,
      email: driver.email,
      password: "",
      role: driver.role as "driver" | "admin",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const openDetailModal = (driver: UserWithoutPassword) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return "Keine Aktivität";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays < 7) return `Vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      pickup: "Abholung",
      delivery: "Lieferung",
      cancel: "Stornierung",
      login: "Anmeldung",
      logout: "Abmeldung",
      scan: "QR-Scan",
    };
    return labels[action] || action;
  };

  const renderDriver = ({ item }: { item: UserWithoutPassword }) => {
    const stats = driverStatsMap.get(item.id);
    
    return (
      <Card 
        style={{
          ...styles.driverCard, 
          backgroundColor: theme.cardSurface,
          ...(!item.isActive ? styles.inactiveCard : {})
        }}
        onPress={() => openDetailModal(item)}
      >
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <View style={[
              styles.avatar, 
              { backgroundColor: item.isActive ? theme.primary : theme.textTertiary },
              !item.isActive && styles.inactiveAvatar
            ]}>
              <ThemedText type="body" style={[styles.avatarText, { color: theme.textOnPrimary }]}>
                {getInitials(item.name)}
              </ThemedText>
            </View>
            <View style={styles.driverDetails}>
              <View style={styles.nameRow}>
                <ThemedText type="h4" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text, flex: 1 }}>{item.name}</ThemedText>
                {!item.isActive ? (
                  <View style={[styles.inactiveBadge, { backgroundColor: theme.errorLight }]}>
                    <ThemedText type="caption" style={{ color: theme.error, fontWeight: "700" }}>
                      INAKTIV
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText type="small" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.textSecondary }}>{item.email}</ThemedText>
            </View>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            hitSlop={8}
          >
            <Feather name="edit-2" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.statsRow, { borderTopColor: theme.divider }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.successLight }]}>
              <Feather name="check-circle" size={14} color={theme.success} />
            </View>
            <View>
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                {stats?.tasksCompletedToday || 0}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Heute erledigt
              </ThemedText>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.warningLight }]}>
              <Feather name="clock" size={14} color={theme.warning} />
            </View>
            <View>
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                {stats?.tasksInProgress || 0}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                In Bearbeitung
              </ThemedText>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.infoLight }]}>
              <Feather name="activity" size={14} color={theme.info} />
            </View>
            <View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatTimestamp(stats?.lastActivity || null)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.statusRow, { borderTopColor: theme.divider }]}>
          <Pressable
            style={[
              styles.statusButton, 
              item.isActive 
                ? { backgroundColor: theme.successLight } 
                : { backgroundColor: theme.errorLight }
            ]}
            onPress={(e) => {
              e.stopPropagation();
              toggleDriverStatus(item.id, item.isActive);
            }}
          >
            <Feather
              name={item.isActive ? "check" : "x"}
              size={16}
              color={item.isActive ? theme.success : theme.error}
            />
            <ThemedText
              type="small"
              style={[
                styles.statusText, 
                { color: item.isActive ? theme.success : theme.error }
              ]}
            >
              {item.isActive ? "Aktiv" : "Inaktiv"}
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={48} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.text }]}>
        Noch keine Fahrer
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Fügen Sie Fahrer hinzu, um Aufgaben zuzuweisen
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {drivers.length} Fahrer
        </ThemedText>
        <Button
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => {
            setFormData({ name: "", email: "", password: generatePassword() });
            setError("");
            setShowCreateModal(true);
          }}
        >
          <View style={styles.addContent}>
            <Feather name="plus" size={18} color={theme.textOnAccent} />
            <ThemedText type="small" style={[styles.addText, { color: theme.textOnAccent }]}>Fahrer hinzufügen</ThemedText>
          </View>
        </Button>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.id}
          renderItem={renderDriver}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="h3" style={{ color: theme.text }}>Neuen Fahrer hinzufügen</ThemedText>
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Vollständiger Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Name des Fahrers eingeben"
                  autoCapitalize="words"
                />

                <TextInput
                  label="E-Mail"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="E-Mail-Adresse eingeben"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordRow}>
                  <View style={styles.passwordInput}>
                    <TextInput
                      label="Passwort"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      placeholder="Passwort eingeben"
                    />
                  </View>
                  <Pressable
                    style={[styles.generateButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
                    onPress={() => setFormData({ ...formData, password: generatePassword() })}
                  >
                    <Feather name="refresh-cw" size={20} color={theme.primary} />
                  </Pressable>
                </View>

                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: theme.errorLight }]}>
                    <Feather name="alert-circle" size={16} color={theme.error} />
                    <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
                      {error}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalActions}>
                <Button
                  style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  style={[styles.submitButton, { backgroundColor: theme.accent }]}
                  onPress={handleCreateDriver}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.textOnAccent} />
                  ) : (
                    <ThemedText type="body" style={{ color: theme.textOnAccent, fontWeight: "600" }}>
                      Fahrer erstellen
                    </ThemedText>
                  )}
                </Button>
              </View>
            </View>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="h3" style={{ color: theme.text }}>Fahrer bearbeiten</ThemedText>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Vollständiger Name"
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  placeholder="Name des Fahrers eingeben"
                  autoCapitalize="words"
                />

                <TextInput
                  label="E-Mail"
                  value={editFormData.email}
                  onChangeText={(text) => setEditFormData({ ...editFormData, email: text })}
                  placeholder="E-Mail-Adresse eingeben"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordRow}>
                  <View style={styles.passwordInput}>
                    <TextInput
                      label="Neues Passwort (leer lassen für keine Änderung)"
                      value={editFormData.password}
                      onChangeText={(text) => setEditFormData({ ...editFormData, password: text })}
                      placeholder="Neues Passwort eingeben"
                    />
                  </View>
                  <Pressable
                    style={[styles.generateButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
                    onPress={() => setEditFormData({ ...editFormData, password: generatePassword() })}
                  >
                    <Feather name="refresh-cw" size={20} color={theme.primary} />
                  </Pressable>
                </View>

                {isAdmin ? (
                  <View style={styles.roleSection}>
                    <ThemedText type="small" style={[styles.roleLabel, { color: theme.textSecondary }]}>
                      Rolle
                    </ThemedText>
                    <View style={styles.roleOptions}>
                      <Pressable
                        style={[
                          styles.roleOption,
                          { borderColor: theme.border },
                          editFormData.role === "driver" && { 
                            backgroundColor: theme.primary, 
                            borderColor: theme.primary 
                          }
                        ]}
                        onPress={() => setEditFormData({ ...editFormData, role: "driver" })}
                      >
                        <Feather 
                          name="truck" 
                          size={16} 
                          color={editFormData.role === "driver" ? theme.textOnPrimary : theme.text} 
                        />
                        <ThemedText 
                          type="small" 
                          style={{ 
                            color: editFormData.role === "driver" ? theme.textOnPrimary : theme.text,
                            fontWeight: "600"
                          }}
                        >
                          Fahrer
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.roleOption,
                          { borderColor: theme.border },
                          editFormData.role === "admin" && { 
                            backgroundColor: theme.accent, 
                            borderColor: theme.accent 
                          }
                        ]}
                        onPress={() => setEditFormData({ ...editFormData, role: "admin" })}
                      >
                        <Feather 
                          name="shield" 
                          size={16} 
                          color={editFormData.role === "admin" ? theme.textOnAccent : theme.text} 
                        />
                        <ThemedText 
                          type="small" 
                          style={{ 
                            color: editFormData.role === "admin" ? theme.textOnAccent : theme.text,
                            fontWeight: "600"
                          }}
                        >
                          Admin
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {editError ? (
                  <View style={[styles.errorBanner, { backgroundColor: theme.errorLight }]}>
                    <Feather name="alert-circle" size={16} color={theme.error} />
                    <ThemedText type="small" style={{ color: theme.error, flex: 1 }}>
                      {editError}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalActions}>
                <Button
                  style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setShowEditModal(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  style={[styles.submitButton, { backgroundColor: theme.accent }]}
                  onPress={handleEditDriver}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.textOnAccent} />
                  ) : (
                    <ThemedText type="body" style={{ color: theme.textOnAccent, fontWeight: "600" }}>
                      Speichern
                    </ThemedText>
                  )}
                </Button>
              </View>
            </View>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.detailModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3" style={{ color: theme.text }}>Fahrer-Details</ThemedText>
              <Pressable
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedDriver ? (
              <ScrollView 
                style={styles.detailScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailHeader}>
                  <View style={[
                    styles.detailAvatar, 
                    { backgroundColor: selectedDriver.isActive ? theme.primary : theme.textTertiary }
                  ]}>
                    <ThemedText type="h3" style={[styles.avatarText, { color: theme.textOnPrimary }]}>
                      {getInitials(selectedDriver.name)}
                    </ThemedText>
                  </View>
                  <ThemedText type="h3" style={{ color: theme.text, marginTop: Spacing.md }}>
                    {selectedDriver.name}
                  </ThemedText>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    {selectedDriver.email}
                  </ThemedText>
                  <View style={[
                    styles.detailStatusBadge,
                    { backgroundColor: selectedDriver.isActive ? theme.successLight : theme.errorLight }
                  ]}>
                    <Feather 
                      name={selectedDriver.isActive ? "check-circle" : "x-circle"} 
                      size={14} 
                      color={selectedDriver.isActive ? theme.success : theme.error} 
                    />
                    <ThemedText 
                      type="small" 
                      style={{ 
                        color: selectedDriver.isActive ? theme.success : theme.error,
                        fontWeight: "600"
                      }}
                    >
                      {selectedDriver.isActive ? "Aktiv" : "Inaktiv"}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.detailSection, { borderTopColor: theme.divider }]}>
                  <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.text }]}>
                    Leistungsübersicht
                  </ThemedText>
                  <View style={styles.performanceGrid}>
                    <View style={[styles.performanceItem, { backgroundColor: theme.successLight }]}>
                      <ThemedText type="h3" style={{ color: theme.success }}>
                        {selectedDriverStats?.totalCompleted || 0}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.success }}>
                        Erledigt
                      </ThemedText>
                    </View>
                    <View style={[styles.performanceItem, { backgroundColor: theme.warningLight }]}>
                      <ThemedText type="h3" style={{ color: theme.warning }}>
                        {selectedDriverStats?.totalInProgress || 0}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.warning }}>
                        In Bearbeitung
                      </ThemedText>
                    </View>
                    <View style={[styles.performanceItem, { backgroundColor: theme.infoLight }]}>
                      <ThemedText type="h3" style={{ color: theme.info }}>
                        {selectedDriverStats?.totalOpen || 0}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.info }}>
                        Offen
                      </ThemedText>
                    </View>
                    <View style={[styles.performanceItem, { backgroundColor: theme.errorLight }]}>
                      <ThemedText type="h3" style={{ color: theme.error }}>
                        {selectedDriverStats?.totalCancelled || 0}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.error }}>
                        Storniert
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={[styles.detailSection, { borderTopColor: theme.divider }]}>
                  <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.text }]}>
                    Letzte Aktivitäten
                  </ThemedText>
                  {selectedDriverLogs.length > 0 ? (
                    <View style={styles.activityList}>
                      {selectedDriverLogs.map((log) => (
                        <View 
                          key={log.id} 
                          style={[styles.activityItem, { borderBottomColor: theme.divider }]}
                        >
                          <View style={[styles.activityIcon, { backgroundColor: theme.backgroundSecondary }]}>
                            <Feather 
                              name={
                                log.action === "pickup" ? "package" :
                                log.action === "delivery" ? "check-square" :
                                log.action === "cancel" ? "x-circle" :
                                log.action === "scan" ? "camera" :
                                "activity"
                              } 
                              size={16} 
                              color={theme.primary} 
                            />
                          </View>
                          <View style={styles.activityContent}>
                            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
                              {getActionLabel(log.action)}
                            </ThemedText>
                            {log.details ? (
                              <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                                {log.details}
                              </ThemedText>
                            ) : null}
                          </View>
                          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                            {formatTimestamp(log.createdAt)}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noActivity}>
                      <Feather name="inbox" size={32} color={theme.textTertiary} />
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                        Keine Aktivitäten vorhanden
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={[styles.detailSection, { borderTopColor: theme.divider }]}>
                  <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.text }]}>
                    Kontoinformationen
                  </ThemedText>
                  <View style={styles.infoRow}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Rolle</ThemedText>
                    <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
                      {selectedDriver.role === "admin" ? "Administrator" : "Fahrer"}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Erstellt am</ThemedText>
                    <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
                      {new Date(selectedDriver.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </ThemedText>
                  </View>
                </View>

                <Button
                  style={[styles.editFromDetailButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedDriver);
                  }}
                >
                  <View style={styles.addContent}>
                    <Feather name="edit-2" size={18} color={theme.textOnPrimary} />
                    <ThemedText type="small" style={[styles.addText, { color: theme.textOnPrimary }]}>Fahrer bearbeiten</ThemedText>
                  </View>
                </Button>
              </ScrollView>
            ) : null}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  addButton: {
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  addContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addText: {
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  driverCard: {
    padding: Spacing.lg,
  },
  inactiveCard: {
    opacity: 0.75,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  driverDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minWidth: 0,
  },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  inactiveAvatar: {},
  avatarText: {
    fontWeight: "600",
  },
  editButton: {
    padding: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyTitle: {},
  emptySubtitle: {},
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  detailModalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "90%",
    marginTop: "auto",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  roleSection: {
    gap: Spacing.sm,
  },
  roleLabel: {
    marginLeft: Spacing.xs,
  },
  roleOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: Spacing.xl,
  },
  detailHeader: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  detailStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  detailSection: {
    paddingTop: Spacing.xl,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  performanceItem: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  activityList: {
    gap: Spacing.xs,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  noActivity: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  editFromDetailButton: {
    marginTop: Spacing.xl,
  },
});
