import {
  CATEGORIES,
  type Category,
  type CategorizedTransaction,
  type ClassificationSource,
  type LearnedMap,
  type Mappings,
  type Transaction,
} from "./types";

function matchesAny(location: string, vendors: string[]): boolean {
  for (const v of vendors) {
    if (!v) continue;
    if (location.includes(v)) return true;
  }
  return false;
}

function isAllowance(tx: Transaction): boolean {
  return tx.location.includes("TRANSFER") && tx.amount === 100;
}

function fileMatch(location: string, mappings: Mappings): Category | null {
  // Auto Save Transfer checked first: its vendor string is "AUTO SAVE TRANSFER"
  // which would also match the hardcoded Allowance rule ($100 TRANSFER) otherwise.
  if (matchesAny(location, mappings["Auto Save Transfer"])) return "Auto Save Transfer";
  if (matchesAny(location, mappings.Baby)) return "Baby";
  if (matchesAny(location, mappings.Bills)) return "Bills";
  if (matchesAny(location, mappings.Groceries)) return "Groceries";
  if (matchesAny(location, mappings.Leisure)) return "Leisure";
  if (matchesAny(location, mappings.Gas)) return "Gas";
  return null;
}

// Port of FileUtilities.condenseLocation — canonical merchant-key function.
export function condenseLocation(
  location: string,
  miscMap: Mappings["MiscMap"],
): string {
  const lower = location.toLowerCase();
  for (const { condensed, match } of miscMap) {
    if (lower.includes(match.toLowerCase())) return condensed;
  }
  const cleaned = lower.replace(/visa/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) return `${parts[0]} ${parts[1]} ${parts[2]}`;
  return cleaned;
}

export type CategorizeResult = {
  classified: CategorizedTransaction[];
  unresolved: Array<Transaction & { merchantKey: string }>;
  unresolvedMerchants: string[];
};

// Phase 1-3: rule -> file -> learned cache. Anything still unresolved is
// returned separately for the LLM phase orchestrated by the caller.
export function categorize(
  txs: Transaction[],
  mappings: Mappings,
  learned: LearnedMap,
): CategorizeResult {
  const classified: CategorizedTransaction[] = [];
  const unresolved: Array<Transaction & { merchantKey: string }> = [];
  const unresolvedSet = new Set<string>();

  for (const tx of txs) {
    // File rules run first so "AUTO SAVE TRANSFER" beats the $100 Allowance rule.
    const file = fileMatch(tx.location, mappings);
    if (file) {
      classified.push({ ...tx, category: file, source: "file" });
      continue;
    }
    if (isAllowance(tx)) {
      classified.push({ ...tx, category: "Allowance", source: "rule" });
      continue;
    }
    const key = condenseLocation(tx.location, mappings.MiscMap);
    const fromLearned = learned[key];
    if (fromLearned) {
      classified.push({ ...tx, category: fromLearned, source: "learned" });
      continue;
    }
    unresolved.push({ ...tx, merchantKey: key });
    unresolvedSet.add(key);
  }

  return {
    classified,
    unresolved,
    unresolvedMerchants: [...unresolvedSet],
  };
}

export function applyLlmClassifications(
  unresolved: Array<Transaction & { merchantKey: string }>,
  classifications: Record<string, Category>,
  source: ClassificationSource = "llm",
): CategorizedTransaction[] {
  return unresolved.map((tx) => ({
    id: tx.id,
    date: tx.date,
    location: tx.location,
    amount: tx.amount,
    category: classifications[tx.merchantKey] ?? "Miscellaneous",
    source,
  }));
}

export function summarize(
  txs: CategorizedTransaction[],
  miscMap: Mappings["MiscMap"],
) {
  const totals = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0]),
  ) as Record<Category, number>;
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as CategorizedTransaction[]]),
  ) as Record<Category, CategorizedTransaction[]>;
  for (const tx of txs) {
    totals[tx.category] += tx.amount;
    byCategory[tx.category].push(tx);
  }

  const topVendors = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as { name: string; amount: number }[]]),
  ) as Record<Category, { name: string; amount: number }[]>;
  for (const cat of Object.keys(byCategory) as Category[]) {
    const agg = new Map<string, number>();
    for (const tx of byCategory[cat]) {
      const name =
        cat === "Miscellaneous"
          ? condenseLocation(tx.location, miscMap)
          : tx.location;
      agg.set(name, (agg.get(name) || 0) + tx.amount);
    }
    topVendors[cat] = [...agg.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount }));
  }

  return { totals, byCategory, topVendors };
}
