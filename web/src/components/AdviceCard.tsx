import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import type { Category } from "../lib/types";

type Props = {
  category: Category;
  total: number;
  topVendors: { name: string; amount: number }[];
  monthLabel?: string;
  auto?: boolean;
};

export function AdviceCard({
  category,
  total,
  topVendors,
  monthLabel,
  auto = false,
}: Props) {
  const [tips, setTips] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAdvice() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, total, topVendors, monthLabel }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTips(data.tips || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auto && tips === null && !loading) fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, category]);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span role="img" aria-label="tip">💡</span> Spending advice · {category}
        </Typography>
        {total === 0 && (
          <Typography variant="body2" color="text.secondary">
            No spending in this category.
          </Typography>
        )}
        {total > 0 && tips === null && !loading && !error && (
          <Button size="small" onClick={fetchAdvice} sx={{ mt: 1 }}>
            Get advice
          </Button>
        )}
        {loading && <CircularProgress size={20} sx={{ mt: 1 }} />}
        {error && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        {tips && tips.length > 0 && (
          <List dense>
            {tips.map((t, i) => (
              <ListItem key={i} alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 32 }}>•</ListItemIcon>
                <ListItemText primary={t} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
