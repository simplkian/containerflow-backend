import React from "react";
import { StyleSheet, Pressable, ViewStyle, View, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign, AnimationConfig } from "@/constants/theme";

type CardVariant = "default" | "elevated" | "outlined" | "filled";

interface CardProps {
  variant?: CardVariant;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: AnimationConfig.spring.damping,
  mass: AnimationConfig.spring.mass,
  stiffness: AnimationConfig.spring.stiffness,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  variant = "default",
  title,
  description,
  children,
  onPress,
  style,
  contentStyle,
  noPadding = false,
}: CardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(AnimationConfig.pressScale, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getCardStyles = (): ViewStyle => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: theme.cardSurface,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        };
      case "elevated":
        return {
          backgroundColor: isDark ? theme.cardSurfaceElevated : theme.cardSurface,
          borderWidth: 0,
        };
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.border,
        };
      case "filled":
        return {
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: theme.cardSurface,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        };
    }
  };

  const cardStyles = getCardStyles();

  const content = (
    <>
      {title ? (
        <ThemedText type="h4" numberOfLines={2} ellipsizeMode="tail" style={[styles.cardTitle, { color: theme.text }]}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="small" numberOfLines={3} ellipsizeMode="tail" style={[styles.cardDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          cardStyles,
          noPadding ? styles.noPadding : null,
          animatedStyle,
          style,
        ]}
      >
        <View style={contentStyle}>{content}</View>
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        cardStyles,
        noPadding ? styles.noPadding : null,
        style,
      ]}
    >
      <View style={contentStyle}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: IndustrialDesign.cardPadding,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  noPadding: {
    padding: 0,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  cardDescription: {
    marginBottom: Spacing.md,
  },
});
