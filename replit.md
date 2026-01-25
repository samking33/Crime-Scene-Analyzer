# Crime Scene Investigator App

## Overview
A professional mobile application designed for law enforcement first responders and investigative officers. It serves as a replacement for traditional Body-Worn Cameras (BWC) while functioning as a comprehensive crime scene documentation system.

## Architecture
- **Frontend**: React Native with Expo
- **Backend**: Express.js server with OpenAI integration
- **Storage**: AsyncStorage for local data persistence
- **Navigation**: React Navigation with bottom tabs and stack navigators
- **AI**: OpenAI GPT-4o Vision for image analysis

## Key Features
1. **Case Management** - Create and manage investigation cases
2. **Evidence Capture** - Photo, video, audio, and text note capture with GPS tagging
3. **Video Recording** - Full video recording with duration tracking
4. **Interactive Camera Controls** - Pinch-to-zoom, tap-to-focus, double-tap zoom toggle, camera flip
5. **AI Image Analysis** - Automatic analysis of photos using OpenAI Vision API
6. **Evidence Viewer** - Gesture-based zoom/pan for photos, video playback with expo-video
7. **Evidence Filtering** - Filter by type (All/Photos/Videos/Audio/Notes) with counts
8. **Activity Logging** - Chain of custody documentation
9. **PDF Report Generation** - Professional forensic reports with expo-print/expo-sharing

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
│   ├── EvidenceCard.tsx       # Evidence item with video/AI badges
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
│   ├── ai.ts                  # AI analysis utilities
│   ├── query-client.ts        # React Query setup
│   └── storage.ts             # AsyncStorage utilities
├── navigation/
│   ├── MainTabNavigator.tsx   # Bottom tab navigation
│   └── RootStackNavigator.tsx # Stack navigation
├── screens/
│   ├── ActivityLogScreen.tsx  # Activity log view
│   ├── AddNoteScreen.tsx      # Add note modal
│   ├── CaseDetailScreen.tsx   # Case details with filtering
│   ├── CasesScreen.tsx        # Cases list (home)
│   ├── EditProfileScreen.tsx  # Profile editor
│   ├── EvidenceViewerScreen.tsx # Evidence viewer with gestures
│   ├── InvestigationScreen.tsx # Active investigation with camera
│   ├── NewCaseScreen.tsx      # Create case modal
│   ├── ProfileScreen.tsx      # Officer profile
│   ├── RecordAudioScreen.tsx  # Audio recording
│   └── ReportsScreen.tsx      # Reports list
└── types/
    └── case.ts                # TypeScript interfaces

server/
├── routes.ts                  # API endpoints (analyze-image, generate-report)
└── replit_integrations/       # OpenAI integration files
```

## API Endpoints
- **POST /api/analyze-image** - AI analysis of crime scene photos using GPT-4o Vision
- **POST /api/generate-report** - PDF report generation with HTML template

## Evidence Types
- **photo** - Images with GPS, AI analysis, pinch-to-zoom viewing
- **video** - Recordings with duration, playback with expo-video
- **audio** - Audio recordings with duration
- **note** - Text notes with content preview

## Color Scheme
- **Primary**: #1E3A5F (Navy Blue)
- **Accent**: #FF5722 (Warning Orange)
- **Background**: #0A0E14 (Near black)
- **Surface**: #1A1F29 (Dark gray)

## Running the App
- Frontend runs on port 8081 (Expo)
- Backend runs on port 5000 (Express)

## Recent Changes (January 2026)
- Added video recording support with expo-camera recordAsync
- Implemented interactive camera controls (pinch-to-zoom, tap-to-focus, double-tap toggle)
- Integrated OpenAI Vision API for AI image analysis
- Created EvidenceViewer with gesture-based zoom/pan for photos
- Added expo-video for video playback in evidence viewer
- Implemented evidence type filtering with counts in CaseDetailScreen
- Added PDF report generation with expo-print and expo-sharing
- Enhanced EvidenceCard with video thumbnails, AI analysis badges, and type-specific colors
