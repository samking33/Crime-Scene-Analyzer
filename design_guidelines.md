# Smart Crime Scene Investigation App - Forensic Tactical Design Guidelines

## Brand Identity

**Purpose**: Professional evidence documentation tool for law enforcement first responders, replacing body-worn cameras while providing comprehensive crime scene investigation capabilities.

**Visual Direction**: **Forensic Tactical Interface** - Professional dark theme optimized for field use with exceptional legibility, sophisticated depth, and precise hierarchy. Inspired by forensic/tactical design language.

**Design Pillars**:
1. **Clarity** - Information hierarchy with subtle depth cues
2. **Efficiency** - Minimal clicks, maximum data density
3. **Trust** - Professional, authoritative visual language
4. **Precision** - Exact spacing, consistent components

**Memorable Element**: The synchronized evidence timeline with AI-powered object detection overlays.

## Forensic Color System

### Primary Palette
| Name | Value | Usage |
|------|-------|-------|
| **Investigation Cyan** | #2FA4B9 | Primary CTAs, active states, links, focus rings |
| **Evidence Amber** | #D9A441 | Warnings, evidence highlights, secondary actions |
| **Forensic Navy** | #0F1A24 | App background (backgroundRoot) |
| **Charcoal** | #1A2530 | Cards, elevated surfaces (backgroundSecondary) |
| **Steel** | #243240 | Nested elements, hover states (backgroundTertiary) |

### Semantic Colors
| Name | Value | Usage |
|------|-------|-------|
| **Success** | #10B981 | Completed, GPS lock, online, high confidence |
| **Warning** | #D9A441 | Caution, pending states (Evidence Amber) |
| **Status Red** | #C0392B | Recording state, errors, critical alerts |
| **Neutral** | #6B7280 | Disabled, inactive |

### Text Colors
| Name | Value | Usage |
|------|-------|-------|
| **Text Primary** | #F0F4F8 | Headings, primary content |
| **Text Secondary** | #A0AEC0 | Body text, descriptions |
| **Text Tertiary** | #64748B | Labels, timestamps, hints |
| **Text Disabled** | #475569 | Disabled text |

### Surface & Borders
| Name | Value | Usage |
|------|-------|-------|
| **Border** | rgba(255,255,255,0.08) | Card borders, dividers |
| **Border Focused** | rgba(47,164,185,0.5) | Input focus states (cyan) |
| **Muted** | rgba(47,164,185,0.08) | Subtle backgrounds, hover states |

### Gradient Colors
| Name | Values | Usage |
|------|--------|-------|
| **Primary Gradient** | #2FA4B9 → #1A8A9C | Primary buttons, FAB |
| **Accent Gradient** | #D9A441 → #C09030 | Evidence highlights |
| **Success Gradient** | #10B981 → #059669 | Success states |
| **Error Gradient** | #C0392B → #A33225 | Recording indicators |

## Typography Scale

**Font Stack**: System fonts with -apple-system, BlinkMacSystemFont, Inter fallback
**Monospace**: Menlo (iOS), monospace (Android) for case IDs, timestamps, coordinates

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| **Display** | 32px | Bold (700) | Hero titles |
| **H1** | 28px | Bold (700) | Screen titles |
| **H2** | 24px | Semibold (600) | Section headers |
| **H3** | 20px | Semibold (600) | Card titles |
| **H4** | 18px | Semibold (600) | Subsection headers |
| **Body** | 16px | Regular (400) | Primary content |
| **Body Small** | 14px | Regular (400) | Secondary content |
| **Label** | 13px | Medium (500) | Buttons, labels |
| **Caption** | 12px | Regular (400) | Timestamps, metadata |
| **Overline** | 11px | Semibold (600) | Badges, tags |
| **Mono** | 13px | Medium (500) | Case IDs, coordinates |

## Spacing System (8pt Grid)

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Tight gaps |
| **sm** | 8px | Component internal |
| **md** | 12px | Related elements |
| **lg** | 16px | Section gaps |
| **xl** | 24px | Major sections |
| **2xl** | 32px | Screen sections |
| **3xl** | 48px | Large separations |
| **4xl** | 64px | Hero spacing |
| **screenPadding** | 20px | Horizontal margins |

## Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Small badges |
| **sm** | 6px | Buttons, inputs |
| **md** | 8px | Small cards |
| **lg** | 12px | Cards, modals |
| **xl** | 16px | Large cards |
| **2xl** | 20px | Sheets |
| **full** | 9999px | Pills, avatars |

## Shadow System

### Elevation Levels
| Level | Shadow Properties | Usage |
|-------|-------------------|-------|
| **xs** | offset(0,1), blur(2), opacity(0.06) | Subtle lift |
| **sm** | offset(0,2), blur(4), opacity(0.08) | Cards |
| **md** | offset(0,4), blur(8), opacity(0.12) | Elevated cards |
| **lg** | offset(0,8), blur(16), opacity(0.16) | Modals |
| **xl** | offset(0,12), blur(24), opacity(0.20) | Dropdowns |

### Special Shadows
| Name | Properties | Usage |
|------|------------|-------|
| **Primary Glow** | color(#2FA4B9), blur(12), opacity(0.4) | Primary buttons |
| **Inner** | offset(0,1) inset, blur(2), opacity(0.1) | Pressed states |

## Component Specifications

### Button Variants
| Variant | Background | Border | Text Color |
|---------|------------|--------|------------|
| **Primary** | Primary gradient | None | White |
| **Secondary** | Transparent | 1.5px primary | Primary (Cyan) |
| **Ghost** | Transparent | None | Text Secondary |
| **Danger** | Status Red | None | White |

**Button Sizes**:
- Default: height 52px, paddingH 24px
- Small: height 40px, paddingH 16px
- Large: height 56px, paddingH 32px

### Card Variants
| Variant | Border | Background | Shadow |
|---------|--------|------------|--------|
| **Default** | 1px border | Charcoal | sm |
| **Premium** | 1px border | Charcoal | lg |
| **Stat** | None | Charcoal | md |
| **Interactive** | 1px border → cyan on hover | Charcoal | md, scale animation |

### Badge Variants
| Variant | Background | Text | Dot |
|---------|------------|------|-----|
| **Status Active** | success (20% opacity) | Success | Green |
| **Status Pending** | amber (20% opacity) | Amber | Orange |
| **Status Closed** | neutral (20% opacity) | Neutral | Gray |
| **Status Recording** | Status Red (solid) | White | White pulsing |
| **Confidence High** | success (20% opacity) | Success | Green |
| **Confidence Medium** | amber (20% opacity) | Amber | Orange |
| **Confidence Low** | error (20% opacity) | Error | Red |

### Recording Indicator
- Background: Status Red (#C0392B)
- White pulsing dot (8px)
- Monospace time display (HH:MM:SS)
- Rounded corners (BorderRadius.lg)

### Evidence Type Badges
| Type | Color | Icon |
|------|-------|------|
| Photo | Investigation Cyan | image |
| Video | Status Red | video |
| Audio | Success Green | mic |
| Note | Evidence Amber | file-text |

## Animation Configuration

### Spring Presets
| Name | Damping | Stiffness | Usage |
|------|---------|-----------|-------|
| **Fast** | 15 | 200 | Button presses, card interactions |
| **Default** | 20 | 150 | General transitions |
| **Slow** | 25 | 100 | Large movements |

### Fade Animations
| Type | Duration | Delay Pattern |
|------|----------|---------------|
| **FadeIn** | 300-400ms | - |
| **Staggered List** | 300ms | index * 80ms |

## Screen Layouts

### Cases Screen (Home)
- Stats grid: 2x2 StatCards (Cyan icons, Forensic Navy background)
- Search bar with Feather icon
- Section header with count badge (Steel background)
- CaseCard list with staggered FadeIn (80ms delay)

### Case Detail Screen
- Animated header with monospace case ID badge
- StatusBadge with dot indicator
- Stats row: Evidence count, Activity count
- Action buttons: Continue Investigation (primary cyan), Generate Report (secondary)
- Filter chips for evidence types

### Investigation Screen
- Case info header with cyan case ID (monospace)
- Camera preview with gesture controls
- Recording overlay: Status Red with white REC text
- Evidence capture buttons in row layout
- Recent evidence horizontal carousel

### Evidence Viewer Screen
- Full-screen image/video with gesture zoom
- AI Analysis card with cyan accent
- Object count badge (cyan background)
- Original/Annotated toggle

### Category Dashboard Screen
- Summary cards: Total Objects, Active Categories
- 2-column category card grid
- Category colors per evidence type

## Evidence Category Colors

| Category | Color | Priority |
|----------|-------|----------|
| Weapons | #D32F2F | 1 (High) |
| Vehicles | #F57C00 | 2 (High) |
| Persons | #1976D2 | 3 |
| Biometrics | #7B1FA2 | 4 |
| Drugs/Substances | #C62828 | 5 |
| Documents | #388E3C | 6 |
| Electronics | #00796B | 7 |
| Evidence Markers | #FBC02D | 8 |
| Tools | #5D4037 | 9 |
| Other | #616161 | 10 |

## Tab Bar Design

- Translucent blur background on iOS
- Active tab: Investigation Cyan text, subtle background highlight
- Inactive tab: Tertiary text color
- Icon containers with rounded background on active state

## FAB (Floating Action Button)

- Primary gradient background (Cyan)
- Size: 56x56px
- Border radius: 28px
- Primary glow shadow
- Scale animation on press

## Assets

1. **icon.png** - App icon with police badge + camera lens (forensic navy/cyan)
2. **splash-icon.png** - Same as app icon
3. **empty-cases.png** - Empty folder illustration
4. **empty-investigation.png** - Camera standby illustration
5. **empty-reports.png** - Blank document illustration
6. **officer-avatar.png** - Generic badge icon

## Accessibility

- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Focus indicators: 2px Investigation Cyan ring
- Haptic feedback on all interactive elements (Light, Medium, Heavy impacts)
