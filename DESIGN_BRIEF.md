# ContainerFlow – Design-Brief für externe Gestaltung

## 1. App-Übersicht

**ContainerFlow** ist eine professionelle mobile Anwendung für die Abfallcontainer-Verwaltung. Sie ermöglicht Entsorgungsunternehmen die vollständige Digitalisierung ihrer Container-Logistik – von der Auftragserteilung über die GPS-Navigation bis zur QR-Code-gestützten Abholung und Lieferung.

### Primäre Zielgruppe

- **Fahrer** (Außendienst): Nutzen die App täglich im Fahrzeug und vor Ort bei Kunden – oft mit Arbeitshandschuhen und unter wechselnden Lichtverhältnissen
- **Administratoren/Disponenten** (Innendienst): Verwalten Aufträge, Fahrer, Container und analysieren Leistungsdaten

---

## 2. Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Aufgabenverwaltung** | Zuweisung, Statusverfolgung (Offen → In Bearbeitung → Erledigt/Storniert), Priorisierung |
| **QR-Code-Scanning** | Identifikation von Kunden- und Lagercontainern per Kamera |
| **GPS-Navigation** | Deep-Link zu Google Maps/Apple Maps mit Kundenstandort |
| **Container-Tracking** | Füllstandsüberwachung (%), Materialtyp, Leerungsverlauf |
| **Fahrerverwaltung** | Kontoerstellung, Aktivierung/Deaktivierung (nur Admin) |
| **Aktivitätsprotokoll** | Lückenlose Dokumentation aller Aktionen mit CSV-Export |
| **Statistiken & Analytics** | Wöchentliche Lieferungen, Materialverteilung, Füllstände |
| **Fahrerleistung** | Abschlussraten, Durchschnittszeiten, Tages-/Wochenübersicht |
| **Offline-Synchronisation** | Lokale Datenspeicherung bei Verbindungsabbruch |
| **Hell-/Dunkel-Modus** | Manueller Umschalter + System-Automatik |

---

## 3. Benutzerrollen & Berechtigungen

| Rolle | Zugriff |
|-------|---------|
| **Fahrer** | Eigene Aufgaben, Scanner, Container-Übersicht, Profil, Theme-Einstellungen |
| **Administrator** | Alles + Dashboard, Aufgaben erstellen, Fahrer verwalten, Aktivitätsprotokoll, Analytics, Fahrerleistung |

---

## 4. Screen-Inventar (12 Hauptbildschirme)

| Screen | Zweck | Rolle |
|--------|-------|-------|
| **Login** | E-Mail/Passwort-Authentifizierung | Alle |
| **Aufgaben (Tasks)** | Aufgabenliste mit Statusfilter, Quick-Navigation | Fahrer/Admin |
| **Aufgabendetails** | Vollständige Aufgabeninformationen, Aktionen | Fahrer/Admin |
| **Scanner** | QR-Code-Scan für Abholung/Lieferung | Fahrer/Admin |
| **Container** | Tabs: Kundencontainer / Lagercontainer | Fahrer/Admin |
| **Profil** | Kontoinformationen, Theme-Einstellungen, Logout | Alle |
| **Admin-Dashboard** | Tagesübersicht, KPIs, Schnellaktionen | Admin |
| **Aufgabe erstellen** | Container + Fahrer auswählen, Details eingeben | Admin |
| **Fahrer verwalten** | Liste, Hinzufügen, Aktivieren/Deaktivieren | Admin |
| **Aktivitätsprotokoll** | Chronologische Aktionsliste, Filter, CSV-Export | Admin |
| **Statistiken** | Diagramme: Lieferungen, Material, Füllstände | Admin |
| **Fahrerleistung** | Individuelle Performance-Metriken | Admin |

---

## 5. UX-Anforderungen (Industrie-Outdoor)

| Anforderung | Spezifikation |
|-------------|---------------|
| **Touch-Targets** | Minimum 48dp × 48dp (idealerweise 56dp) |
| **Handschuh-Bedienung** | Großzügige Abstände, keine Präzisionsgesten |
| **Lesbarkeit** | Hoher Kontrast, große Schriftgrößen (min. 16px Body) |
| **Lichtverhältnisse** | Funktioniert bei direkter Sonneneinstrahlung und Dunkelheit |
| **Schnelle Interaktion** | Wenige Taps zum Ziel, klare CTAs |
| **Fehlertoleranz** | Bestätigungsdialoge vor destruktiven Aktionen |

---

## 6. Farbsystem & Design-Sprache

### 6.1 Primärfarben

| Farbe | Hex | Verwendung |
|-------|-----|------------|
| **Navy Blue** | `#1F3650` | Primary, Header, Navigation |
| **Safety Orange** | `#FF6B2C` | Accent, CTAs, Warnungen |

### 6.2 Statusfarben

| Status | Hex | Bedeutung |
|--------|-----|-----------|
| Offen | `#4A90A4` | Ausstehende Aufgaben |
| In Bearbeitung | `#F5A623` | Aktive Aufgaben |
| Erledigt | `#27AE60` | Abgeschlossene Aufgaben |
| Storniert | `#E74C3C` | Abgebrochene Aufgaben |

### 6.3 Füllstand-Indikatoren

| Level | Hex | Bereich |
|-------|-----|---------|
| Niedrig | `#27AE60` | 0–50% |
| Mittel | `#F5A623` | 51–79% |
| Hoch/Kritisch | `#E74C3C` | 80–100% |

### 6.4 Grautöne (blau-getönt)

| Verwendung | Hex |
|------------|-----|
| Hintergrund Root | `#F8FAFC` |
| Hintergrund Default | `#F1F5F9` |
| Hintergrund Sekundär | `#E2E8F0` |
| Text Primär | `#1E293B` |
| Text Sekundär | `#64748B` |
| Text Tertiär | `#94A3B8` |
| Rahmen/Border | `#CBD5E1` |

### 6.5 Dunkelmodus-Farben

| Verwendung | Hex |
|------------|-----|
| Hintergrund Root | `#0F172A` |
| Hintergrund Default | `#1E293B` |
| Hintergrund Sekundär | `#334155` |
| Text Primär | `#F8FAFC` |
| Text Sekundär | `#94A3B8` |
| Text Tertiär | `#64748B` |
| Rahmen/Border | `#475569` |

### 6.6 Design-Stil

- **iOS 26 Liquid Glass**: Subtile Transparenz, Blur-Effekte, organische Animationen
- **WCAG AA Kontrast**: Alle Text/Hintergrund-Kombinationen erfüllen Mindeststandards
- **Elevation durch Farbe**: Cards nutzen Hintergrundfarben statt Schatten

---

## 7. Typografie

| Element | Größe | Gewicht | Line-Height |
|---------|-------|---------|-------------|
| H1 | 32px | Bold (700) | 1.2 |
| H2 | 28px | Bold (700) | 1.2 |
| H3 | 24px | SemiBold (600) | 1.3 |
| H4 | 20px | SemiBold (600) | 1.3 |
| Body | 16px | Regular (400) | 1.5 |
| Body Bold | 16px | SemiBold (600) | 1.5 |
| Small | 14px | Regular (400) | 1.4 |
| Caption | 12px | Regular (400) | 1.4 |

**Schriftart**: System-Default (San Francisco auf iOS, Roboto auf Android)

---

## 8. Spacing-System

| Token | Wert |
|-------|------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |
| 4xl | 40px |
| 5xl | 48px |

---

## 9. Komponenten-Übersicht

### 9.1 Buttons

- **Primary Button**: Safety Orange Hintergrund, weißer Text, 56px Höhe
- **Secondary Button**: Transparenter Hintergrund, Navy Blue Border, Navy Text
- **Icon Button**: 48×48dp Minimum, zentriertes Icon

### 9.2 Cards

- Abgerundete Ecken (12px Radius)
- Hintergrundfarbe für Elevation (keine Schatten)
- Padding: 16px
- Gap zwischen Cards: 12px

### 9.3 Input Fields

- 56px Höhe für Touch-Freundlichkeit
- Label oberhalb des Inputs
- Klare Fokus-States mit Accent-Farbe
- Fehlerzustände mit Rot-Tönung

### 9.4 Status Badges

- Pill-Form (Border-Radius: full)
- Farbcodiert nach Status
- Weißer Text auf farbigem Hintergrund

### 9.5 Navigation

- Bottom Tab Bar mit 5 Tabs (Fahrer: 4 Tabs)
- Icons: Feather Icon Set
- Aktiver Tab: Accent-Farbe
- Inaktiver Tab: Sekundärtext-Farbe

---

## 10. Technische Basis

| Komponente | Technologie |
|------------|-------------|
| **Frontend** | React Native + Expo SDK 54 |
| **Navigation** | React Navigation 7 (Bottom Tabs + Native Stack) |
| **State Management** | TanStack React Query |
| **Backend** | Express.js + TypeScript |
| **Datenbank** | PostgreSQL (Drizzle ORM) |
| **Kamera** | expo-camera (QR/Barcode) |
| **GPS** | expo-location |
| **Animationen** | React Native Reanimated |

---

## 11. Besondere Anforderungen

### 11.1 QR-Code-Scanner
- Vollbild-Kameraansicht
- Zentrierter Scan-Rahmen mit visueller Hervorhebung
- Modus-Anzeige oben (Abholung/Lieferung)
- Aktive Aufgabe-Banner unten
- Modal für Scan-Ergebnis mit Bestätigungsaktionen

### 11.2 GPS-Navigation
- Deep-Link-Integration zu nativen Karten-Apps
- Quick-Navigation-Button direkt in der Aufgabenliste
- Standort-Anzeige in Aufgabendetails

### 11.3 Offline-Fähigkeit
- Lokale Datenpersistenz bei Verbindungsabbruch
- Visuelle Anzeige des Offline-Status
- Automatische Synchronisation bei Verbindungswiederherstellung

### 11.4 Theme-System
- Manueller Toggle in Profileinstellungen
- Drei Modi: Hell / Dunkel / System
- Sofortige Umschaltung ohne App-Neustart

### 11.5 Haptic Feedback
- Taktile Bestätigung bei wichtigen Aktionen
- Scan-Erfolg, Button-Taps, Statusänderungen

---

## 12. Lokalisierung

| Aspekt | Spezifikation |
|--------|---------------|
| **Sprache** | Deutsch (de-DE) |
| **Datumsformat** | `DD. MMM YYYY` oder `DD.MM.YYYY` |
| **Zeitformat** | 24-Stunden (z.B. `14:30`) |
| **Dezimaltrennzeichen** | Komma (z.B. `1.234,56 kg`) |
| **Tausendertrennzeichen** | Punkt |

---

## 13. Screen-Wireframes (Beschreibung)

### 13.1 Login
- Zentriertes Logo mit App-Name
- E-Mail-Eingabefeld
- Passwort-Eingabefeld mit Sichtbarkeits-Toggle
- Primärer "Anmelden"-Button
- Info-Hinweis für Kontoerstellung

### 13.2 Aufgaben (Tasks)
- Statusfilter-Leiste (Alle, Offen, Aktiv, Erledigt)
- Scrollbare Aufgabenliste als Cards
- Jede Card: Status-Indikator, Container-ID, Standort, Zeit, Quick-Nav-Button
- Pull-to-Refresh

### 13.3 Scanner
- Vollbild-Kamera
- Transparentes Overlay mit Scan-Rahmen
- Modus-Badge oben
- Aktive-Aufgabe-Banner unten
- Modal bei erfolgreichem Scan

### 13.4 Admin-Dashboard
- Begrüßung mit Benutzername
- 4er-Grid mit KPI-Karten (Offen, In Bearbeitung, Erledigt, Aktive Fahrer)
- Container-Status-Sektion (Kritisch, Kapazität)
- Schnellaktionen als Button-Grid

---

## 14. Deliverables für Designer

### Benötigt werden:

1. **UI Kit** mit allen Komponenten
   - Buttons (Primary, Secondary, Icon, Disabled States)
   - Cards (Standard, Selected, With Badge)
   - Input Fields (Default, Focus, Error, Disabled)
   - Status Badges (alle 4 Status)
   - Navigation (Tab Bar, Header)
   - Modals und Dialoge
   - Listen und List Items
   - Progress Bars / Fill Indicators

2. **Screen-Designs** für alle 12 Hauptbildschirme
   - Jeweils Hell- und Dunkelmodus
   - Leere Zustände (Empty States)
   - Ladezustände (Loading States)
   - Fehlerzustände (Error States)

3. **Interaktionsflüsse**
   - Login → Dashboard/Aufgaben
   - Aufgabe auswählen → Details → Navigation → Scan → Bestätigung
   - Admin: Aufgabe erstellen → Zuweisung → Fertig

4. **Icon-Set**
   - Konsistent mit Feather Icons Stil
   - Eigene Icons für app-spezifische Funktionen

5. **App-Icon & Splash Screen**
   - 1024×1024px App-Icon (alle Plattformen)
   - Adaptive Icons für Android
   - Splash Screen mit Logo

6. **Styleguide-Dokumentation**
   - Alle Farben mit Hex-Codes
   - Typografie-Skala
   - Spacing-Tokens
   - Border-Radius-Werte
   - Schatten/Elevation-System

---

## 15. Kontakt & Ansprechpartner

*[Hier Kontaktdaten einfügen]*

---

**Erstellt am**: Dezember 2024  
**Version**: 1.0
