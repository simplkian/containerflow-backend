import React, { useState } from "react";
import { View, StyleSheet, FlatList, Modal, ActivityIndicator, Pressable, Switch, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { FilterChip } from "@/components/FilterChip";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";

type EntityTab = "materials" | "halls" | "stations" | "stands" | "boxes";
type ModalMode = "view" | "create" | "edit";

interface Material {
  id: string;
  name: string;
  code: string;
  description?: string;
  hazardClass?: string;
  disposalStream?: string;
  densityHint?: number;
  defaultUnit: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Hall {
  id: string;
  name: string;
  code: string;
  description?: string;
  locationMeta?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Station {
  id: string;
  hallId: string;
  name: string;
  code: string;
  sequence?: number;
  locationMeta?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hall?: Hall;
}

interface Stand {
  id: string;
  stationId: string;
  identifier: string;
  materialId?: string;
  qrCode: string;
  sequence?: number;
  positionMeta?: any;
  dailyFull: boolean;
  lastDailyTaskGeneratedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station?: Station;
  material?: Material;
}

interface Box {
  id: string;
  standId?: string;
  qrCode: string;
  serial: string;
  status: string;
  currentTaskId?: string;
  lastSeenAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stand?: Stand;
}

interface MaterialFormData {
  name: string;
  code: string;
  hazardClass: string;
  disposalStream: string;
  description: string;
}

interface HallFormData {
  name: string;
  code: string;
  description: string;
}

interface StationFormData {
  hallId: string;
  name: string;
  code: string;
  sequence: string;
}

interface StandFormData {
  stationId: string;
  materialId: string;
  identifier: string;
  dailyFull: boolean;
}

interface BoxFormData {
  standId: string;
  serial: string;
}

const TAB_LABELS: Record<EntityTab, string> = {
  materials: "Materialien",
  halls: "Hallen",
  stations: "Stationen",
  stands: "Stellplätze",
  boxes: "Boxen",
};

export default function AutomotiveManagementScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<EntityTab>("materials");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standPickerVisible, setStandPickerVisible] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  const [materialForm, setMaterialForm] = useState<MaterialFormData>({ name: "", code: "", hazardClass: "", disposalStream: "", description: "" });
  const [hallForm, setHallForm] = useState<HallFormData>({ name: "", code: "", description: "" });
  const [stationForm, setStationForm] = useState<StationFormData>({ hallId: "", name: "", code: "", sequence: "" });
  const [standForm, setStandForm] = useState<StandFormData>({ stationId: "", materialId: "", identifier: "", dailyFull: false });
  const [boxForm, setBoxForm] = useState<BoxFormData>({ standId: "", serial: "" });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: materials = [], isLoading: loadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: halls = [], isLoading: loadingHalls } = useQuery<Hall[]>({
    queryKey: ["/api/halls"],
  });

  const { data: stations = [], isLoading: loadingStations } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: stands = [], isLoading: loadingStands } = useQuery<Stand[]>({
    queryKey: ["/api/stands"],
  });

  const { data: boxes = [], isLoading: loadingBoxes } = useQuery<Box[]>({
    queryKey: ["/api/boxes"],
  });

  const isLoading = {
    materials: loadingMaterials,
    halls: loadingHalls,
    stations: loadingStations,
    stands: loadingStands,
    boxes: loadingBoxes,
  }[activeTab];

  const resetAllForms = () => {
    setMaterialForm({ name: "", code: "", hazardClass: "", disposalStream: "", description: "" });
    setHallForm({ name: "", code: "", description: "" });
    setStationForm({ hallId: "", name: "", code: "", sequence: "" });
    setStandForm({ stationId: "", materialId: "", identifier: "", dailyFull: false });
    setBoxForm({ standId: "", serial: "" });
    setFormErrors({});
  };

  const clearSelections = () => {
    setSelectedMaterial(null);
    setSelectedHall(null);
    setSelectedStation(null);
    setSelectedStand(null);
    setSelectedBox(null);
  };

  const openCreateModal = () => {
    resetAllForms();
    clearSelections();
    setModalMode("create");
    setModalVisible(true);
  };

  const openViewModal = (item: any) => {
    clearSelections();
    if (activeTab === "materials") setSelectedMaterial(item);
    else if (activeTab === "halls") setSelectedHall(item);
    else if (activeTab === "stations") setSelectedStation(item);
    else if (activeTab === "stands") setSelectedStand(item);
    else if (activeTab === "boxes") setSelectedBox(item);
    setModalMode("view");
    setModalVisible(true);
  };

  const openEditModal = () => {
    setFormErrors({});
    if (activeTab === "materials" && selectedMaterial) {
      setMaterialForm({
        name: selectedMaterial.name,
        code: selectedMaterial.code,
        hazardClass: selectedMaterial.hazardClass || "",
        disposalStream: selectedMaterial.disposalStream || "",
        description: selectedMaterial.description || "",
      });
    } else if (activeTab === "halls" && selectedHall) {
      setHallForm({
        name: selectedHall.name,
        code: selectedHall.code,
        description: selectedHall.description || "",
      });
    } else if (activeTab === "stations" && selectedStation) {
      setStationForm({
        hallId: selectedStation.hallId,
        name: selectedStation.name,
        code: selectedStation.code,
        sequence: selectedStation.sequence?.toString() || "",
      });
    } else if (activeTab === "stands" && selectedStand) {
      setStandForm({
        stationId: selectedStand.stationId,
        materialId: selectedStand.materialId || "",
        identifier: selectedStand.identifier,
        dailyFull: selectedStand.dailyFull,
      });
    } else if (activeTab === "boxes" && selectedBox) {
      setBoxForm({
        standId: selectedBox.standId || "",
        serial: selectedBox.serial,
      });
    }
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalVisible(false);
    clearSelections();
    resetAllForms();
    setModalMode("view");
  };

  const validateMaterialForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!materialForm.name.trim()) errors.name = "Name ist erforderlich";
    if (!materialForm.code.trim()) errors.code = "Code ist erforderlich";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateHallForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!hallForm.name.trim()) errors.name = "Name ist erforderlich";
    if (!hallForm.code.trim()) errors.code = "Code ist erforderlich";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStationForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!stationForm.hallId) errors.hallId = "Halle ist erforderlich";
    if (!stationForm.name.trim()) errors.name = "Name ist erforderlich";
    if (!stationForm.code.trim()) errors.code = "Code ist erforderlich";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStandForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!standForm.stationId) errors.stationId = "Station ist erforderlich";
    if (!standForm.identifier.trim()) errors.identifier = "Kennung ist erforderlich";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBoxForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!boxForm.serial.trim()) errors.serial = "Seriennummer ist erforderlich";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "materials") {
        if (!validateMaterialForm()) { setIsSubmitting(false); return; }
        await apiRequest("POST", "/api/materials", {
          name: materialForm.name.trim(),
          code: materialForm.code.trim(),
          hazardClass: materialForm.hazardClass.trim() || null,
          disposalStream: materialForm.disposalStream.trim() || null,
          description: materialForm.description.trim() || null,
          defaultUnit: "kg",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        showToast("Material wurde erfolgreich erstellt", "success");
      } else if (activeTab === "halls") {
        if (!validateHallForm()) { setIsSubmitting(false); return; }
        await apiRequest("POST", "/api/halls", {
          name: hallForm.name.trim(),
          code: hallForm.code.trim(),
          description: hallForm.description.trim() || null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/halls"] });
        showToast("Halle wurde erfolgreich erstellt", "success");
      } else if (activeTab === "stations") {
        if (!validateStationForm()) { setIsSubmitting(false); return; }
        await apiRequest("POST", "/api/stations", {
          hallId: stationForm.hallId,
          name: stationForm.name.trim(),
          code: stationForm.code.trim(),
          sequence: stationForm.sequence ? parseInt(stationForm.sequence, 10) : null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
        showToast("Station wurde erfolgreich erstellt", "success");
      } else if (activeTab === "stands") {
        if (!validateStandForm()) { setIsSubmitting(false); return; }
        await apiRequest("POST", "/api/stands", {
          stationId: standForm.stationId,
          materialId: standForm.materialId || null,
          identifier: standForm.identifier.trim(),
          dailyFull: standForm.dailyFull,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stands"] });
        showToast("Stellplatz wurde erfolgreich erstellt", "success");
      } else if (activeTab === "boxes") {
        if (!validateBoxForm()) { setIsSubmitting(false); return; }
        await apiRequest("POST", "/api/boxes", {
          standId: boxForm.standId || null,
          serial: boxForm.serial.trim(),
          status: "AT_STAND",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
        showToast("Box wurde erfolgreich erstellt", "success");
      }
      closeModal();
    } catch (err) {
      console.error("Failed to create:", err);
      showToast("Fehler beim Erstellen", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "materials" && selectedMaterial) {
        if (!validateMaterialForm()) { setIsSubmitting(false); return; }
        await apiRequest("PUT", `/api/materials/${selectedMaterial.id}`, {
          name: materialForm.name.trim(),
          code: materialForm.code.trim(),
          hazardClass: materialForm.hazardClass.trim() || null,
          disposalStream: materialForm.disposalStream.trim() || null,
          description: materialForm.description.trim() || null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        showToast("Material wurde erfolgreich aktualisiert", "success");
      } else if (activeTab === "halls" && selectedHall) {
        if (!validateHallForm()) { setIsSubmitting(false); return; }
        await apiRequest("PUT", `/api/halls/${selectedHall.id}`, {
          name: hallForm.name.trim(),
          code: hallForm.code.trim(),
          description: hallForm.description.trim() || null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/halls"] });
        showToast("Halle wurde erfolgreich aktualisiert", "success");
      } else if (activeTab === "stations" && selectedStation) {
        if (!validateStationForm()) { setIsSubmitting(false); return; }
        await apiRequest("PUT", `/api/stations/${selectedStation.id}`, {
          hallId: stationForm.hallId,
          name: stationForm.name.trim(),
          code: stationForm.code.trim(),
          sequence: stationForm.sequence ? parseInt(stationForm.sequence, 10) : null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
        showToast("Station wurde erfolgreich aktualisiert", "success");
      } else if (activeTab === "stands" && selectedStand) {
        if (!validateStandForm()) { setIsSubmitting(false); return; }
        await apiRequest("PUT", `/api/stands/${selectedStand.id}`, {
          stationId: standForm.stationId,
          materialId: standForm.materialId || null,
          identifier: standForm.identifier.trim(),
          dailyFull: standForm.dailyFull,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stands"] });
        showToast("Stellplatz wurde erfolgreich aktualisiert", "success");
      } else if (activeTab === "boxes" && selectedBox) {
        if (!validateBoxForm()) { setIsSubmitting(false); return; }
        await apiRequest("PUT", `/api/boxes/${selectedBox.id}`, {
          standId: boxForm.standId || null,
          serial: boxForm.serial.trim(),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
        showToast("Box wurde erfolgreich aktualisiert", "success");
      }
      closeModal();
    } catch (err) {
      console.error("Failed to update:", err);
      showToast("Fehler beim Aktualisieren", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "materials" && selectedMaterial) {
        await apiRequest("PUT", `/api/materials/${selectedMaterial.id}`, { isActive: !selectedMaterial.isActive });
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        setSelectedMaterial({ ...selectedMaterial, isActive: !selectedMaterial.isActive });
      } else if (activeTab === "halls" && selectedHall) {
        await apiRequest("PUT", `/api/halls/${selectedHall.id}`, { isActive: !selectedHall.isActive });
        queryClient.invalidateQueries({ queryKey: ["/api/halls"] });
        setSelectedHall({ ...selectedHall, isActive: !selectedHall.isActive });
      } else if (activeTab === "stations" && selectedStation) {
        await apiRequest("PUT", `/api/stations/${selectedStation.id}`, { isActive: !selectedStation.isActive });
        queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
        setSelectedStation({ ...selectedStation, isActive: !selectedStation.isActive });
      } else if (activeTab === "stands" && selectedStand) {
        await apiRequest("PUT", `/api/stands/${selectedStand.id}`, { isActive: !selectedStand.isActive });
        queryClient.invalidateQueries({ queryKey: ["/api/stands"] });
        setSelectedStand({ ...selectedStand, isActive: !selectedStand.isActive });
      } else if (activeTab === "boxes" && selectedBox) {
        await apiRequest("PUT", `/api/boxes/${selectedBox.id}`, { isActive: !selectedBox.isActive });
        queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
        setSelectedBox({ ...selectedBox, isActive: !selectedBox.isActive });
      }
      showToast("Status wurde aktualisiert", "success");
    } catch (err) {
      console.error("Failed to toggle active:", err);
      showToast("Fehler beim Ändern des Status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePositionBox = async (standId: string) => {
    if (!selectedBox) return;
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/boxes/${selectedBox.id}/position`, { standId });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stands"] });
      const stand = stands.find(s => s.id === standId);
      setSelectedBox({ ...selectedBox, standId, status: "AT_STAND", stand: stand || undefined });
      setStandPickerVisible(false);
      showToast(`Box wurde am Stellplatz ${stand?.identifier || ""} positioniert`, "success");
    } catch (err) {
      console.error("Failed to position box:", err);
      showToast("Fehler beim Positionieren der Box", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBoxFromStand = async () => {
    if (!selectedBox) return;
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/boxes/${selectedBox.id}`, { standId: null, status: "IN_TRANSIT" });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stands"] });
      setSelectedBox({ ...selectedBox, standId: undefined, status: "IN_TRANSIT", stand: undefined });
      showToast("Box wurde vom Stellplatz entfernt", "success");
    } catch (err) {
      console.error("Failed to remove box from stand:", err);
      showToast("Fehler beim Entfernen der Box vom Stellplatz", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getHallName = (hallId: string) => {
    const hall = halls.find(h => h.id === hallId);
    return hall ? hall.name : "-";
  };

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    return station ? station.name : "-";
  };

  const getMaterialName = (materialId: string | undefined) => {
    if (!materialId) return "-";
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : "-";
  };

  const getStandInfo = (standId: string | undefined) => {
    if (!standId) return "-";
    const stand = stands.find(s => s.id === standId);
    return stand ? stand.identifier : "-";
  };

  const renderMaterialItem = ({ item }: { item: Material }) => (
    <Card style={[styles.itemCard, ...(!item.isActive ? [styles.inactiveCard] : [])]} onPress={() => openViewModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Feather name="box" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View style={styles.itemDetails}>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[{ color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.name}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inaktiv" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Code: {item.code}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.detailsRow}>
        {item.hazardClass ? (
          <View style={styles.detailItem}>
            <Feather name="alert-triangle" size={14} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.hazardClass}</ThemedText>
          </View>
        ) : null}
        {item.disposalStream ? (
          <View style={styles.detailItem}>
            <Feather name="trash-2" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.disposalStream}</ThemedText>
          </View>
        ) : null}
      </View>
    </Card>
  );

  const renderHallItem = ({ item }: { item: Hall }) => (
    <Card style={[styles.itemCard, ...(!item.isActive ? [styles.inactiveCard] : [])]} onPress={() => openViewModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Feather name="home" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View style={styles.itemDetails}>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[{ color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.name}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inaktiv" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Code: {item.code}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      {item.description ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={2}>{item.description}</ThemedText>
      ) : null}
    </Card>
  );

  const renderStationItem = ({ item }: { item: Station }) => (
    <Card style={[styles.itemCard, ...(!item.isActive ? [styles.inactiveCard] : [])]} onPress={() => openViewModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Feather name="map-pin" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View style={styles.itemDetails}>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[{ color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.name}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inaktiv" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Code: {item.code}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="home" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{getHallName(item.hallId)}</ThemedText>
        </View>
        {item.sequence !== null && item.sequence !== undefined ? (
          <View style={styles.detailItem}>
            <Feather name="hash" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Seq: {item.sequence}</ThemedText>
          </View>
        ) : null}
      </View>
    </Card>
  );

  const renderStandItem = ({ item }: { item: Stand }) => (
    <Card style={[styles.itemCard, ...(!item.isActive ? [styles.inactiveCard] : [])]} onPress={() => openViewModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Feather name="target" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View style={styles.itemDetails}>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[{ color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.identifier}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inaktiv" size="small" /> : null}
              {item.dailyFull ? <StatusBadge status="warning" label="Täglich Voll" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{getMaterialName(item.materialId)}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="grid" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, fontFamily: "monospace" }} numberOfLines={1}>{item.qrCode.substring(0, 20)}...</ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderBoxItem = ({ item }: { item: Box }) => (
    <Card style={[styles.itemCard, ...(!item.isActive ? [styles.inactiveCard] : [])]} onPress={() => openViewModal(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Feather name="package" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View style={styles.itemDetails}>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[{ color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.serial}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inaktiv" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Status: {item.status}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="target" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Stellplatz: {getStandInfo(item.standId)}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Feather name="grid" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, fontFamily: "monospace" }} numberOfLines={1}>{item.qrCode.substring(0, 16)}...</ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={48} color={theme.textSecondary} />
      <ThemedText type="h4">Keine Einträge</ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Noch keine {TAB_LABELS[activeTab]} vorhanden
      </ThemedText>
      <Button onPress={openCreateModal} style={styles.emptyButton}>
        {TAB_LABELS[activeTab].slice(0, -1)} hinzufügen
      </Button>
    </View>
  );

  const renderDropdown = (label: string, value: string, options: { id: string; label: string }[], onChange: (val: string) => void, error?: string, disabled?: boolean) => (
    <View style={styles.dropdownContainer}>
      <ThemedText type="small" style={[styles.label, { color: error ? theme.error : theme.textSecondary }]}>{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.dropdownScroll, disabled && { opacity: 0.5 }]} contentContainerStyle={styles.dropdownContent}>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            style={[
              styles.dropdownOption,
              { borderColor: theme.border, backgroundColor: value === opt.id ? theme.accent : theme.cardSurface },
            ]}
            onPress={() => !disabled && onChange(opt.id)}
            disabled={disabled}
          >
            <ThemedText type="small" style={{ color: value === opt.id ? theme.textOnAccent : theme.text }}>{opt.label}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <ThemedText type="caption" style={{ color: theme.error, marginTop: Spacing.xs }}>{error}</ThemedText> : null}
    </View>
  );

  const renderMaterialForm = () => (
    <>
      <TextInput
        label="Name"
        value={materialForm.name}
        onChangeText={(text) => setMaterialForm({ ...materialForm, name: text })}
        placeholder="z.B. Aluminium Späne"
        error={formErrors.name}
      />
      <TextInput
        label="Code"
        value={materialForm.code}
        onChangeText={(text) => setMaterialForm({ ...materialForm, code: text })}
        placeholder="z.B. ALU-001"
        error={formErrors.code}
        editable={modalMode === "create"}
      />
      <TextInput
        label="Gefahrenklasse"
        value={materialForm.hazardClass}
        onChangeText={(text) => setMaterialForm({ ...materialForm, hazardClass: text })}
        placeholder="z.B. H2 (Optional)"
      />
      <TextInput
        label="Entsorgungsstrom"
        value={materialForm.disposalStream}
        onChangeText={(text) => setMaterialForm({ ...materialForm, disposalStream: text })}
        placeholder="z.B. Metall-Recycling (Optional)"
      />
      <TextInput
        label="Beschreibung"
        value={materialForm.description}
        onChangeText={(text) => setMaterialForm({ ...materialForm, description: text })}
        placeholder="Optionale Beschreibung"
        multiline
      />
    </>
  );

  const renderHallForm = () => (
    <>
      <TextInput
        label="Name"
        value={hallForm.name}
        onChangeText={(text) => setHallForm({ ...hallForm, name: text })}
        placeholder="z.B. Halle A"
        error={formErrors.name}
      />
      <TextInput
        label="Code"
        value={hallForm.code}
        onChangeText={(text) => setHallForm({ ...hallForm, code: text })}
        placeholder="z.B. HA"
        error={formErrors.code}
        editable={modalMode === "create"}
      />
      <TextInput
        label="Beschreibung"
        value={hallForm.description}
        onChangeText={(text) => setHallForm({ ...hallForm, description: text })}
        placeholder="Optionale Beschreibung"
        multiline
      />
    </>
  );

  const renderStationForm = () => (
    <>
      {renderDropdown(
        "Halle",
        stationForm.hallId,
        halls.filter(h => h.isActive).map(h => ({ id: h.id, label: h.name })),
        (val) => setStationForm({ ...stationForm, hallId: val }),
        formErrors.hallId,
        modalMode === "edit"
      )}
      <TextInput
        label="Name"
        value={stationForm.name}
        onChangeText={(text) => setStationForm({ ...stationForm, name: text })}
        placeholder="z.B. Station 1"
        error={formErrors.name}
      />
      <TextInput
        label="Code"
        value={stationForm.code}
        onChangeText={(text) => setStationForm({ ...stationForm, code: text })}
        placeholder="z.B. ST-001"
        error={formErrors.code}
      />
      <TextInput
        label="Reihenfolge"
        value={stationForm.sequence}
        onChangeText={(text) => setStationForm({ ...stationForm, sequence: text })}
        placeholder="z.B. 1 (Optional)"
        keyboardType="numeric"
      />
    </>
  );

  const renderStandForm = () => (
    <>
      {renderDropdown(
        "Station",
        standForm.stationId,
        stations.filter(s => s.isActive).map(s => ({ id: s.id, label: `${s.name} (${getHallName(s.hallId)})` })),
        (val) => setStandForm({ ...standForm, stationId: val }),
        formErrors.stationId,
        modalMode === "edit"
      )}
      {renderDropdown(
        "Material (Optional)",
        standForm.materialId,
        [{ id: "", label: "Kein Material" }, ...materials.filter(m => m.isActive).map(m => ({ id: m.id, label: m.name }))],
        (val) => setStandForm({ ...standForm, materialId: val })
      )}
      <TextInput
        label="Kennung"
        value={standForm.identifier}
        onChangeText={(text) => setStandForm({ ...standForm, identifier: text })}
        placeholder="z.B. SP-A1-01"
        error={formErrors.identifier}
      />
      <View style={styles.switchRow}>
        <ThemedText type="body">Täglich Voll (Daily Full)</ThemedText>
        <Switch
          value={standForm.dailyFull}
          onValueChange={(val) => setStandForm({ ...standForm, dailyFull: val })}
          trackColor={{ false: theme.backgroundTertiary, true: theme.success }}
          thumbColor={theme.backgroundRoot}
        />
      </View>
    </>
  );

  const renderBoxForm = () => (
    <>
      {renderDropdown(
        "Stellplatz (Optional)",
        boxForm.standId,
        [{ id: "", label: "Kein Stellplatz" }, ...stands.filter(s => s.isActive).map(s => ({ id: s.id, label: s.identifier }))],
        (val) => setBoxForm({ ...boxForm, standId: val }),
        undefined,
        modalMode === "edit"
      )}
      <TextInput
        label="Seriennummer"
        value={boxForm.serial}
        onChangeText={(text) => setBoxForm({ ...boxForm, serial: text })}
        placeholder="z.B. BOX-2024-001"
        error={formErrors.serial}
      />
    </>
  );

  const renderFormModal = () => (
    <KeyboardAwareScrollViewCompat contentContainerStyle={styles.formScrollContent}>
      <ThemedText type="h4" style={styles.formSectionTitle}>
        {modalMode === "create" ? `${TAB_LABELS[activeTab].slice(0, -1)} erstellen` : `${TAB_LABELS[activeTab].slice(0, -1)} bearbeiten`}
      </ThemedText>
      
      {activeTab === "materials" ? renderMaterialForm() : null}
      {activeTab === "halls" ? renderHallForm() : null}
      {activeTab === "stations" ? renderStationForm() : null}
      {activeTab === "stands" ? renderStandForm() : null}
      {activeTab === "boxes" ? renderBoxForm() : null}
      
      <View style={styles.formActions}>
        <Button
          variant="tertiary"
          onPress={modalMode === "edit" ? () => setModalMode("view") : closeModal}
          style={styles.formButton}
        >
          Abbrechen
        </Button>
        <Button
          onPress={modalMode === "create" ? handleCreate : handleUpdate}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={styles.formButton}
        >
          {modalMode === "create" ? "Erstellen" : "Speichern"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );

  const renderDetailRow = (label: string, value: string | null | undefined) => (
    <View style={styles.detailRow}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText type="body">{value || "-"}</ThemedText>
    </View>
  );

  const renderViewModal = () => {
    const selectedItem = selectedMaterial || selectedHall || selectedStation || selectedStand || selectedBox;
    if (!selectedItem) return null;

    return (
      <ScrollView contentContainerStyle={styles.viewScrollContent}>
        <Card style={styles.detailCard}>
          <View style={styles.itemInfo}>
            <Feather 
              name={activeTab === "materials" ? "box" : activeTab === "halls" ? "home" : activeTab === "stations" ? "map-pin" : activeTab === "stands" ? "target" : "package"} 
              size={32} 
              color={selectedItem.isActive ? theme.primary : theme.textTertiary} 
            />
            <View style={styles.headerTextContainer}>
              <ThemedText type="h4">
                {activeTab === "materials" ? (selectedItem as Material).name :
                 activeTab === "halls" ? (selectedItem as Hall).name :
                 activeTab === "stations" ? (selectedItem as Station).name :
                 activeTab === "stands" ? (selectedItem as Stand).identifier :
                 (selectedItem as Box).serial}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {activeTab === "materials" ? `Code: ${(selectedItem as Material).code}` :
                 activeTab === "halls" ? `Code: ${(selectedItem as Hall).code}` :
                 activeTab === "stations" ? `Code: ${(selectedItem as Station).code}` :
                 activeTab === "stands" ? `Station: ${getStationName((selectedItem as Stand).stationId)}` :
                 `Status: ${(selectedItem as Box).status}`}
              </ThemedText>
            </View>
            <View style={styles.statusToggle}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                {selectedItem.isActive ? "Aktiv" : "Inaktiv"}
              </ThemedText>
              <Switch
                value={selectedItem.isActive}
                onValueChange={handleToggleActive}
                disabled={isSubmitting}
                trackColor={{ false: theme.backgroundTertiary, true: theme.success }}
                thumbColor={theme.backgroundRoot}
              />
            </View>
          </View>

          <View style={styles.detailsList}>
            {activeTab === "materials" ? (
              <>
                {renderDetailRow("Gefahrenklasse", (selectedItem as Material).hazardClass)}
                {renderDetailRow("Entsorgungsstrom", (selectedItem as Material).disposalStream)}
                {renderDetailRow("Beschreibung", (selectedItem as Material).description)}
                {renderDetailRow("Standardeinheit", (selectedItem as Material).defaultUnit)}
              </>
            ) : null}
            {activeTab === "halls" ? (
              <>
                {renderDetailRow("Beschreibung", (selectedItem as Hall).description)}
              </>
            ) : null}
            {activeTab === "stations" ? (
              <>
                {renderDetailRow("Halle", getHallName((selectedItem as Station).hallId))}
                {renderDetailRow("Reihenfolge", (selectedItem as Station).sequence?.toString())}
              </>
            ) : null}
            {activeTab === "stands" ? (
              <>
                {renderDetailRow("Station", getStationName((selectedItem as Stand).stationId))}
                {renderDetailRow("Material", getMaterialName((selectedItem as Stand).materialId))}
                {renderDetailRow("Täglich Voll", (selectedItem as Stand).dailyFull ? "Ja" : "Nein")}
                {renderDetailRow("QR-Code", (selectedItem as Stand).qrCode)}
              </>
            ) : null}
            {activeTab === "boxes" ? (
              <>
                {renderDetailRow("Stellplatz", getStandInfo((selectedItem as Box).standId))}
                {renderDetailRow("Status", (selectedItem as Box).status)}
                {renderDetailRow("QR-Code", (selectedItem as Box).qrCode)}
                {renderDetailRow("Zuletzt gesehen", formatDate((selectedItem as Box).lastSeenAt))}
                {renderDetailRow("Notizen", (selectedItem as Box).notes)}
              </>
            ) : null}
            {renderDetailRow("Erstellt am", formatDate(selectedItem.createdAt))}
            {renderDetailRow("Aktualisiert am", formatDate(selectedItem.updatedAt))}
          </View>
        </Card>

        <View style={styles.actionButtons}>
          <Button variant="secondary" onPress={openEditModal} style={styles.actionButton}>
            <View style={styles.buttonContent}>
              <Feather name="edit-2" size={18} color={theme.primary} />
              <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>Bearbeiten</ThemedText>
            </View>
          </Button>
          
          {activeTab === "boxes" && selectedBox ? (
            <>
              <Button 
                variant="secondary" 
                onPress={() => setStandPickerVisible(true)} 
                style={styles.actionButton}
                disabled={isSubmitting}
              >
                <View style={styles.buttonContent}>
                  <Feather name="map-pin" size={18} color={theme.success} />
                  <ThemedText type="body" style={{ color: theme.success, fontWeight: "600" }}>Am Stellplatz positionieren</ThemedText>
                </View>
              </Button>
              
              {selectedBox.standId ? (
                <Button 
                  variant="secondary" 
                  onPress={handleRemoveBoxFromStand} 
                  style={styles.actionButton}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <View style={styles.buttonContent}>
                    <Feather name="x-circle" size={18} color={theme.error} />
                    <ThemedText type="body" style={{ color: theme.error, fontWeight: "600" }}>Vom Stellplatz entfernen</ThemedText>
                  </View>
                </Button>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  const getModalTitle = () => {
    if (modalMode === "create") return `${TAB_LABELS[activeTab].slice(0, -1)} hinzufügen`;
    if (modalMode === "edit") return `${TAB_LABELS[activeTab].slice(0, -1)} bearbeiten`;
    return `${TAB_LABELS[activeTab].slice(0, -1)} Details`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabContainer, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {(Object.keys(TAB_LABELS) as EntityTab[]).map((tab) => (
            <FilterChip
              key={tab}
              label={TAB_LABELS[tab]}
              selected={activeTab === tab}
              onPress={() => setActiveTab(tab)}
              small
            />
          ))}
        </ScrollView>
        <Pressable style={[styles.addButton, { backgroundColor: theme.accent }]} onPress={openCreateModal}>
          <Feather name="plus" size={24} color={theme.textOnAccent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : activeTab === "materials" ? (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          renderItem={renderMaterialItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === "halls" ? (
        <FlatList
          data={halls}
          keyExtractor={(item) => item.id}
          renderItem={renderHallItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === "stations" ? (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          renderItem={renderStationItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === "stands" ? (
        <FlatList
          data={stands}
          keyExtractor={(item) => item.id}
          renderItem={renderStandItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={boxes}
          keyExtractor={(item) => item.id}
          renderItem={renderBoxItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="h3">{getModalTitle()}</ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            {modalMode === "view" ? renderViewModal() : renderFormModal()}
          </View>
        </View>
      </Modal>

      <Modal visible={standPickerVisible} animationType="slide" transparent onRequestClose={() => setStandPickerVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="h3">Stellplatz auswählen</ThemedText>
              <Pressable onPress={() => setStandPickerVisible(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <FlatList
              data={stands.filter(s => s.isActive)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.standPickerList}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.standPickerItem, { borderColor: theme.border }]}
                  onPress={() => handlePositionBox(item.id)}
                  disabled={isSubmitting}
                >
                  <View style={styles.standPickerInfo}>
                    <Feather name="target" size={20} color={theme.primary} />
                    <View>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>{item.identifier}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {getStationName(item.stationId)} {item.materialId ? `- ${getMaterialName(item.materialId)}` : ""}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather name="target" size={48} color={theme.textTertiary} />
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>Keine aktiven Stellplätze verfügbar</ThemedText>
                </View>
              }
            />
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: "center",
  },
  tabScrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
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
  itemCard: {},
  inactiveCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  itemDetails: {
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  detailsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    flexWrap: "wrap",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  viewScrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formScrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formSectionTitle: {
    marginBottom: Spacing.md,
  },
  formActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  formButton: {
    flex: 1,
  },
  detailCard: {},
  statusToggle: {
    alignItems: "flex-end",
  },
  detailsList: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dropdownContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  dropdownScroll: {
    maxHeight: 44,
  },
  dropdownContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  standPickerList: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  standPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  standPickerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
