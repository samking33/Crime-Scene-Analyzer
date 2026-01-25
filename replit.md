# Crime Scene Investigator App

## Overview
A professional mobile application designed for law enforcement first responders and investigative officers. It serves as a replacement for traditional Body-Worn Cameras (BWC) while functioning as a comprehensive crime scene documentation system.

## Architecture
- **Frontend**: React Native with Expo
- **Backend**: Express.js server
- **Storage**: AsyncStorage for local data persistence
- **Navigation**: React Navigation with bottom tabs and stack navigators

## Key Features
1. **Case Management** - Create and manage investigation cases
2. **Evidence Capture** - Photo, audio, and text note capture with GPS tagging
3. **Investigation Mode** - Active investigation with camera preview
4. **Activity Logging** - Chain of custody documentation
5. **Report Generation** - Generate case reports

## Project Structure
```
client/
├── App.tsx                    # App entry point
├── components/                # Reusable UI components
│   ├── ActivityItem.tsx       # Activity log item
│   ├── Button.tsx             # Styled button
│   ├── Card.tsx               # Card component
│   ├── CaseCard.tsx           # Case list item
│   ├── EmptyState.tsx         # Empty state with illustration
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── EvidenceButton.tsx     # Evidence capture button
│   ├── EvidenceCard.tsx       # Evidence item display
│   ├── HeaderTitle.tsx        # Custom header
│   ├── Input.tsx              # Text input
│   ├── RecordingIndicator.tsx # Recording status
│   ├── ReportCard.tsx         # Report list item
│   ├── StatusBadge.tsx        # Status indicator
│   └── ThemedText.tsx         # Styled text
├── constants/
│   └── theme.ts               # Colors, spacing, typography
├── hooks/
│   ├── useScreenOptions.ts    # Navigation options
│   └── useTheme.ts            # Theme hook
├── lib/
│   ├── query-client.ts        # React Query setup
│   └── storage.ts             # AsyncStorage utilities
├── navigation/
│   ├── MainTabNavigator.tsx   # Bottom tab navigation
│   └── RootStackNavigator.tsx # Stack navigation
├── screens/
│   ├── ActivityLogScreen.tsx  # Activity log view
│   ├── AddNoteScreen.tsx      # Add note modal
│   ├── CaseDetailScreen.tsx   # Case details
│   ├── CasesScreen.tsx        # Cases list (home)
│   ├── EditProfileScreen.tsx  # Profile editor
│   ├── InvestigationScreen.tsx # Active investigation
│   ├── NewCaseScreen.tsx      # Create case modal
│   ├── ProfileScreen.tsx      # Officer profile
│   ├── RecordAudioScreen.tsx  # Audio recording
│   └── ReportsScreen.tsx      # Reports list
└── types/
    └── case.ts                # TypeScript interfaces
```

## Color Scheme
- **Primary**: #1E3A5F (Navy Blue)
- **Accent**: #FF5722 (Warning Orange)
- **Background**: #0A0E14 (Near black)
- **Surface**: #1A1F29 (Dark gray)

## Running the App
- Frontend runs on port 8081 (Expo)
- Backend runs on port 5000 (Express)

## Recent Changes
- Initial MVP implementation
- 4-tab navigation: Cases, Investigation, Reports, Profile
- Case CRUD with AsyncStorage
- Evidence capture (photo, audio, notes)
- GPS tagging for evidence
- Activity logging for chain of custody
- Dark theme with professional forensic styling
