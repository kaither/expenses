import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  Alert,
  Chip,
  type PaletteMode,
} from "@mui/material";
import { UploadDropzone } from "./components/UploadDropzone";
import { CategoryOverview } from "./components/CategoryOverview";
import { CategoryTable } from "./components/CategoryTable";
import { AdviceCard } from "./components/AdviceCard";
import { ReviewTable, type ReviewRow } from "./components/ReviewTable";
import { parseFirstbankCsv } from "./lib/parseCsv";
import { categorize, summarize } from "./lib/categorize";
import { loadLearned, loadMappings } from "./lib/mappings";
import {
  CATEGORIES,
  type CategorizedTransaction,
  type Category,
  type LearnedMap,
  type Mappings,
  type Transaction,
} from "./lib/types";

type AppProps = { mode: PaletteMode; onToggleMode: () => void };

export default function App({ mode, onToggleMode }: AppProps) {
  const [mappings, setMappings] = useState<Mappings | null>(null);
  const [learned, setLearned] = useState<LearnedMap>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedTxs, setParsedTxs] = useState<Transaction[] | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    Promise.all([loadMappings(), loadLearned().catch(() => ({}))])
      .then(([m, l]) => {
        setMappings(m);
        setLearned(l as LearnedMap);
      })
      .catch((e) => setLoadError(String(e?.message || e)));
  }, []);

  const { allClassified, reviewRows } = useMemo(() => {
    if (!mappings || !parsedTxs) {
      return { allClassified: null as CategorizedTransaction[] | null, reviewRows: [] as ReviewRow[] };
    }
    const { classified, unresolved } = categorize(parsedTxs, mappings, learned);
    const unmapped: CategorizedTransaction[] = unresolved.map((tx) => ({
      id: tx.id,
      date: tx.date,
      location: tx.location,
      amount: tx.amount,
      category: "Miscellaneous",
      source: "unmapped",
    }));
    const review: ReviewRow[] = unresolved.map((tx) => ({
      id: tx.id,
      date: tx.date,
      location: tx.location,
      amount: tx.amount,
      merchantKey: tx.merchantKey,
    }));
    return { allClassified: [...classified, ...unmapped], reviewRows: review };
  }, [parsedTxs, mappings, learned]);

  const summary = useMemo(() => {
    if (!allClassified || !mappings) return null;
    return summarize(allClassified, mappings.MiscMap);
  }, [allClassified, mappings]);

  async function handleFile(text: string, name: string) {
    setFileName(name);
    setSaveError(null);
    setTab(0);
    setParsedTxs(parseFirstbankCsv(text));
  }

  async function handleSaveMappings(keyToCategory: Record<string, Category>) {
    setSaveError(null);
    try {
      const res = await fetch("/api/learned", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(keyToCategory),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLearned((prev) => ({ ...prev, ...keyToCategory }));
    } catch (e: any) {
      setSaveError(e?.message || String(e));
      throw e;
    }
  }

  const showReview = reviewRows.length > 0;
  const tabs: (Category | "Overview" | "Review")[] = [
    "Overview",
    ...CATEGORIES,
    ...(showReview ? (["Review"] as const) : []),
  ];

  useEffect(() => {
    if (tab >= tabs.length) setTab(0);
  }, [tabs.length, tab]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, letterSpacing: -0.3 }}>
            Expenses
          </Typography>
          {fileName && (
            <Chip
              size="small"
              label={fileName}
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}
          <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
            <IconButton onClick={onToggleMode} size="small" aria-label="toggle theme">
              <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>
                {mode === "dark" ? "☀" : "☾"}
              </Box>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
        {saveError && <Alert severity="warning" sx={{ mb: 2 }}>Save failed: {saveError}</Alert>}

        {!parsedTxs && (
          <Box sx={{ maxWidth: 640, mx: "auto", mt: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: -0.5 }}>
              Expense breakdown
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Drop a Firstbank statement to see how your money was spent across categories.
            </Typography>
            <UploadDropzone onFile={handleFile} />
          </Box>
        )}

        {parsedTxs && summary && (
          <>
            <Box sx={{ mb: 3 }}>
              <UploadDropzone onFile={handleFile} compact />
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {tabs.map((t) => (
                  <Tab
                    key={t}
                    label={
                      t === "Overview"
                        ? "Overview"
                        : t === "Review"
                          ? `Review · ${reviewRows.length}`
                          : `${t} · $${summary.totals[t as Category].toFixed(0)}`
                    }
                  />
                ))}
              </Tabs>
            </Box>
            {tabs[tab] === "Overview" ? (
              <CategoryOverview totals={summary.totals} />
            ) : tabs[tab] === "Review" ? (
              <ReviewTable rows={reviewRows} onSave={handleSaveMappings} />
            ) : (
              (() => {
                const cat = tabs[tab] as Category;
                return (
                  <>
                    <AdviceCard
                      category={cat}
                      total={summary.totals[cat]}
                      topVendors={summary.topVendors[cat]}
                    />
                    <CategoryTable rows={summary.byCategory[cat]} />
                  </>
                );
              })()
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
