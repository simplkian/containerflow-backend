import { Text, type TextProps, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "bodyBold" | "small" | "smallBold" | "caption" | "captionBold" | "link";
  truncate?: boolean;
  maxLines?: number;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  truncate = false,
  maxLines,
  numberOfLines,
  ellipsizeMode = "tail",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "body":
        return Typography.body;
      case "bodyBold":
        return Typography.bodyBold;
      case "small":
        return Typography.small;
      case "smallBold":
        return Typography.smallBold;
      case "caption":
        return Typography.caption;
      case "captionBold":
        return Typography.captionBold;
      case "link":
        return Typography.link;
      default:
        return Typography.body;
    }
  };

  const effectiveNumberOfLines = numberOfLines ?? (truncate ? 1 : maxLines);

  return (
    <Text
      style={[
        { color: getColor() },
        getTypeStyle(),
        truncate ? styles.truncate : null,
        style,
      ]}
      numberOfLines={effectiveNumberOfLines}
      ellipsizeMode={effectiveNumberOfLines ? ellipsizeMode : undefined}
      {...rest}
    />
  );
}

export function TruncatedText({
  children,
  lines = 1,
  style,
  type = "body",
  ...rest
}: Omit<ThemedTextProps, "truncate" | "maxLines" | "numberOfLines"> & {
  children: React.ReactNode;
  lines?: number;
}) {
  return (
    <ThemedText
      type={type}
      numberOfLines={lines}
      ellipsizeMode="tail"
      style={[styles.truncate, style]}
      {...rest}
    >
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  truncate: {
    flexShrink: 1,
  },
});
