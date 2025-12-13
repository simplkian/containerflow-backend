import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, AnimationConfig } from "@/constants/theme";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function TextInput({ label, error, helper, style, onFocus, onBlur, ...props }: TextInputProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: AnimationConfig.duration.fast });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: AnimationConfig.duration.fast });
    onBlur?.(e);
  };

  const borderColor = error ? theme.error : theme.border;
  const focusBorderColor = error ? theme.error : theme.accent;

  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [borderColor, focusBorderColor]
      ),
      borderWidth: error ? 2 : 1.5,
    };
  });

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText 
          type="small" 
          style={[
            styles.label, 
            { color: error ? theme.error : isFocused ? theme.accent : theme.textSecondary }
          ]}
        >
          {label}
        </ThemedText>
      ) : null}
      <AnimatedView
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.cardSurface,
          },
          animatedWrapperStyle,
        ]}
      >
        <RNTextInput
          style={[
            styles.input,
            { color: theme.text },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </AnimatedView>
      {error ? (
        <ThemedText type="caption" style={[styles.errorText, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : helper ? (
        <ThemedText type="caption" style={[styles.helperText, { color: theme.textTertiary }]}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs + 2,
  },
  label: {
    fontWeight: "600",
    letterSpacing: Typography.label.letterSpacing,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    fontWeight: "400",
  },
  errorText: {
    marginLeft: Spacing.xs,
  },
  helperText: {
    marginLeft: Spacing.xs,
  },
});
