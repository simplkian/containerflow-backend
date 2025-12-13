import React from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, IndustrialDesign } from "@/constants/theme";
import { useNetwork } from "@/contexts/NetworkContext";

export function NetworkStatusBar() {
  const { theme } = useTheme();
  const { isOnline, pendingActionsCount, lastSyncText, syncPendingActions, isSyncing } = useNetwork();

  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  const backgroundColor = !isOnline ? theme.error : theme.statusInProgress;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {!isOnline ? (
        <View style={styles.content}>
          <Feather name="wifi-off" size={IndustrialDesign.iconSize} color={theme.textOnPrimary} />
          <ThemedText type="small" style={[styles.text, { color: theme.textOnPrimary }]}>
            You're offline. Changes will sync when connected.
          </ThemedText>
        </View>
      ) : pendingActionsCount > 0 ? (
        <Pressable 
          style={[styles.content, styles.pressable]} 
          onPress={syncPendingActions} 
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.textOnPrimary} />
          ) : (
            <Feather name="refresh-cw" size={IndustrialDesign.iconSize} color={theme.textOnPrimary} />
          )}
          <ThemedText type="small" style={[styles.text, { color: theme.textOnPrimary }]}>
            {isSyncing 
              ? "Syncing..." 
              : `${pendingActionsCount} pending ${pendingActionsCount === 1 ? "action" : "actions"}. Tap to sync.`
            }
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: IndustrialDesign.minTouchTarget,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  pressable: {
    minHeight: IndustrialDesign.minTouchTarget,
  },
  text: {
    fontWeight: "600",
    fontSize: 14,
  },
});
