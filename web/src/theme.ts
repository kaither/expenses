import { createTheme, type PaletteMode, type Theme } from "@mui/material";

export function buildTheme(mode: PaletteMode): Theme {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#8ab4ff" : "#1f6feb" },
      secondary: { main: isDark ? "#d2a8ff" : "#7c3aed" },
      success: { main: isDark ? "#56d364" : "#1a7f37" },
      warning: { main: isDark ? "#e3b341" : "#9a6700" },
      error: { main: isDark ? "#ff7b72" : "#cf222e" },
      background: {
        default: isDark ? "#0d1117" : "#f6f8fa",
        paper: isDark ? "#161b22" : "#ffffff",
      },
      divider: isDark ? "rgba(240,246,252,0.12)" : "rgba(27,31,36,0.10)",
      text: {
        primary: isDark ? "#e6edf3" : "#1f2328",
        secondary: isDark ? "#8b949e" : "#656d76",
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Inter", Roboto, Helvetica, Arial, sans-serif',
      h6: { fontWeight: 600, letterSpacing: -0.2 },
      subtitle1: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 500 },
    },
    components: {
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: ({ theme }) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
            backdropFilter: "saturate(180%) blur(8px)",
            backgroundColor: isDark
              ? "rgba(13,17,23,0.72)"
              : "rgba(255,255,255,0.72)",
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiCard: {
        defaultProps: { variant: "outlined" },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: 3 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 500, minHeight: 44 },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 10,
            "--DataGrid-rowBorderColor": theme.palette.divider,
          }),
          columnHeaders: ({ theme }) => ({
            backgroundColor: isDark ? "#0d1117" : "#f6f8fa",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
          cell: { borderBottom: "none" },
        },
      },
    },
  });
}

const KEY = "expenses.themeMode";

export function getInitialMode(): PaletteMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function persistMode(mode: PaletteMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}
