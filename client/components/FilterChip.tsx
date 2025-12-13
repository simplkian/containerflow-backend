import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, IndustrialDesign, AnimationConfig } from "@/constants/theme";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  small?: boolean;
  count?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FilterChip({
  label,
  selected,
  onPress,
  color,
  small = false,
  count,
}: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const activeColor = color || theme.accent;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: AnimationConfig.spring.damping,
      stiffness: AnimationConfig.spring.stiffness,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: AnimationConfig.spring.damping,
      stiffness: AnimationConfig.spring.stiffness,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        small && styles.chipSmall,
        selected && { backgroundColor: activeColor, borderColor: activeColor },
        !selected && { 
          backgroundColor: theme.backgroundDefault, 
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.label,
          small && styles.labelSmall,
          { color: selected ? theme.textOnAccent : theme.text },
        ]}
      >
        {label}
        {count !== undefined ? ` (${count})` : ""}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    minHeight: IndustrialDesign.filterChipHeight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  chipSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 38,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 12,
  },
});
