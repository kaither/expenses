import Papa from "papaparse";
import type { Transaction } from "./types";

// Firstbank CSV: col 0 date (MM/dd/yy), col 1 location, col 2 card, col 3 amount.
// Only negative amounts (leading "-") are expenses. Strip the "-" and parse positive.
export function parseFirstbankCsv(text: string): Transaction[] {
  const parsed = Papa.parse<string[]>(text.replace(/"/g, " "), {
    skipEmptyLines: true,
  });
  const out: Transaction[] = [];
  let i = 0;
  for (const row of parsed.data) {
    if (!row || row.length < 4) continue;
    const date = (row[0] || "").trim();
    const location = (row[1] || "").trim();
    const amtRaw = (row[3] || "").trim();
    if (!amtRaw.includes("-")) continue;
    const amount = Number(amtRaw.replace("-", "").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amount) || amount === 0) continue;
    out.push({ id: `tx_${i++}`, date, location, amount });
  }
  return out;
}
