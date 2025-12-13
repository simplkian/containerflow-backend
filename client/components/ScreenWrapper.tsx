import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

type HeaderMode = "transparent" | "opaque" | "hidden";

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAware?: boolean;
  headerMode?: HeaderMode;
  hasTabBar?: boolean;
  horizontalPadding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  keyboardAware = false,
  headerMode = "transparent",
  hasTabBar = true,
  horizontalPadding = true,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  let headerHeight = 0;
  let tabBarHeight = 0;

  try {
    headerHeight = useHeaderHeight();
  } catch {
    headerHeight = 0;
  }

  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 0;
  }

  const getTopPadding = (): number => {
    switch (headerMode) {
      case "transparent":
        return headerHeight + Spacing.lg;
      case "opaque":
        return Spacing.lg;
      case "hidden":
        return insets.top + Spacing.lg;
      default:
        return headerHeight + Spacing.lg;
    }
  };

  const getBottomPadding = (): number => {
    if (hasTabBar && tabBarHeight > 0) {
      return tabBarHeight + Spacing.xl;
    }
    return insets.bottom + Spacing.xl;
  };

  const paddingTop = getTopPadding();
  const paddingBottom = getBottomPadding();
  const paddingHorizontal = horizontalPadding ? Spacing.lg : 0;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.backgroundRoot,
  };

  const contentStyle: ViewStyle = {
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    flexGrow: 1,
    ...contentContainerStyle,
  };

  const innerStyle: ViewStyle = {
    flex: 1,
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    ...style,
  };

  if (keyboardAware) {
    return (
      <ThemedView style={containerStyle}>
        <StatusBar
          barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
          backgroundColor="transparent"
          translucent
        />
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        >
          {children}
        </KeyboardAwareScrollViewCompat>
      </ThemedView>
    );
  }

  if (scrollable) {
    return (
      <ThemedView style={containerStyle}>
        <StatusBar
          barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
          backgroundColor="transparent"
          translucent
        />
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={containerStyle}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
        backgroundColor="transparent"
        translucent
      />
      <View style={innerStyle}>{children}</View>
    </ThemedView>
  );
}

export function SectionHeader({
  title,
  subtitle,
  rightElement,
}: {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccent, { backgroundColor: theme.accent }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.sectionTitleText}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedTextLocal
                  style={[styles.sectionTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {title}
                </ThemedTextLocal>
              </View>
            </View>
            {subtitle ? (
              <ThemedTextLocal
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {subtitle}
              </ThemedTextLocal>
            ) : null}
          </View>
        </View>
      </View>
      {rightElement ? <View style={styles.sectionHeaderRight}>{rightElement}</View> : null}
    </View>
  );
}

import { Text, TextStyle } from "react-native";

function ThemedTextLocal({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}) {
  return (
    <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderRight: {
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  sectionTitleText: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
