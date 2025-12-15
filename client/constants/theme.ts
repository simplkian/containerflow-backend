import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#FF6B2C",
    link: "#2563EB",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F9FAFB",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",
    primary: "#1F3650",
    primaryLight: "#2D4A6A",
    primaryDark: "#152538",
    accent: "#FF6B2C",
    accentLight: "#FF8F5C",
    accentDark: "#E55A1F",
    statusIdle: "#9CA3AF",
    statusOpen: "#4A90A4",
    statusInProgress: "#F5A623",
    statusCompleted: "#27AE60",
    statusCancelled: "#E74C3C",
    fillLow: "#27AE60",
    fillMedium: "#F5A623",
    fillHigh: "#E74C3C",
    fillCritical: "#991B1B",
    border: "#CBD5E1",
    borderLight: "#E2E8F0",
    error: "#E74C3C",
    errorLight: "#FEE2E2",
    warning: "#F5A623",
    warningLight: "#FEF3C7",
    success: "#27AE60",
    successLight: "#D1FAE5",
    info: "#4A90A4",
    infoLight: "#DBEAFE",
    cardSurface: "#FFFFFF",
    cardBorder: "#E2E8F0",
    cardSurfaceElevated: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
    divider: "#E2E8F0",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#FF6B2C",
    link: "#60A5FA",
    backgroundRoot: "#111827",
    backgroundDefault: "#1F2937",
    backgroundSecondary: "#374151",
    backgroundTertiary: "#4B5563",
    primary: "#3B6B9C",
    primaryLight: "#5088BC",
    primaryDark: "#1F3650",
    accent: "#FF6B2C",
    accentLight: "#FF8F5C",
    accentDark: "#E55A1F",
    statusIdle: "#6B7280",
    statusOpen: "#5DADE2",
    statusInProgress: "#F7B731",
    statusCompleted: "#2ECC71",
    statusCancelled: "#E74C3C",
    fillLow: "#2ECC71",
    fillMedium: "#F7B731",
    fillHigh: "#E74C3C",
    fillCritical: "#DC2626",
    border: "#475569",
    borderLight: "#334155",
    error: "#EF4444",
    errorLight: "#450A0A",
    warning: "#F59E0B",
    warningLight: "#451A03",
    success: "#2ECC71",
    successLight: "#052E16",
    info: "#5DADE2",
    infoLight: "#172554",
    cardSurface: "#1F2937",
    cardBorder: "#334155",
    cardSurfaceElevated: "#374151",
    overlay: "rgba(0, 0, 0, 0.75)",
    divider: "#334155",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 56,
  buttonHeight: 56,
  buttonHeightSmall: 48,
  tabBarHeight: 64,
  touchTargetMin: 48,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 38,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 31,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 17,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 17,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
});

export const Shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const IndustrialDesign = {
  minTouchTarget: 48,
  buttonHeight: 56,
  buttonHeightSmall: 48,
  borderWidth: 2,
  borderWidthThin: 1,
  iconSize: 24,
  iconSizeLarge: 28,
  iconSizeXL: 32,
  cardPadding: 16,
  cardPaddingLarge: 20,
  listItemHeight: 72,
  listItemHeightCompact: 56,
  statusBadgeHeight: 28,
  statusBadgePaddingH: 12,
  filterChipHeight: 44,
  headerHeight: 56,
};

export const AnimationConfig = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  pressScale: 0.97,
  pressOpacity: 0.85,
};

// ============================================================================
// STATUS BADGE COLOR MAPPINGS
// ============================================================================

export type TaskStatusKey = 
  | "OFFEN"
  | "PLANNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

interface StatusBadgeStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const TaskStatusColors: Record<"light" | "dark", Record<TaskStatusKey, StatusBadgeStyle>> = {
  light: {
    OFFEN: {
      backgroundColor: "#F3F4F6",
      textColor: "#4B5563",
      borderColor: "#D1D5DB",
    },
    PLANNED: {
      backgroundColor: "#E0E7FF",
      textColor: "#3730A3",
      borderColor: "#A5B4FC",
    },
    ASSIGNED: {
      backgroundColor: "#DBEAFE",
      textColor: "#1E40AF",
      borderColor: "#93C5FD",
    },
    ACCEPTED: {
      backgroundColor: "#4A90A4",
      textColor: "#FFFFFF",
      borderColor: "#4A90A4",
    },
    PICKED_UP: {
      backgroundColor: "#F5A623",
      textColor: "#1E293B",
      borderColor: "#F5A623",
    },
    IN_TRANSIT: {
      backgroundColor: "#F59E0B",
      textColor: "#1E293B",
      borderColor: "#F59E0B",
    },
    DELIVERED: {
      backgroundColor: "#10B981",
      textColor: "#FFFFFF",
      borderColor: "#10B981",
    },
    COMPLETED: {
      backgroundColor: "#27AE60",
      textColor: "#FFFFFF",
      borderColor: "#27AE60",
    },
    CANCELLED: {
      backgroundColor: "#E74C3C",
      textColor: "#FFFFFF",
      borderColor: "#E74C3C",
    },
  },
  dark: {
    OFFEN: {
      backgroundColor: "#374151",
      textColor: "#D1D5DB",
      borderColor: "#6B7280",
    },
    PLANNED: {
      backgroundColor: "#312E81",
      textColor: "#C7D2FE",
      borderColor: "#4338CA",
    },
    ASSIGNED: {
      backgroundColor: "#1E3A5F",
      textColor: "#93C5FD",
      borderColor: "#3B82F6",
    },
    ACCEPTED: {
      backgroundColor: "#5DADE2",
      textColor: "#FFFFFF",
      borderColor: "#5DADE2",
    },
    PICKED_UP: {
      backgroundColor: "#F7B731",
      textColor: "#1E293B",
      borderColor: "#F7B731",
    },
    IN_TRANSIT: {
      backgroundColor: "#F59E0B",
      textColor: "#1E293B",
      borderColor: "#F59E0B",
    },
    DELIVERED: {
      backgroundColor: "#10B981",
      textColor: "#FFFFFF",
      borderColor: "#10B981",
    },
    COMPLETED: {
      backgroundColor: "#2ECC71",
      textColor: "#FFFFFF",
      borderColor: "#2ECC71",
    },
    CANCELLED: {
      backgroundColor: "#E74C3C",
      textColor: "#FFFFFF",
      borderColor: "#E74C3C",
    },
  },
};

// Helper function to get status badge colors
export function getTaskStatusStyle(status: TaskStatusKey, isDark: boolean): StatusBadgeStyle {
  const mode = isDark ? "dark" : "light";
  return TaskStatusColors[mode][status] || TaskStatusColors[mode].PLANNED;
}

// ============================================================================
// CONTAINER FILL LEVEL COLORS
// ============================================================================

export function getFillLevelColor(percentage: number, isDark: boolean): string {
  const colors = isDark ? Colors.dark : Colors.light;
  if (percentage >= 100) return colors.fillCritical;
  if (percentage >= 80) return colors.fillHigh;
  if (percentage >= 50) return colors.fillMedium;
  return colors.fillLow;
}

// ============================================================================
// SEMANTIC BUTTON COLORS (for removing hardcoded values)
// ============================================================================

export const ButtonColors = {
  light: {
    primaryBackground: Colors.light.accent,
    primaryText: "#FFFFFF",
    secondaryBackground: "transparent",
    secondaryText: Colors.light.primary,
    secondaryBorder: Colors.light.primary,
    tertiaryBackground: Colors.light.backgroundSecondary,
    tertiaryText: Colors.light.text,
    dangerBackground: Colors.light.error,
    dangerText: "#FFFFFF",
    disabledOpacity: 0.5,
  },
  dark: {
    primaryBackground: Colors.dark.accent,
    primaryText: "#FFFFFF",
    secondaryBackground: "transparent",
    secondaryText: Colors.dark.primaryLight,
    secondaryBorder: Colors.dark.primaryLight,
    tertiaryBackground: Colors.dark.backgroundSecondary,
    tertiaryText: Colors.dark.text,
    dangerBackground: Colors.dark.error,
    dangerText: "#FFFFFF",
    disabledOpacity: 0.5,
  },
};

// ============================================================================
// INPUT FIELD COLORS
// ============================================================================

export const InputColors = {
  light: {
    background: Colors.light.backgroundDefault,
    border: Colors.light.border,
    borderFocused: Colors.light.accent,
    borderError: Colors.light.error,
    text: Colors.light.text,
    placeholder: Colors.light.textTertiary,
    label: Colors.light.textSecondary,
    helperText: Colors.light.textSecondary,
    errorText: Colors.light.error,
  },
  dark: {
    background: Colors.dark.backgroundSecondary,
    border: Colors.dark.border,
    borderFocused: Colors.dark.accent,
    borderError: Colors.dark.error,
    text: Colors.dark.text,
    placeholder: Colors.dark.textTertiary,
    label: Colors.dark.textSecondary,
    helperText: Colors.dark.textSecondary,
    errorText: Colors.dark.error,
  },
};
