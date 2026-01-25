# Smart Crime Scene Investigation App - Design Guidelines

## Brand Identity

**Purpose**: Professional evidence documentation tool for law enforcement first responders, replacing body-worn cameras while providing comprehensive crime scene investigation capabilities.

**Visual Direction**: **Utilitarian/Government** - This is a serious forensic tool, not a consumer app. Think police dashboards, military command interfaces, and forensic lab software. Clean, hierarchical, data-dense, and trustworthy. Dark theme optimized for field use with high legibility in various lighting conditions.

**Memorable Element**: The synchronized evidence timeline - a visual representation showing background video recording with pinned evidence markers that reveal exactly what was captured when. This is the app's signature feature.

## Navigation Architecture

**Root Navigation**: Bottom Tab Bar (4 tabs)
- **Cases** - Browse and manage all investigation cases
- **Investigation** - Active investigation screen (disabled when no active case)
- **Reports** - Generated PDF reports and analytics
- **Profile** - Officer profile, settings, chain of custody logs

**Authentication**: Required (SSO preferred - Google Sign-In for Android departments)

## Screen-by-Screen Specifications

### Login Screen
- **Layout**: Centered login form, non-scrollable
- **Header**: None
- **Components**: 
  - App icon and "Official Use Only" badge
  - Google Sign-In button
  - Terms of Service/Privacy Policy links (bottom)
- **Safe Area**: Full screen with insets.bottom + Spacing.xl

### Cases Screen (Home Tab)
- **Layout**: Default navigation header with search, scrollable list below
- **Header**: 
  - Title: "Cases"
  - Right button: "+" New Case
  - Search bar embedded
- **Main Content**: 
  - List of case cards showing: Case ID, title, date, status badge, thumbnail
  - Empty state if no cases
- **Safe Area**: Bottom inset = tabBarHeight + Spacing.xl, top inset = Spacing.xl

### New Case Screen (Modal)
- **Layout**: Scrollable form
- **Header**: 
  - Left: Cancel
  - Title: "New Case"
  - Right: "Create" (disabled until form valid)
- **Form Fields**:
  - Case title (text input)
  - Location (auto-populated from GPS with manual override)
  - Lead officer (auto-populated from profile)
  - Case ID (auto-generated, read-only, displayed)
- **Safe Area**: Standard modal insets

### Investigation Screen (Active Tab)
**When No Active Case**:
- Empty state with illustration
- Text: "No active investigation"
- Button: "Select a case to begin"

**When Case Active**:
- **Layout**: Custom header (transparent), scrollable content, floating action buttons
- **Header**:
  - Left: Back to cases
  - Title: Case ID
  - Right: Stop recording (red icon)
  - Recording indicator (pulsing red dot + duration timer)
- **Main Content**:
  - Live video preview (small, top section)
  - Evidence capture controls (large buttons):
    - Capture Photo
    - Add Text Note
    - Record Audio Note
  - Recently captured evidence (horizontal scrolling cards)
- **Floating Elements**:
  - Evidence count badge (top right)
  - GPS accuracy indicator (if poor signal)
- **Safe Area**: Top inset = headerHeight + Spacing.xl, bottom inset = tabBarHeight + Spacing.xl

### Case Detail Screen
- **Layout**: Tabs (horizontal) with scrollable content per tab
- **Header**: 
  - Left: Back
  - Title: Case ID
  - Right: Generate Report
- **Tabs**:
  1. **Timeline** - Chronological evidence list with video scrubber
  2. **Map** - Interactive map with evidence pins
  3. **Evidence** - Grid view of all photos/notes with AI tags
  4. **Activity Log** - Chain of custody audit trail
- **Safe Area**: Bottom inset = tabBarHeight + Spacing.xl

### Evidence Detail Screen
- **Layout**: Full-screen image with overlay controls
- **Header**: Transparent with back button
- **Components**:
  - Full-size evidence photo
  - AI detection bounding boxes (toggleable)
  - Metadata panel (bottom sheet): timestamp, GPS, detected objects, confidence scores
  - Video sync button: "Jump to Video Moment"
- **Safe Area**: Top/bottom full bleed with overlay controls

### Reports Screen
- **Layout**: Default header, scrollable list
- **Header**: Title: "Reports"
- **Main Content**:
  - List of generated PDF reports with preview thumbnails
  - Filters: Date range, case status
  - Empty state if no reports
- **Safe Area**: Standard with tab bar

### Profile Screen
- **Layout**: Scrollable settings list
- **Header**: Title: "Profile"
- **Components**:
  - Officer badge/avatar (preset uniform icon)
  - Name and badge number
  - Department
  - App settings: Dark mode (default on), notification preferences
  - Chain of custody: "View My Activity Log"
  - Account: Log out, Delete account (nested)
- **Safe Area**: Standard with tab bar

## Color Palette

**Primary**: #1E3A5F (Navy Blue) - Professional, authoritative
**Primary Variant**: #2D5280 (Lighter blue for active states)
**Accent**: #FF5722 (Warning Orange) - Recording indicator, alerts
**Background**: #0A0E14 (Near black) - Dark theme base
**Surface**: #1A1F29 (Dark gray) - Cards, elevated elements
**Surface Variant**: #252D3A (Lighter gray) - Input fields, disabled states
**Text Primary**: #FFFFFF (White) - High contrast
**Text Secondary**: #B0B8C3 (Light gray) - Metadata, timestamps
**Success**: #4CAF50 (Green) - Completed actions, GPS lock
**Warning**: #FFC107 (Amber) - Caution states
**Error**: #F44336 (Red) - Errors, delete actions
**Border**: #2A3444 (Subtle divider)

## Typography

**Font**: System font (Roboto on Android) - Maximum legibility for official use
**Scale**:
- Display: 32px Bold - Screen titles
- Headline: 24px Bold - Section headers
- Title: 20px Medium - Card titles, Case IDs
- Body: 16px Regular - Primary content
- Label: 14px Medium - Buttons, metadata
- Caption: 12px Regular - Timestamps, fine print
**Monospace** (for Case IDs, timestamps): Roboto Mono

## Visual Design

- **Icons**: Material Icons (standard Android system icons)
- **Touchable Feedback**: Ripple effect (Android standard), no shadows on most buttons
- **Floating Action Buttons**: Shadow specification - shadowOffset: (0, 2), shadowOpacity: 0.10, shadowRadius: 2
- **Cards**: 1px border (#2A3444), no shadow, 8px corner radius
- **Badges**: Rounded corners (16px), solid fills with semantic colors

## Assets to Generate

1. **icon.png** - App icon featuring police badge silhouette + camera lens (navy and orange)
2. **splash-icon.png** - Same as app icon
3. **empty-cases.png** - Illustration of empty evidence folder with magnifying glass (WHERE: Cases screen when no cases exist)
4. **empty-investigation.png** - Illustration of camera with "standby" indicator (WHERE: Investigation tab when no active case)
5. **empty-reports.png** - Illustration of blank document with checkmark (WHERE: Reports screen when no reports generated)
6. **officer-avatar.png** - Generic police badge icon (WHERE: Profile screen, login confirmation)
7. **evidence-marker-weapon.png** - Map pin icon with weapon symbol (WHERE: Map view for weapon evidence)
8. **evidence-marker-vehicle.png** - Map pin icon with vehicle symbol (WHERE: Map view for vehicle evidence)
9. **evidence-marker-document.png** - Map pin icon with document symbol (WHERE: Map view for document evidence)
10. **evidence-marker-person.png** - Map pin icon with person symbol (WHERE: Map view for person-related evidence)

**Style Note**: All generated assets should use navy blue (#1E3A5F) and orange (#FF5722) color scheme with clean, geometric shapes suitable for official government software.