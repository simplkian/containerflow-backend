import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { TextInput } from "@/components/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AnimationConfig } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Bitte geben Sie E-Mail und Passwort ein");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["5xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        <Animated.View 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.logoContainer}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
            <View style={[styles.iconInner, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)' }]}>
              <Feather name="package" size={44} color={theme.accent} />
            </View>
          </View>
          <ThemedText type="h1" style={[styles.title, { color: theme.primary }]}>
            ContainerFlow
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Professionelles Containermanagement
          </ThemedText>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(300)}
          style={[styles.formCard, { backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }]}
        >
          <ThemedText type="h4" style={[styles.formTitle, { color: theme.text }]}>
            Anmeldung
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              label="E-Mail-Adresse"
              value={email}
              onChangeText={setEmail}
              placeholder="name@firma.de"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                label="Passwort"
                value={password}
                onChangeText={setPassword}
                placeholder="Passwort eingeben"
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <Pressable
                style={[styles.eyeButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.errorLight }]}>
                <View style={[styles.errorIconContainer, { backgroundColor: theme.error }]}>
                  <Feather name="alert-circle" size={14} color={theme.textOnPrimary} />
                </View>
                <ThemedText type="small" style={[styles.errorText, { color: theme.error }]}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <Button
              onPress={handleLogin}
              disabled={isLoading}
              variant="primary"
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                "Anmelden"
              )}
            </Button>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(500)}
          style={[styles.infoContainer, { backgroundColor: theme.backgroundSecondary }]}
        >
          <View style={[styles.infoIconContainer, { backgroundColor: theme.info }]}>
            <Feather name="info" size={14} color={theme.textOnPrimary} />
          </View>
          <ThemedText type="small" style={[styles.infoText, { color: theme.textSecondary }]}>
            Sie haben noch kein Konto? Bitte kontaktieren Sie Ihren Administrator oder Manager.
          </ThemedText>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    letterSpacing: 0.2,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.sm,
    top: 32,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontWeight: "500",
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
});
