import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  WithSpringConfig,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, AnimationConfig } from "@/constants/theme";

const { width: screenWidth } = Dimensions.get("window");

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const springConfig: WithSpringConfig = {
  damping: AnimationConfig.spring.damping,
  mass: AnimationConfig.spring.mass,
  stiffness: AnimationConfig.spring.stiffness,
  overshootClamping: false,
};

interface ToastItemProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

function ToastItem({ message, variant, onDismiss }: ToastItemProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    translateY.value = withSpring(0, springConfig);
    opacity.value = withTiming(1, { duration: 200 });

    timeoutRef.current = setTimeout(() => {
      dismissToast();
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dismissToast = () => {
    translateY.value = withTiming(100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getVariantColors = () => {
    switch (variant) {
      case "success":
        return {
          background: theme.successLight,
          border: theme.success,
          icon: theme.success,
          text: isDark ? theme.textOnPrimary : theme.text,
        };
      case "error":
        return {
          background: theme.errorLight,
          border: theme.error,
          icon: theme.error,
          text: isDark ? theme.textOnPrimary : theme.text,
        };
      case "warning":
        return {
          background: theme.warningLight,
          border: theme.warning,
          icon: theme.warning,
          text: isDark ? theme.textOnPrimary : theme.text,
        };
      case "info":
        return {
          background: theme.infoLight,
          border: theme.info,
          icon: theme.info,
          text: isDark ? theme.textOnPrimary : theme.text,
        };
      default:
        return {
          background: theme.cardSurface,
          border: theme.border,
          icon: theme.text,
          text: theme.text,
        };
    }
  };

  const getIconName = (): keyof typeof Feather.glyphMap => {
    switch (variant) {
      case "success":
        return "check-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "alert-triangle";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  const colors = getVariantColors();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        animatedStyle,
        {
          bottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl,
        },
      ]}
    >
      <Pressable
        onPress={dismissToast}
        style={[
          styles.toast,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name={getIconName()} size={20} color={colors.icon} />
        <ThemedText
          type="body"
          style={[styles.toastText, { color: colors.text }]}
          numberOfLines={2}
        >
          {message}
        </ThemedText>
        <Feather name="x" size={18} color={colors.text} style={styles.closeIcon} />
      </Pressable>
    </Animated.View>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
    zIndex: 9999,
    ...Platform.select({
      web: {
        pointerEvents: "box-none",
      },
    }),
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxWidth: screenWidth - Spacing.lg * 2,
    minWidth: 200,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    gap: Spacing.sm,
  },
  toastText: {
    flex: 1,
    fontWeight: "500",
  },
  closeIcon: {
    opacity: 0.6,
  },
});
