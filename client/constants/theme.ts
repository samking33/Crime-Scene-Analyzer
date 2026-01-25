import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#E8EAED",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    textDisabled: "#4B5563",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#2FA4B9",
    link: "#2FA4B9",
    backgroundRoot: "#0F1A24",
    backgroundDefault: "#1C1F24",
    backgroundSecondary: "#1C1F24",
    backgroundTertiary: "#2A3544",
    backgroundElevated: "#2C3E50",
    primary: "#2FA4B9",
    primaryVariant: "#26899B",
    accent: "#D9A441",
    success: "#10B981",
    warning: "#D9A441",
    error: "#C0392B",
    critical: "#C0392B",
    info: "#2FA4B9",
    neutral: "#6B7280",
    border: "#374151",
    borderMedium: "#4B5563",
    borderHeavy: "#6B7280",
    borderAccent: "rgba(47, 164, 185, 0.3)",
    overlay: "rgba(0, 0, 0, 0.6)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    overlayHeavy: "rgba(0, 0, 0, 0.8)",
  },
  dark: {
    text: "#E8EAED",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    textDisabled: "#4B5563",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#2FA4B9",
    link: "#2FA4B9",
    backgroundRoot: "#0F1A24",
    backgroundDefault: "#1C1F24",
    backgroundSecondary: "#1C1F24",
    backgroundTertiary: "#2A3544",
    backgroundElevated: "#2C3E50",
    primary: "#2FA4B9",
    primaryVariant: "#26899B",
    accent: "#D9A441",
    success: "#10B981",
    warning: "#D9A441",
    error: "#C0392B",
    critical: "#C0392B",
    info: "#2FA4B9",
    neutral: "#6B7280",
    border: "#374151",
    borderMedium: "#4B5563",
    borderHeavy: "#6B7280",
    borderAccent: "rgba(47, 164, 185, 0.3)",
    overlay: "rgba(0, 0, 0, 0.6)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    overlayHeavy: "rgba(0, 0, 0, 0.8)",
  },
};

export const ForensicColors = {
  navy: "#0F1A24",
  charcoal: "#1C1F24",
  steel: "#2C3E50",
  cyan: "#2FA4B9",
  amber: "#D9A441",
  statusRed: "#C0392B",
  muted: "#2A3544",
};

export const EvidenceColors = {
  weapons: "#C0392B",
  vehicles: "#D9A441",
  persons: "#2FA4B9",
  biometrics: "#8B5CF6",
  drugs: "#EF4444",
  documents: "#10B981",
  electronics: "#06B6D4",
  markers: "#FBBF24",
  tools: "#78716C",
  other: "#6B7280",
};

export const GradientColors = {
  primary: ["#2FA4B9", "#26899B"],
  accent: ["#D9A441", "#C48A2F"],
  success: ["#10B981", "#059669"],
  warning: ["#D9A441", "#B8892F"],
  error: ["#C0392B", "#9B2C22"],
  recording: ["#C0392B", "#A82F24"],
};

export const Spacing = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 52,
  buttonHeight: 52,
  screenPadding: 16,
  cardPadding: 16,
  cardPaddingLarge: 24,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  labelBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
  captionUppercase: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "SF Mono",
  },
  default: {
    sans: "Inter",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "'SF Mono', 'Roboto Mono', Consolas, 'Liberation Mono', monospace",
  },
});

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  primaryGlow: {
    shadowColor: "#2FA4B9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingGlow: {
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const AnimationConfig = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
  },
  springFast: {
    damping: 20,
    stiffness: 200,
    mass: 0.3,
  },
  timing: {
    duration: 300,
  },
  timingFast: {
    duration: 200,
  },
};
