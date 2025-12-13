# ContainerFlow UI/UX Guidelines

This document outlines the spacing, typography, and component rules for consistent UI throughout the app.

## Design Tokens

### Spacing (from `constants/theme.ts`)
| Token | Value | Usage |
|-------|-------|-------|
| `Spacing.xs` | 4px | Tight gaps, icon margins |
| `Spacing.sm` | 8px | Inline element gaps, small padding |
| `Spacing.md` | 12px | Default component spacing |
| `Spacing.lg` | 16px | Section margins, card padding |
| `Spacing.xl` | 20px | Screen edge padding |
| `Spacing.xxl` | 24px | Large separations |

### Typography (from `components/ThemedText.tsx`)
| Type | Weight | Size | Usage |
|------|--------|------|-------|
| `h1` | Bold | 32px | Screen titles (rare) |
| `h2` | Bold | 28px | Major section headers |
| `h3` | SemiBold | 24px | Section headers |
| `h4` | SemiBold | 18px | Card titles, row headers |
| `body` | Regular | 16px | Primary content |
| `bodyBold` | SemiBold | 16px | Emphasized body text |
| `small` | Regular | 14px | Secondary info, metadata |
| `smallBold` | SemiBold | 14px | Emphasized secondary text |
| `caption` | Regular | 12px | Tertiary info, timestamps |
| `captionBold` | SemiBold | 12px | Emphasized captions |

### Border Radius (from `constants/theme.ts`)
| Token | Value | Usage |
|-------|-------|-------|
| `BorderRadius.xs` | 6px | Small elements, badges |
| `BorderRadius.sm` | 10px | Buttons, chips |
| `BorderRadius.md` | 12px | Cards, inputs |
| `BorderRadius.lg` | 16px | Large cards, modals |
| `BorderRadius.xl` | 20px | Full-width elements |

## Text Overflow Handling

### Pattern for Truncating Text
Always add `numberOfLines` and `ellipsizeMode` props to ThemedText when text length is unpredictable:

```tsx
<ThemedText 
  type="bodyBold" 
  numberOfLines={1} 
  ellipsizeMode="tail"
  style={{ flex: 1, minWidth: 0 }}
>
  {potentiallyLongText}
</ThemedText>
```

### Flex Container Rules
For proper text truncation inside flex rows:
1. Parent container: `flexDirection: 'row'`, `alignItems: 'center'`
2. Text container: `flex: 1`, `minWidth: 0` (critical for truncation)
3. Text component: `numberOfLines={N}`, `ellipsizeMode="tail"`

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
  <View style={{ flex: 1, minWidth: 0 }}>
    <ThemedText numberOfLines={1} ellipsizeMode="tail">
      Long text that might overflow
    </ThemedText>
  </View>
  <FixedWidthElement />
</View>
```

## Component Guidelines

### Cards (`components/Card.tsx`)
- Use `variant` prop: `default`, `elevated`, `outlined`, `filled`
- For elevation, use background colors NOT shadows
- Props support `StyleProp<ViewStyle>` for style arrays

### StatusBadge (`components/StatusBadge.tsx`)
- Size: `small` | `medium`
- Includes text truncation by default
- Status types: `pending`, `in_progress`, `success`, `warning`, `error`, `cancelled`, `info`

### Buttons (`components/Button.tsx`)
- Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- Sizes: `small`, `medium`, `large`
- Include loading state via `loading` prop

### FilterChip (`components/FilterChip.tsx`)
- For horizontal scrollable filter lists
- Use with `ScrollView horizontal` for overflow

## Screen Layout Rules

### Safe Area Handling
1. **Transparent header**: Use `useHeaderHeight()` for top padding
2. **Opaque header**: Use `Spacing.xl` for top padding
3. **No header**: Use `useSafeAreaInsets().top` for top padding
4. **Tab bar**: Use `useBottomTabBarHeight()` for bottom padding
5. **No tab bar**: Use `useSafeAreaInsets().bottom` for bottom padding

### ScrollView Pattern
```tsx
<ScrollView
  contentContainerStyle={{
    paddingTop: headerHeight + Spacing.lg,
    paddingBottom: insets.bottom + Spacing.xl,
    paddingHorizontal: Spacing.lg,
  }}
  scrollIndicatorInsets={{ bottom: insets.bottom }}
  showsVerticalScrollIndicator={false}
>
  {content}
</ScrollView>
```

### FlatList Pattern
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  contentContainerStyle={{
    paddingTop: headerHeight + Spacing.lg,
    paddingBottom: tabBarHeight + Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  }}
  showsVerticalScrollIndicator={false}
/>
```

## Common Patterns

### Row with Icon and Text
```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
  <Feather name="icon-name" size={16} color={theme.textSecondary} />
  <ThemedText type="small" style={{ color: theme.textSecondary }}>
    Label text
  </ThemedText>
</View>
```

### Card with Header Row
```tsx
<Card>
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 }}>
      <Feather name="icon" size={24} color={theme.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemedText type="h4" numberOfLines={1} ellipsizeMode="tail">
          Title
        </ThemedText>
        <ThemedText type="small" numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.textSecondary }}>
          Subtitle
        </ThemedText>
      </View>
    </View>
    <StatusBadge status="success" size="small" />
  </View>
</Card>
```

## Theme Colors

Access via `useTheme()` hook:
- `theme.text` - Primary text color
- `theme.textSecondary` - Secondary/muted text
- `theme.textTertiary` - Tertiary/disabled text
- `theme.primary` - Primary brand color
- `theme.accent` - Accent/action color
- `theme.success`, `theme.warning`, `theme.error` - Status colors
- `theme.backgroundRoot` - Screen background
- `theme.cardSurface` - Card background
- `theme.border` - Border color

## Anti-Patterns to Avoid

1. **Never use hardcoded colors** - Always use theme tokens
2. **Never skip numberOfLines on dynamic text** - Causes overflow
3. **Never use shadows for elevation** - Use background colors
4. **Never skip minWidth: 0 in flex text containers** - Breaks truncation
5. **Never use logical AND (&&) for conditional rendering** - Use ternaries
6. **Never hardcode padding values** - Use Spacing tokens
