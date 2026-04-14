import { Card, CardContent, Grid, Typography, Box, useTheme } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CATEGORIES, type Category } from "../lib/types";

// Category-stable color palette; works in both light and dark mode.
const CATEGORY_COLORS: Record<Category, string> = {
  Allowance: "#8b949e",
  Savings: "#2ea043",
  "Auto Save Transfer": "#56d364",
  Childcare: "#f778ba",
  "Credit Card Payments": "#d2a8ff",
  Bills: "#ff7b72",
  Groceries: "#3fb950",
  Leisure: "#a5a5ff",
  Gas: "#e3b341",
  Miscellaneous: "#636e7b",
};

export function CategoryOverview({
  totals,
}: {
  totals: Record<Category, number>;
}) {
  const theme = useTheme();
  const grandTotal = CATEGORIES.reduce(
    (s, c) => (c === "Savings" ? s : s + totals[c]),
    0,
  );
  const data = CATEGORIES.filter((c) => c !== "Savings" && totals[c] > 0).map((c) => ({
    name: c,
    value: Number(totals[c].toFixed(2)),
  }));

  const savingsTotal = totals.Savings ?? 0;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                Total spend
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5, letterSpacing: -1 }}>
                ${grandTotal.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                across {data.length} categor{data.length === 1 ? "y" : "ies"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: CATEGORY_COLORS.Savings,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Savings
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5, letterSpacing: -1, color: CATEGORY_COLORS.Savings }}>
                ${savingsTotal.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                transferred to savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {CATEGORIES.filter((c) => c !== "Savings").map((cat) => {
          const amt = totals[cat];
          const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
          return (
            <Grid key={cat} item xs={6} sm={4} md={3}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: CATEGORY_COLORS[cat],
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {cat}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.4 }}>
                    ${amt.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pct.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Distribution
          </Typography>
          <Box sx={{ height: 340 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  innerRadius={64}
                  paddingAngle={2}
                  stroke={theme.palette.background.paper}
                  strokeWidth={2}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={CATEGORY_COLORS[d.name as Category]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `$${v.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    color: theme.palette.text.primary,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
