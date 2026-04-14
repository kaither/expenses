import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, type PaletteMode } from "@mui/material";
import App from "./App";
import { buildTheme, getInitialMode, persistMode } from "./theme";

function Root() {
  const [mode, setMode] = useState<PaletteMode>(() => getInitialMode());
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const toggleMode = () => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      persistMode(next);
      return next;
    });
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App mode={mode} onToggleMode={toggleMode} />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
