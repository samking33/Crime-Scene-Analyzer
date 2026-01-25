# Smart Crime Scene Investigation App - Premium Design Guidelines

## Brand Identity

**Purpose**: Professional evidence documentation tool for law enforcement first responders, replacing body-worn cameras while providing comprehensive crime scene investigation capabilities.

**Visual Direction**: **Premium Tactical Interface** - Inspired by enterprise design systems like Figma, Linear, Stripe Dashboard, and Apple Health. Dark theme optimized for field use with exceptional legibility, sophisticated depth, and precise hierarchy.

**Design Pillars**:
1. **Clarity** - Information hierarchy with subtle depth cues
2. **Efficiency** - Minimal clicks, maximum data density
3. **Trust** - Professional, authoritative visual language
4. **Precision** - Exact spacing, consistent components

**Memorable Element**: The synchronized evidence timeline with AI-powered object detection overlays.

## Color System

### Primary Palette
| Name | Value | Usage |
|------|-------|-------|
| **Primary** | #2962FF | CTAs, active states, links, focus rings |
| **Accent** | #00B0FF | Secondary actions, highlights, info badges |
| **Background Root** | #0A1929 | App background |
| **Background Secondary** | #1E2530 | Cards, elevated surfaces |
| **Background Tertiary** | #2A3544 | Nested elements, hover states |

### Semantic Colors
| Name | Value | Usage |
|------|-------|-------|
| **Success** | #43A047 | Completed, GPS lock, online |
| **Warning** | #FFA726 | Caution, pending states |
| **Error** | #EF5350 | Errors, delete, recording |
| **Neutral** | #78909C | Disabled, inactive |

### Text Colors
| Name | Value | Usage |
|------|-------|-------|
| **Text Primary** | #FFFFFF | Headings, primary content |
| **Text Secondary** | #B8C5D3 | Body text, descriptions |
| **Text Tertiary** | #7B8A9A | Labels, timestamps, hints |
| **Text Disabled** | #4A5568 | Disabled text |

### Surface & Borders
| Name | Value | Usage |
|------|-------|-------|
| **Border** | rgba(255,255,255,0.08) | Card borders, dividers |
| **Border Focused** | rgba(41,98,255,0.5) | Input focus states |

### Gradient Colors
| Name | Values | Usage |
|------|--------|-------|
| **Primary Gradient** | #2962FF → #1E88E5 | Primary buttons, FAB |
| **Accent Gradient** | #00B0FF → #0091EA | Secondary highlights |
| **Success Gradient** | #43A047 → #2E7D32 | Success states |
| **Error Gradient** | #EF5350 → #D32F2F | Recording indicators |

## Typography Scale

**Font Stack**: System fonts with -apple-system, BlinkMacSystemFont, Inter fallback

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
| **Primary Glow** | color(#2962FF), blur(12), opacity(0.4) | Primary buttons |
| **Inner** | offset(0,1) inset, blur(2), opacity(0.1) | Pressed states |

## Component Specifications

### Button Variants
| Variant | Background | Border | Text Color |
|---------|------------|--------|------------|
| **Primary** | Primary gradient | None | White |
| **Secondary** | Transparent | 1.5px primary | Primary |
| **Ghost** | Transparent | None | Text Secondary |
| **Danger** | Error color | None | White |

**Button Sizes**:
- Default: height 52px, paddingH 24px
- Small: height 40px, paddingH 16px
- Large: height 56px, paddingH 32px

### Card Variants
| Variant | Border | Background | Shadow |
|---------|--------|------------|--------|
| **Default** | 1px border | backgroundSecondary | sm |
| **Premium** | 1px border | backgroundSecondary | lg |
| **Stat** | None | backgroundSecondary | md |
| **Interactive** | 1px border | backgroundSecondary | md, scale animation |

### Input States
| State | Border Color | Background |
|-------|--------------|------------|
| **Default** | border | backgroundTertiary |
| **Focused** | borderFocused (primary) | backgroundTertiary |
| **Error** | error | backgroundTertiary |
| **Disabled** | border (50% opacity) | backgroundSecondary |

### Badge Variants
| Variant | Background | Text |
|---------|------------|------|
| **Status Active** | success (15% opacity) | success |
| **Status Pending** | warning (15% opacity) | warning |
| **Status Closed** | neutral (15% opacity) | neutral |
| **Confidence High** | success (15% opacity) | success |
| **Confidence Medium** | warning (15% opacity) | warning |
| **Confidence Low** | error (15% opacity) | error |

## Animation Configuration

### Spring Presets
| Name | Damping | Stiffness | Usage |
|------|---------|-----------|-------|
| **Fast** | 15 | 200 | Button presses |
| **Default** | 20 | 150 | General transitions |
| **Slow** | 25 | 100 | Large movements |

### Fade Animations
| Type | Duration | Delay Pattern |
|------|----------|---------------|
| **FadeIn** | 400ms | - |
| **Staggered List** | 400ms | index * 100ms |

## Screen Layouts

### Cases Screen (Home)
- Stats grid: 2x2 StatCards showing Active Cases, Closed, Evidence Items, Total
- Search bar with left icon
- Section header with count badge
- CaseCard list with staggered FadeIn

### Case Detail Screen
- Animated header with case ID badge and status
- Stats row: 2 stat cards (Evidence count, Activity count)
- Action buttons: Continue Investigation (primary), Generate Report (secondary)
- Tab bar: Timeline | Evidence | Activity
- Filter chips for evidence types

### Investigation Screen
- Camera preview with gesture controls (pinch zoom, double-tap)
- Recording indicator with duration timer
- Evidence capture buttons: Note, Photo (primary), Audio
- Video recording toggle
- Recently captured evidence carousel

### Evidence Viewer Screen
- Full-screen image/video with gesture zoom
- Floating header with back button and metadata
- AI Analysis card with object detection stats
- Original/Annotated toggle
- Object details expandable list

### Category Dashboard Screen
- Summary gradient cards: Total Objects, Active Categories
- 2-column category card grid
- Category cards: icon, name, count, confidence badge
- Priority badges for high-priority categories

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

- Blur background on iOS
- Active tab: Primary color text, subtle background highlight
- Inactive tab: Tertiary text color
- Icon containers with rounded background on active state

## FAB (Floating Action Button)

- Primary gradient background
- Size: 56x56px
- Border radius: 28px
- Primary glow shadow
- Scale animation on press

## Assets

1. **icon.png** - App icon with police badge + camera lens (navy/primary blue)
2. **splash-icon.png** - Same as app icon
3. **empty-cases.png** - Empty folder illustration
4. **empty-investigation.png** - Camera standby illustration
5. **empty-reports.png** - Blank document illustration
6. **officer-avatar.png** - Generic badge icon

## Accessibility

- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Focus indicators: 2px primary color ring
- Haptic feedback on all interactive elements
