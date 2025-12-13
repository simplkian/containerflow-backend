# ContainerFlow Design System v2.0

## Design-Philosophie

Professionelles, industrietaugliches Design für die Abfallcontainer-Verwaltung. Optimiert für Outdoor-Einsatz mit Arbeitshandschuhen, hohe Lesbarkeit bei allen Lichtverhältnissen und schnelle, fehlertolerante Bedienung.

## Farbpalette

### Primärfarben

| Name | Hell-Modus | Dunkel-Modus | Verwendung |
|------|------------|--------------|------------|
| **Primary (Navy Blue)** | `#1F3650` | `#3B6B9C` | Header, Navigation, Hauptaktionen |
| **Primary Light** | `#2D4A6A` | `#5088BC` | Hover-/Pressed-States |
| **Primary Dark** | `#152538` | `#1F3650` | Tiefe Akzente |
| **Accent (Safety Orange)** | `#FF6B2C` | `#FF6B2C` | CTAs, Icons, Highlights |
| **Accent Light** | `#FF8F5C` | `#FF8F5C` | Hover-States |
| **Accent Dark** | `#E55A1F` | `#E55A1F` | Pressed-States |

### Hintergrundfarben

| Name | Hell-Modus | Dunkel-Modus |
|------|------------|--------------|
| **Background Root** | `#FFFFFF` | `#111827` |
| **Background Default** | `#F9FAFB` | `#1F2937` |
| **Background Secondary** | `#F3F4F6` | `#374151` |
| **Background Tertiary** | `#E5E7EB` | `#4B5563` |
| **Card Surface** | `#FFFFFF` | `#1F2937` |
| **Card Surface Elevated** | `#FFFFFF` | `#374151` |

### Textfarben

| Name | Hell-Modus | Dunkel-Modus |
|------|------------|--------------|
| **Text Primary** | `#111827` | `#F9FAFB` |
| **Text Secondary** | `#6B7280` | `#9CA3AF` |
| **Text Tertiary** | `#9CA3AF` | `#6B7280` |
| **Text on Primary/Accent** | `#FFFFFF` | `#FFFFFF` |

### Statusfarben

| Status | Hell-Modus | Dunkel-Modus | Textfarbe |
|--------|------------|--------------|-----------|
| **Offen** | `#4A90A4` | `#5DADE2` | Weiß |
| **In Bearbeitung** | `#F5A623` | `#F7B731` | Dunkel (#1E293B) |
| **Erledigt** | `#27AE60` | `#2ECC71` | Weiß |
| **Storniert** | `#E74C3C` | `#E74C3C` | Weiß |

### Füllstand-Farben

| Level | Hell-Modus | Dunkel-Modus | Bereich |
|-------|------------|--------------|---------|
| **Niedrig** | `#27AE60` | `#2ECC71` | 0–50% |
| **Mittel** | `#F5A623` | `#F7B731` | 51–79% |
| **Hoch** | `#E74C3C` | `#E74C3C` | 80–99% |
| **Kritisch** | `#991B1B` | `#DC2626` | 100% |

### Rahmen-/Border-Farben

| Name | Hell-Modus | Dunkel-Modus |
|------|------------|--------------|
| **Border** | `#CBD5E1` | `#475569` |
| **Border Light** | `#E2E8F0` | `#334155` |
| **Card Border** | `#E2E8F0` | `#334155` |
| **Divider** | `#E2E8F0` | `#334155` |

### Feedback-Farben

| Name | Hell-Modus | Dunkel-Modus |
|------|------------|--------------|
| **Error** | `#E74C3C` | `#EF4444` |
| **Error Light** | `#FEE2E2` | `#450A0A` |
| **Warning** | `#F5A623` | `#F59E0B` |
| **Warning Light** | `#FEF3C7` | `#451A03` |
| **Success** | `#27AE60` | `#2ECC71` |
| **Success Light** | `#D1FAE5` | `#052E16` |
| **Info** | `#4A90A4` | `#5DADE2` |
| **Info Light** | `#DBEAFE` | `#172554` |

---

## Typografie

### Schriftskala

| Element | Größe | Gewicht | Zeilenhöhe | Verwendung |
|---------|-------|---------|------------|------------|
| **H1** | 32px | Bold (700) | 38px | Große Überschriften |
| **H2** | 28px | Bold (700) | 34px | Seitenüberschriften |
| **H3** | 24px | SemiBold (600) | 31px | Abschnittsüberschriften |
| **H4** | 20px | SemiBold (600) | 26px | Card-Titel |
| **Body** | 16px | Regular (400) | 24px | Fließtext |
| **Body Bold** | 16px | SemiBold (600) | 24px | Hervorgehobener Text |
| **Small** | 14px | Regular (400) | 20px | Sekundärtext |
| **Small Bold** | 14px | SemiBold (600) | 20px | Labels |
| **Caption** | 12px | Regular (400) | 17px | Hilfstext |
| **Caption Bold** | 12px | Bold (700) | 17px | Badges |
| **Button** | 16px | Bold (700) | – | Buttons, Letter-Spacing: 0.3 |
| **Label** | 13px | SemiBold (600) | – | Form-Labels, Letter-Spacing: 0.4 |

### Schriftfamilie

- **iOS**: San Francisco (System)
- **Android**: Roboto (System)
- **Web**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

---

## Spacing-System

| Token | Wert | Verwendung |
|-------|------|------------|
| **xs** | 4px | Minimale Abstände |
| **sm** | 8px | Kleine Abstände |
| **md** | 12px | Mittlere Abstände |
| **lg** | 16px | Standard-Abstände |
| **xl** | 20px | Große Abstände |
| **2xl** | 24px | Section-Abstände |
| **3xl** | 32px | Container-Padding |
| **4xl** | 40px | Screen-Padding |
| **5xl** | 48px | Große Bereiche |
| **6xl** | 64px | Maximale Abstände |

---

## Border-Radius

| Token | Wert | Verwendung |
|-------|------|------------|
| **xs** | 6px | Kleine Badges |
| **sm** | 10px | Chips, kleine Cards |
| **md** | 12px | Buttons, Inputs |
| **lg** | 16px | Standard-Cards |
| **xl** | 20px | Modal-Ecken |
| **2xl** | 24px | Große Cards |
| **3xl** | 32px | Full-Width Panels |
| **full** | 9999px | Pills, runde Buttons |

---

## Touch-Targets (Glove-Friendly)

| Element | Mindesthöhe | Empfohlen |
|---------|-------------|-----------|
| **Minimum Touch Target** | 48dp | – |
| **Primary Button** | 56dp | 56dp |
| **Secondary Button** | 48dp | 48dp |
| **Input Field** | 56dp | 56dp |
| **Tab Bar** | 64dp | 64dp |
| **List Item** | 72dp | 72dp |
| **List Item Compact** | 56dp | 56dp |
| **Filter Chip** | 44dp | 44dp |
| **Status Badge** | 28dp | 28dp |
| **Icon Button** | 48dp | 48dp |

---

## Komponenten

### Buttons

| Variante | Hintergrund | Text | Border |
|----------|-------------|------|--------|
| **Primary** | Accent Orange | Weiß | Keine |
| **Secondary** | Transparent | Primary Navy | 2px Primary |
| **Tertiary** | Background Secondary | Text Primary | Keine |
| **Danger** | Error Red | Weiß | Keine |

- Höhe: 56dp (default), 48dp (small)
- Border-Radius: md (12px)
- Press-Animation: Scale 0.97

### Cards

| Variante | Hintergrund | Border |
|----------|-------------|--------|
| **Default** | Card Surface | 1px Card Border |
| **Elevated** | Card Surface Elevated (dark: heller) | Keine |
| **Outlined** | Transparent | 1.5px Border |
| **Filled** | Background Secondary | Keine |

- Border-Radius: lg (16px)
- Padding: 16px (default), 20px (large)

### Status Badges

- Form: Pill (Border-Radius: full)
- Höhe: 28dp (default), 22dp (small), 34dp (large)
- Schrift: 11px, Bold, Uppercase, Letter-Spacing 0.6

### Filter Chips

- Höhe: 44dp (default), 38dp (small)
- Border: 1.5px
- Border-Radius: full (Pill-Form)
- Ausgewählt: Accent-Hintergrund, weißer Text

### Text Inputs

- Höhe: 56dp
- Border: 1.5px, 2px bei Fehler
- Border-Radius: md (12px)
- Fokus-State: Accent-Border-Farbe
- Label: Oberhalb, 13px SemiBold

### Progress Bar

- Höhe: 8px (default)
- Border-Radius: full
- Füllfarbe: Dynamisch nach Prozentsatz (showFillColor)

---

## Icons

| Größe | Wert | Verwendung |
|-------|------|------------|
| **Standard** | 24px | Navigation, Aktionen |
| **Large** | 28px | Hervorgehobene Aktionen |
| **XL** | 32px | Große Icons |

- Icon-Set: Feather Icons
- Niemals Emojis verwenden

---

## Animationen

### Dauer

| Typ | Wert |
|-----|------|
| **Fast** | 150ms |
| **Normal** | 250ms |
| **Slow** | 400ms |

### Spring-Konfiguration

| Parameter | Wert |
|-----------|------|
| **Damping** | 20 |
| **Stiffness** | 300 |
| **Mass** | 0.8 |

### Press-Feedback

| Eigenschaft | Wert |
|-------------|------|
| **Scale** | 0.97 |
| **Opacity** | 0.85 |

---

## Schatten (nur Light Mode)

| Typ | Y-Offset | Blur | Opacity |
|-----|----------|------|---------|
| **Small** | 1px | 2px | 0.04 |
| **Medium** | 2px | 4px | 0.06 |
| **Large** | 4px | 8px | 0.08 |
| **XL** | 8px | 16px | 0.10 |

*Im Dark Mode: Keine Schatten, stattdessen hellere Hintergrundfarben für Elevation.*

---

## Barrierefreiheit (WCAG AA)

- Alle Text/Hintergrund-Kombinationen: min. 4.5:1 Kontrast
- Touch-Targets: min. 48dp
- Outdoor-Lesbarkeit: Hoher Kontrast, keine dünnen Schriften
- Klares visuelles Feedback bei allen Interaktionen

---

## Wiederverwendbare Komponenten

### LoadingScreen

Konsistente Ladezustände mit optionaler Nachricht:

```tsx
import { LoadingScreen } from "@/components/LoadingScreen";

// Vollbild-Ladebildschirm
<LoadingScreen message="Daten werden geladen..." />

// Inline-Ladeindikator
<LoadingScreen fullScreen={false} message="Wird aktualisiert..." />
```

### EmptyState

Konsistente Leerzustände mit Icon, Titel und optionaler Aktion:

```tsx
import { EmptyState } from "@/components/EmptyState";

<EmptyState
  icon="inbox"
  title="Keine Aufgaben"
  message="Es sind keine Aufgaben verfügbar"
  actionLabel="Aufgabe erstellen"
  onAction={() => navigation.navigate("CreateTask")}
/>
```

### StatusBadge

Statusanzeige mit konsistenten Farben und hohem Kontrast:

```tsx
import { StatusBadge } from "@/components/StatusBadge";

<StatusBadge status="in_progress" size="small" />
<StatusBadge status="completed" label="Erledigt" />
```

Alle Status-Badges verwenden weiße Schrift für maximalen Kontrast.

---

## Best Practices

1. Theme-Farben aus `constants/theme.ts` verwenden
2. Niemals Farbwerte hardcoden
3. In Hell- und Dunkelmodus testen
4. 48dp Minimum-Touch-Targets einhalten
5. Konsistente Spacing-Tokens verwenden
6. Safe Area Insets korrekt anwenden
7. KeyboardAwareScrollView für Formulare
8. ErrorBoundary um die gesamte App
9. Feather Icons, niemals Emojis
10. Outdoor-Lesbarkeit prüfen
11. LoadingScreen für konsistente Ladezustände
12. EmptyState für leere Listen mit Aktionsmöglichkeit
