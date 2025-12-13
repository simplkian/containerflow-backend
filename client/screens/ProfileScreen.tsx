import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export default function ProfileScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isAdmin } = useAuth();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const cycleTheme = () => {
    const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case "system": return "System";
      case "dark": return "Dunkel";
      case "light": return "Hell";
      default: return "System";
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="h2" style={{ color: theme.textOnPrimary }}>
              {getInitials(user?.name || "User")}
            </ThemedText>
          </View>
          <ThemedText type="h3" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>
            {user?.name}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: theme.backgroundDefault }]}>
            <Feather
              name={isAdmin ? "shield" : "truck"}
              size={14}
              color={theme.primary}
            />
            <ThemedText type="small" style={{ color: theme.primary, fontWeight: "500" }}>
              {isAdmin ? "Administrator" : "Fahrer"}
            </ThemedText>
          </View>
        </View>

        <Card style={{ backgroundColor: theme.cardSurface }}>
          <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.sm }}>
            Kontoinformationen
          </ThemedText>
          <View style={styles.infoRow}>
            <Feather name="mail" size={20} color={theme.textSecondary} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>E-Mail</ThemedText>
              <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>{user?.email}</ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Feather name="calendar" size={20} color={theme.textSecondary} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Mitglied seit</ThemedText>
              <ThemedText type="body" style={{ color: theme.text }}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("de-DE", {
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </ThemedText>
            </View>
          </View>
        </Card>

        {isAdmin ? (
          <Card style={{ backgroundColor: theme.cardSurface }}>
            <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.sm }}>
              Schnellaktionen
            </ThemedText>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate("AdminDashboard")}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="grid" size={20} color={theme.primary} />
                <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>Dashboard</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate("ManageDrivers")}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="users" size={20} color={theme.primary} />
                <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>Fahrer verwalten</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate("ActivityHistory")}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="activity" size={20} color={theme.primary} />
                <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>Aktivitätsverlauf</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>
        ) : null}

        <Card style={{ backgroundColor: theme.cardSurface }}>
          <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.sm }}>
            Einstellungen
          </ThemedText>
          
          <Pressable
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate("QRCenter")}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="grid" size={20} color={theme.textSecondary} />
              <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>QR-Center</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <View style={[styles.themeToggle, { borderBottomColor: theme.border }]}>
            <View style={styles.menuItemLeft}>
              <Feather name={isDark ? "moon" : "sun"} size={20} color={theme.textSecondary} />
              <View>
                <ThemedText type="body" style={{ color: theme.text }}>Erscheinungsbild</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{getThemeLabel()}</ThemedText>
              </View>
            </View>
            <View style={styles.themeButtons}>
              <Pressable
                style={[
                  styles.themeButton,
                  { 
                    backgroundColor: themeMode === "light" ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.border,
                  }
                ]}
                onPress={() => setThemeMode("light")}
              >
                <Feather 
                  name="sun" 
                  size={16} 
                  color={themeMode === "light" ? theme.textOnPrimary : theme.text} 
                />
              </Pressable>
              <Pressable
                style={[
                  styles.themeButton,
                  { 
                    backgroundColor: themeMode === "dark" ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.border,
                  }
                ]}
                onPress={() => setThemeMode("dark")}
              >
                <Feather 
                  name="moon" 
                  size={16} 
                  color={themeMode === "dark" ? theme.textOnPrimary : theme.text} 
                />
              </Pressable>
              <Pressable
                style={[
                  styles.themeButton,
                  { 
                    backgroundColor: themeMode === "system" ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.border,
                  }
                ]}
                onPress={() => setThemeMode("system")}
              >
                <Feather 
                  name="smartphone" 
                  size={16} 
                  color={themeMode === "system" ? theme.textOnPrimary : theme.text} 
                />
              </Pressable>
            </View>
          </View>

          <Pressable style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <View style={styles.menuItemLeft}>
              <Feather name="bell" size={20} color={theme.textSecondary} />
              <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>Benachrichtigungen</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <View style={styles.menuItemLeft}>
              <Feather name="help-circle" size={20} color={theme.textSecondary} />
              <ThemedText type="body" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.text }}>Hilfe & Support</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </Card>

        <Button onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: theme.error }]}>
          <View style={styles.logoutContent}>
            <Feather name="log-out" size={20} color={theme.textOnPrimary} />
            <ThemedText type="body" style={[styles.logoutText, { color: theme.textOnPrimary }]}>
              Abmelden
            </ThemedText>
          </View>
        </Button>

        <ThemedText type="small" style={[styles.versionText, { color: theme.textSecondary }]}>
          ContainerFlow v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
    marginTop: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  themeToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  themeButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  logoutButton: {
    marginTop: Spacing.md,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoutText: {
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
