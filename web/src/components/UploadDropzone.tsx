import { useDropzone } from "react-dropzone";
import { Box, Paper, Typography, alpha, useTheme } from "@mui/material";

export function UploadDropzone({
  onFile,
  compact = false,
}: {
  onFile: (text: string, name: string) => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"], "text/plain": [".csv", ".txt"] },
    multiple: false,
    onDrop: async (files) => {
      const f = files[0];
      if (!f) return;
      const text = await f.text();
      onFile(text, f.name);
    },
  });

  return (
    <Paper
      variant="outlined"
      {...getRootProps()}
      sx={{
        p: compact ? 2 : 5,
        textAlign: "center",
        borderStyle: "dashed",
        borderWidth: 1.5,
        cursor: "pointer",
        transition: "background-color 120ms ease, border-color 120ms ease",
        borderColor: isDragActive
          ? theme.palette.primary.main
          : theme.palette.divider,
        bgcolor: isDragActive
          ? alpha(theme.palette.primary.main, 0.06)
          : "background.paper",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <input {...getInputProps()} />
      <Box>
        <Typography variant={compact ? "body2" : "subtitle1"} sx={{ fontWeight: 600 }}>
          {isDragActive
            ? "Drop the CSV here"
            : compact
              ? "Drop another CSV to replace, or click to browse"
              : "Drop a Firstbank CSV here, or click to browse"}
        </Typography>
        {!compact && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Expected columns: date, location, card, amount
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
