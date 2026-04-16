import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    textDisabled: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#8B5CF6",
    link: "#8B5CF6",
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    backgroundElevated: "#64748B",
    primary: "#8B5CF6",
    primaryVariant: "#7C3AED",
    accent: "#10B981",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    critical: "#DC2626",
    info: "#3B82F6",
    neutral: "#94A3B8",
    border: "rgba(248, 250, 252, 0.08)",
    borderMedium: "rgba(248, 250, 252, 0.12)",
    borderHeavy: "rgba(248, 250, 252, 0.20)",
    borderAccent: "rgba(139, 92, 246, 0.3)",
    overlay: "rgba(15, 23, 42, 0.7)",
    overlayLight: "rgba(15, 23, 42, 0.5)",
    overlayHeavy: "rgba(15, 23, 42, 0.9)",
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    textDisabled: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#8B5CF6",
    link: "#8B5CF6",
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    backgroundElevated: "#64748B",
    primary: "#8B5CF6",
    primaryVariant: "#7C3AED",
    accent: "#10B981",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    critical: "#DC2626",
    info: "#3B82F6",
    neutral: "#94A3B8",
    border: "rgba(248, 250, 252, 0.08)",
    borderMedium: "rgba(248, 250, 252, 0.12)",
    borderHeavy: "rgba(248, 250, 252, 0.20)",
    borderAccent: "rgba(139, 92, 246, 0.3)",
    overlay: "rgba(15, 23, 42, 0.7)",
    overlayLight: "rgba(15, 23, 42, 0.5)",
    overlayHeavy: "rgba(15, 23, 42, 0.9)",
  },
};

export const EvidenceColors = {
  weapons: "#EF4444",
  vehicles: "#F59E0B",
  persons: "#3B82F6",
  biometrics: "#A855F7",
  drugs: "#DC2626",
  documents: "#10B981",
  electronics: "#06B6D4",
  markers: "#EAB308",
  tools: "#78350F",
  other: "#64748B",
};

export const GradientColors = {
  primary: ["#8B5CF6", "#7C3AED"],
  accent: ["#10B981", "#059669"],
  success: ["#10B981", "#34D399"],
  warning: ["#F59E0B", "#FBBF24"],
  error: ["#EF4444", "#F87171"],
  purple: ["#8B5CF6", "#A78BFA"],
  emerald: ["#10B981", "#6EE7B7"],
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
  screenPadding: 20,
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
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 21,
    lineHeight: 28,
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  primaryGlow: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  accentGlow: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
