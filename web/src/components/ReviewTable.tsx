import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { CATEGORIES, type Category } from "../lib/types";

export type ReviewRow = {
  id: string;
  date: string;
  location: string;
  amount: number;
  merchantKey: string;
};

type Props = {
  rows: ReviewRow[];
  onSave: (keyToCategory: Record<string, Category>) => Promise<void> | void;
};

// Pickable categories — exclude Allowance (that's a hardcoded rule, not a learnable mapping).
const PICK_CATEGORIES = CATEGORIES.filter((c) => c !== "Allowance") as Exclude<
  Category,
  "Allowance"
>[];

export function ReviewTable({ rows, onSave }: Props) {
  // edits are keyed by merchantKey so editing one row moves every row sharing
  // that merchant to the same target category.
  const [edits, setEdits] = useState<Record<string, Category>>({});
  const [selection, setSelection] = useState<GridRowSelectionModel>([]);
  const [bulkCategory, setBulkCategory] = useState<Category>("Miscellaneous");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const pendingCount = Object.keys(edits).length;

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.location.toLowerCase().includes(q) ||
        r.merchantKey.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.amount.toFixed(2).includes(q),
    );
  }, [rows, filter]);

  const columns = useMemo<GridColDef<ReviewRow>[]>(
    () => [
      { field: "date", headerName: "Date", width: 110 },
      { field: "location", headerName: "Location", flex: 1, minWidth: 220 },
      { field: "merchantKey", headerName: "Merchant (condensed)", width: 200 },
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        type: "number",
        valueFormatter: (v: number) =>
          v == null ? "" : `$${v.toFixed(2)}`,
      },
      {
        field: "assign",
        headerName: "Assign to",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const key = params.row.merchantKey;
          const value = edits[key] ?? "";
          return (
            <Select
              size="small"
              value={value}
              displayEmpty
              onChange={(e) => {
                const v = e.target.value as Category;
                setEdits((prev) => ({ ...prev, [key]: v }));
              }}
              sx={{ width: "100%" }}
            >
              <MenuItem value="">
                <em>— unmapped —</em>
              </MenuItem>
              {PICK_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          );
        },
      },
    ],
    [edits],
  );

  function applyBulk() {
    if (selection.length === 0) return;
    const selectedKeys = new Set(
      rows
        .filter((r) => selection.includes(r.id))
        .map((r) => r.merchantKey),
    );
    setEdits((prev) => {
      const next = { ...prev };
      for (const k of selectedKeys) next[k] = bulkCategory;
      return next;
    });
  }

  async function handleSave() {
    if (pendingCount === 0) return;
    setSaving(true);
    try {
      await onSave(edits);
      setEdits({});
      setSelection([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {rows.length} row{rows.length === 1 ? "" : "s"}
          {filter && ` · ${filteredRows.length} shown`}
          {pendingCount > 0 && ` · ${pendingCount} merchant${pendingCount === 1 ? "" : "s"} pending`}
        </Typography>
        <TextField
          size="small"
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ width: 220 }}
        />
        <Select
          size="small"
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value as Category)}
        >
          {PICK_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
        <Button
          size="small"
          variant="outlined"
          onClick={applyBulk}
          disabled={selection.length === 0}
        >
          Move selected ({selection.length}) to {bulkCategory}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={pendingCount === 0 || saving}
        >
          {saving ? "Saving…" : `Save ${pendingCount} mapping${pendingCount === 1 ? "" : "s"}`}
        </Button>
      </Stack>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        density="compact"
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selection}
        onRowSelectionModelChange={setSelection}
        initialState={{
          sorting: { sortModel: [{ field: "amount", sort: "desc" }] },
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
}
