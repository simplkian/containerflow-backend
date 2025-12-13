import React, { useState } from "react";
import { View, StyleSheet, FlatList, Modal, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, IndustrialDesign } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { useTheme } from "@/hooks/useTheme";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DepartmentManagementScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [editFormData, setEditFormData] = useState({ name: "", code: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const { data: departments = [], isLoading, refetch, isRefetching } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const activeDepartments = departments.filter((d) => d.isActive);
  const inactiveDepartments = departments.filter((d) => !d.isActive);
  const sortedDepartments = [...activeDepartments, ...inactiveDepartments];

  const handleCreateDepartment = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Name und Code sind erforderlich");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("POST", "/api/departments", {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowCreateModal(false);
      setFormData({ name: "", code: "", description: "" });
    } catch (err) {
      if (err instanceof Error && err.message.includes("409")) {
        setError("Der Code existiert bereits");
      } else {
        setError(err instanceof Error ? err.message : "Abteilung konnte nicht erstellt werden");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!selectedDepartment) return;
    if (!editFormData.name.trim() || !editFormData.code.trim()) {
      setEditError("Name und Code sind erforderlich");
      return;
    }

    setIsSubmitting(true);
    setEditError("");

    try {
      await apiRequest("PATCH", `/api/departments/${selectedDepartment.id}`, {
        name: editFormData.name.trim(),
        code: editFormData.code.trim().toUpperCase(),
        description: editFormData.description.trim() || null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowEditModal(false);
      setSelectedDepartment(null);
      setEditFormData({ name: "", code: "", description: "" });
    } catch (err) {
      if (err instanceof Error && err.message.includes("409")) {
        setEditError("Der Code existiert bereits");
      } else {
        setEditError(err instanceof Error ? err.message : "Abteilung konnte nicht aktualisiert werden");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDepartmentStatus = async (department: Department) => {
    try {
      if (department.isActive) {
        await apiRequest("DELETE", `/api/departments/${department.id}`);
      } else {
        await apiRequest("PATCH", `/api/departments/${department.id}`, { isActive: true });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    } catch (err) {
      console.error("Failed to update department status:", err);
    }
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setEditFormData({
      name: department.name,
      code: department.code,
      description: department.description || "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const renderDepartment = ({ item }: { item: Department }) => {
    return (
      <Card 
        style={{
          ...styles.departmentCard, 
          backgroundColor: theme.cardSurface,
          ...(!item.isActive ? styles.inactiveCard : {})
        }}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.departmentHeader}>
          <View style={styles.departmentInfo}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: item.isActive ? theme.primary : theme.textTertiary }
            ]}>
              <Feather name="briefcase" size={20} color={theme.textOnPrimary} />
            </View>
            <View style={styles.departmentDetails}>
              <View style={styles.nameRow}>
                <ThemedText type="h4" style={{ color: theme.text }}>{item.name}</ThemedText>
                {!item.isActive ? (
                  <View style={[styles.inactiveBadge, { backgroundColor: theme.errorLight }]}>
                    <ThemedText type="caption" style={{ color: theme.error, fontWeight: "700" }}>
                      INAKTIV
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <View style={styles.codeRow}>
                <View style={[styles.codeBadge, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                    {item.code}
                  </ThemedText>
                </View>
              </View>
              {item.description ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }} numberOfLines={2}>
                  {item.description}
                </ThemedText>
              ) : null}
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
              toggleDepartmentStatus(item);
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
      <Feather name="briefcase" size={48} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.text }]}>
        Keine Abteilungen
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Erstellen Sie Abteilungen, um Benutzer zu organisieren
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {departments.length} Abteilung{departments.length !== 1 ? "en" : ""}
        </ThemedText>
        <Button
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => {
            setFormData({ name: "", code: "", description: "" });
            setError("");
            setShowCreateModal(true);
          }}
        >
          <View style={styles.addContent}>
            <Feather name="plus" size={18} color={theme.textOnAccent} />
            <ThemedText type="small" style={[styles.addText, { color: theme.textOnAccent }]}>Hinzufügen</ThemedText>
          </View>
        </Button>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={sortedDepartments}
          keyExtractor={(item) => item.id}
          renderItem={renderDepartment}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl + 80 },
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.accent}
            />
          }
        />
      )}

      <Pressable
        style={[
          styles.fab,
          { 
            backgroundColor: theme.accent, 
            bottom: tabBarHeight + Spacing.lg 
          }
        ]}
        onPress={() => {
          setFormData({ name: "", code: "", description: "" });
          setError("");
          setShowCreateModal(true);
        }}
      >
        <Feather name="plus" size={24} color={theme.textOnAccent} />
      </Pressable>

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
                <ThemedText type="h3" style={{ color: theme.text }}>Neue Abteilung</ThemedText>
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="z.B. Produktion"
                  autoCapitalize="words"
                />

                <TextInput
                  label="Code"
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                  placeholder="z.B. PROD"
                  autoCapitalize="characters"
                />

                <TextInput
                  label="Beschreibung (optional)"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Kurze Beschreibung der Abteilung"
                  multiline
                  numberOfLines={3}
                />

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
                  onPress={handleCreateDepartment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.textOnAccent} />
                  ) : (
                    <ThemedText type="body" style={{ color: theme.textOnAccent, fontWeight: "600" }}>
                      Erstellen
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
                <ThemedText type="h3" style={{ color: theme.text }}>Abteilung bearbeiten</ThemedText>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Name"
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  placeholder="z.B. Produktion"
                  autoCapitalize="words"
                />

                <TextInput
                  label="Code"
                  value={editFormData.code}
                  onChangeText={(text) => setEditFormData({ ...editFormData, code: text.toUpperCase() })}
                  placeholder="z.B. PROD"
                  autoCapitalize="characters"
                />

                <TextInput
                  label="Beschreibung (optional)"
                  value={editFormData.description}
                  onChangeText={(text) => setEditFormData({ ...editFormData, description: text })}
                  placeholder="Kurze Beschreibung der Abteilung"
                  multiline
                  numberOfLines={3}
                />

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
                  onPress={handleEditDepartment}
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
  departmentCard: {
    padding: Spacing.lg,
  },
  inactiveCard: {
    opacity: 0.75,
  },
  departmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  departmentInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    flex: 1,
  },
  departmentDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  codeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    padding: Spacing.sm,
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
  emptySubtitle: {
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
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
});
