import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign, getTaskStatusStyle, TaskStatusKey } from "@/constants/theme";
import { TASK_STATUS_LABELS } from "@shared/schema";

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "small" | "medium" | "large";
}

export function StatusBadge({ status, label: customLabel, size = "medium" }: StatusBadgeProps) {
  const { theme, isDark } = useTheme();
  
  const getStatusConfig = () => {
    const taskStatuses: TaskStatusKey[] = [
      "OFFEN", "PLANNED", "ASSIGNED", "ACCEPTED", "PICKED_UP", 
      "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"
    ];
    
    if (taskStatuses.includes(status as TaskStatusKey)) {
      const statusStyle = getTaskStatusStyle(status as TaskStatusKey, isDark);
      return {
        label: TASK_STATUS_LABELS[status] || status,
        color: statusStyle.textColor,
        backgroundColor: statusStyle.backgroundColor,
      };
    }
    
    switch (status) {
      case "open":
        return {
          label: "Offen",
          color: theme.textOnPrimary,
          backgroundColor: theme.statusOpen,
        };
      case "in_progress":
        return {
          label: "In Bearbeitung",
          color: isDark ? "#1E293B" : "#1E293B",
          backgroundColor: theme.statusInProgress,
        };
      case "completed":
        return {
          label: "Erledigt",
          color: theme.textOnPrimary,
          backgroundColor: theme.statusCompleted,
        };
      case "cancelled":
        return {
          label: "Storniert",
          color: theme.textOnPrimary,
          backgroundColor: theme.statusCancelled,
        };
      case "active":
        return {
          label: "Aktiv",
          color: theme.textOnPrimary,
          backgroundColor: theme.success,
        };
      case "inactive":
        return {
          label: "Inaktiv",
          color: theme.textOnPrimary,
          backgroundColor: theme.statusIdle,
        };
      case "critical":
        return {
          label: "Kritisch",
          color: theme.textOnPrimary,
          backgroundColor: theme.fillHigh,
        };
      case "warning":
        return {
          label: "Warnung",
          color: isDark ? "#1E293B" : "#1E293B",
          backgroundColor: theme.fillMedium,
        };
      case "success":
        return {
          label: "OK",
          color: theme.textOnPrimary,
          backgroundColor: theme.fillLow,
        };
      default:
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
          color: theme.textOnPrimary,
          backgroundColor: theme.statusIdle,
        };
    }
  };

  const config = getStatusConfig();
  const displayLabel = customLabel || config.label;
  
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          badge: styles.badgeSmall,
          label: styles.labelSmall,
        };
      case "large":
        return {
          badge: styles.badgeLarge,
          label: styles.labelLarge,
        };
      default:
        return {
          badge: null,
          label: null,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        sizeStyles.badge,
      ]}
    >
      <ThemedText
        type="caption"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.label,
          { color: config.color },
          sizeStyles.label,
        ]}
      >
        {displayLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: IndustrialDesign.statusBadgePaddingH,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    minHeight: IndustrialDesign.statusBadgeHeight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    minHeight: 22,
  },
  badgeLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 34,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelSmall: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
