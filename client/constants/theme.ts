import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#B0BEC5",
    textTertiary: "#78909C",
    textDisabled: "#546E7A",
    buttonText: "#FFFFFF",
    tabIconDefault: "#78909C",
    tabIconSelected: "#2962FF",
    link: "#2962FF",
    backgroundRoot: "#0A0E14",
    backgroundDefault: "#151A23",
    backgroundSecondary: "#1E2530",
    backgroundTertiary: "#252D3D",
    backgroundElevated: "#2A3444",
    primary: "#2962FF",
    primaryVariant: "#1E88E5",
    accent: "#00B0FF",
    success: "#43A047",
    warning: "#FB8C00",
    error: "#E53935",
    critical: "#E53935",
    info: "#1E88E5",
    neutral: "#78909C",
    border: "rgba(255, 255, 255, 0.08)",
    borderMedium: "rgba(255, 255, 255, 0.12)",
    borderHeavy: "rgba(255, 255, 255, 0.20)",
    borderAccent: "rgba(41, 98, 255, 0.3)",
    overlay: "rgba(0, 0, 0, 0.6)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    overlayHeavy: "rgba(0, 0, 0, 0.8)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B0BEC5",
    textTertiary: "#78909C",
    textDisabled: "#546E7A",
    buttonText: "#FFFFFF",
    tabIconDefault: "#78909C",
    tabIconSelected: "#2962FF",
    link: "#2962FF",
    backgroundRoot: "#0A0E14",
    backgroundDefault: "#151A23",
    backgroundSecondary: "#1E2530",
    backgroundTertiary: "#252D3D",
    backgroundElevated: "#2A3444",
    primary: "#2962FF",
    primaryVariant: "#1E88E5",
    accent: "#00B0FF",
    success: "#43A047",
    warning: "#FB8C00",
    error: "#E53935",
    critical: "#E53935",
    info: "#1E88E5",
    neutral: "#78909C",
    border: "rgba(255, 255, 255, 0.08)",
    borderMedium: "rgba(255, 255, 255, 0.12)",
    borderHeavy: "rgba(255, 255, 255, 0.20)",
    borderAccent: "rgba(41, 98, 255, 0.3)",
    overlay: "rgba(0, 0, 0, 0.6)",
    overlayLight: "rgba(0, 0, 0, 0.4)",
    overlayHeavy: "rgba(0, 0, 0, 0.8)",
  },
};

export const EvidenceColors = {
  weapons: "#FF3D00",
  vehicles: "#FF6F00",
  persons: "#2979FF",
  biometrics: "#AA00FF",
  drugs: "#D50000",
  documents: "#00C853",
  electronics: "#00BFA5",
  markers: "#FFD600",
  tools: "#6D4C41",
  other: "#546E7A",
};

export const GradientColors = {
  primary: ["#2962FF", "#1E88E5"],
  accent: ["#00B0FF", "#00E5FF"],
  success: ["#43A047", "#66BB6A"],
  warning: ["#FB8C00", "#FFB74D"],
  error: ["#E53935", "#EF5350"],
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
    shadowColor: "#2962FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
