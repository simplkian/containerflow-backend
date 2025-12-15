import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, AnimationConfig, ButtonColors, IndustrialDesign } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
type IconPosition = "left" | "right";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: "default" | "small";
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: IconPosition;
}

const springConfig: WithSpringConfig = {
  damping: AnimationConfig.spring.damping,
  mass: AnimationConfig.spring.mass,
  stiffness: AnimationConfig.spring.stiffness,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "default",
  loading = false,
  icon,
  iconPosition = "left",
}: ButtonProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(AnimationConfig.pressScale, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getButtonStyles = (): ViewStyle => {
    const baseHeight = size === "small" ? Spacing.buttonHeightSmall : Spacing.buttonHeight;
    
    switch (variant) {
      case "primary":
        return {
          backgroundColor: theme.accent,
          height: baseHeight,
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: isDark ? theme.primaryLight : theme.primary,
          height: baseHeight,
        };
      case "tertiary":
        return {
          backgroundColor: theme.backgroundSecondary,
          height: baseHeight,
        };
      case "danger":
        return {
          backgroundColor: theme.error,
          height: baseHeight,
        };
      default:
        return {
          backgroundColor: theme.accent,
          height: baseHeight,
        };
    }
  };

  const getTextColor = (): string => {
    const buttonTheme = isDark ? ButtonColors.dark : ButtonColors.light;
    switch (variant) {
      case "primary":
        return buttonTheme.primaryText;
      case "danger":
        return buttonTheme.dangerText;
      case "secondary":
        return buttonTheme.secondaryText;
      case "tertiary":
        return buttonTheme.tertiaryText;
      default:
        return buttonTheme.primaryText;
    }
  };

  const buttonStyles = getButtonStyles();
  const textColor = getTextColor();
  const iconSize = size === "small" ? 18 : IndustrialDesign.iconSize;

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <Feather 
        name={icon} 
        size={iconSize} 
        color={textColor} 
        style={iconPosition === "left" ? styles.iconLeft : styles.iconRight} 
      />
    );
  };

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        buttonStyles,
        {
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" ? renderIcon() : null}
          <ThemedText
            type={size === "small" ? "small" : "body"}
            numberOfLines={1}
            style={[
              styles.buttonText,
              size === "small" ? styles.buttonTextSmall : null,
              { color: textColor },
            ]}
          >
            {children}
          </ThemedText>
          {icon && iconPosition === "right" ? renderIcon() : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "700",
    letterSpacing: Typography.button.letterSpacing,
  },
  buttonTextSmall: {
    fontSize: Typography.buttonSmall.fontSize,
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
