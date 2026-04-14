import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3001;
const MAPPINGS_DIR =
  process.env.MAPPINGS_DIR ||
  "C:\\Users\\kaith\\Documents\\expenses\\eclipse-workspace\\Expenses\\src";
const LEARNED_PATH = path.join(__dirname, "learned-mappings.json");
const CATEGORIES = [
  "Allowance",
  "Savings",
  "Auto Save Transfer",
  "Childcare",
  "Credit Card Payments",
  "Bills",
  "Groceries",
  "Leisure",
  "Gas",
  "Miscellaneous",
];

const CATEGORY_FILES = {
  Groceries: "GroceryExpenses.txt",
  Leisure: "LeisureExpenses.txt",
  Bills: "BillsExpenses.txt",
  Gas: "GasExpenses.txt",
  Childcare: "ChildcareExpenses.txt",
  "Credit Card Payments": "CreditCardPaymentsExpenses.txt",
  "Auto Save Transfer": "AutoSaveTransferExpenses.txt",
  Savings: "SavingsExpenses.txt",
};
const MISC_MAP_FILE = "MiscTxLocationMap.txt";

async function readLines(file) {
  const text = await fs.readFile(file, "utf8");
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/mappings", async (_req, res) => {
  try {
    const out = {};
    for (const [cat, file] of Object.entries(CATEGORY_FILES)) {
      out[cat] = await readLines(path.join(MAPPINGS_DIR, file));
    }
    const miscRaw = await readLines(path.join(MAPPINGS_DIR, MISC_MAP_FILE));
    out.MiscMap = miscRaw
      .map((line) => {
        const [condensed, ...rest] = line.split("=");
        return { condensed, match: rest.join("=") };
      })
      .filter((m) => m.condensed && m.match);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

async function readLearned() {
  try {
    const text = await fs.readFile(LEARNED_PATH, "utf8");
    const obj = JSON.parse(text);
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    if (e.code === "ENOENT") return {};
    throw e;
  }
}

async function writeLearned(map) {
  const tmp = LEARNED_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(map, null, 2), "utf8");
  await fs.rename(tmp, LEARNED_PATH);
}

app.put("/api/learned", async (req, res) => {
  try {
    const incoming = req.body && typeof req.body === "object" ? req.body : {};
    const clean = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (typeof k === "string" && typeof v === "string" && CATEGORIES.includes(v)) {
        clean[k] = v;
      }
    }
    const current = await readLearned();
    const merged = { ...current, ...clean };
    await writeLearned(merged);
    res.json({ saved: Object.keys(clean).length, total: Object.keys(merged).length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/learned", async (_req, res) => {
  try {
    res.json(await readLearned());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const CLASSIFY_SYSTEM = `You are an expense classifier. Given merchant name strings from credit-card statements, assign each to exactly one of these categories: ${CATEGORIES.join(", ")}. Use "Miscellaneous" ONLY when no other category fits. Return a single JSON object mapping each input merchant string (verbatim) to one category — no preamble, no code fences, no extra keys.`;

app.post("/api/classify", async (req, res) => {
  if (!client) return res.status(503).json({ error: "ANTHROPIC_API_KEY not set" });
  const merchants = Array.isArray(req.body?.merchants) ? req.body.merchants : [];
  if (merchants.length === 0) return res.json({ classifications: {} });
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: [
        { type: "text", text: CLASSIFY_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content: `Classify each of these merchants. Return ONLY a JSON object.\n\n${JSON.stringify(merchants, null, 2)}`,
        },
      ],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    let parsed = {};
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { parsed = {}; }
    }
    const classifications = {};
    for (const m of merchants) {
      const c = parsed[m];
      classifications[m] = CATEGORIES.includes(c) ? c : "Miscellaneous";
    }
    const learned = await readLearned();
    const merged = { ...learned, ...classifications };
    await writeLearned(merged);
    res.json({ classifications });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const SYSTEM_PROMPT = `You are a pragmatic personal-finance advisor. Given a single spending category, its total for the period, and the top vendors the user spent at, return 3-5 concrete, category-specific suggestions to reduce or optimize spending. Be specific (name vendors, cite amounts), avoid generic platitudes, and keep each tip to one or two sentences. Return a JSON array of strings only, no preamble.`;

app.post("/api/advice", async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not set" });
  }
  const { category, total, topVendors, monthLabel } = req.body || {};
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Category: ${category}
Period: ${monthLabel || "recent statement"}
Total spent: $${Number(total).toFixed(2)}
Top vendors:
${(topVendors || [])
  .map((v) => `- ${v.name}: $${Number(v.amount).toFixed(2)}`)
  .join("\n")}

Return ONLY a JSON array of 3-5 tip strings.`,
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    let tips = [];
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        tips = JSON.parse(match[0]);
      } catch {
        tips = [text];
      }
    } else {
      tips = [text];
    }
    res.json({ tips });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] mappings dir: ${MAPPINGS_DIR}`);
  if (!client) console.warn("[api] ANTHROPIC_API_KEY not set — /api/advice disabled");
});
