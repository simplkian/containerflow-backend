import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, AnimationConfig } from "@/constants/theme";

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  height?: number;
  showFillColor?: boolean;
}

export function ProgressBar({
  progress,
  color,
  backgroundColor,
  style,
  height = 8,
  showFillColor = false,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const getFillColor = () => {
    if (color) return color;
    if (!showFillColor) return theme.accent;
    
    if (clampedProgress <= 0.5) return theme.fillLow;
    if (clampedProgress <= 0.79) return theme.fillMedium;
    return theme.fillHigh;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(`${clampedProgress * 100}%`, {
      damping: AnimationConfig.spring.damping,
      stiffness: 100,
      mass: 0.5,
    }),
  }));

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: backgroundColor || theme.backgroundTertiary, height }, 
        style
      ]}
    >
      <Animated.View
        style={[
          styles.fill, 
          { backgroundColor: getFillColor(), height }, 
          animatedStyle
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
