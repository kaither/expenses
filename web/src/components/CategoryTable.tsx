import { useMemo, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box, Chip, TextField } from "@mui/material";
import type { CategorizedTransaction, ClassificationSource } from "../lib/types";

const SOURCE_COLOR: Record<
  ClassificationSource,
  "default" | "primary" | "success" | "secondary" | "warning"
> = {
  rule: "default",
  file: "success",
  learned: "primary",
  llm: "secondary",
  unmapped: "warning",
};

const columns: GridColDef<CategorizedTransaction>[] = [
  { field: "date", headerName: "Date", width: 110 },
  { field: "location", headerName: "Location", flex: 1, minWidth: 240 },
  {
    field: "amount",
    headerName: "Amount",
    width: 130,
    type: "number",
    valueFormatter: (v: number) => (v == null ? "" : `$${v.toFixed(2)}`),
  },
  {
    field: "source",
    headerName: "Source",
    width: 110,
    renderCell: (params) => {
      const s = params.value as ClassificationSource;
      return <Chip size="small" label={s} color={SOURCE_COLOR[s]} variant="outlined" />;
    },
  },
];

export function CategoryTable({ rows }: { rows: CategorizedTransaction[] }) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.location.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.amount.toFixed(2).includes(q),
    );
  }, [rows, filter]);
  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        size="small"
        placeholder="Filter by location, date, or amount…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
      />
      <DataGrid
        rows={filtered}
        columns={columns}
        density="compact"
        autoHeight
        initialState={{
          sorting: { sortModel: [{ field: "amount", sort: "desc" }] },
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
