import React from "react";
import { View, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingScreen({
  message,
  fullScreen = true,
  style,
}: LoadingScreenProps) {
  const { theme } = useTheme();

  const content = (
    <View style={[styles.content, style]}>
      <ActivityIndicator size="large" color={theme.accent} />
      {message ? (
        <ThemedText type="body" style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <ThemedView style={styles.fullScreen}>
        {content}
      </ThemedView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
