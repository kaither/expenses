export type Transaction = {
  id: string;
  date: string;
  location: string;
  amount: number;
};

export const CATEGORIES = [
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
] as const;
export type Category = (typeof CATEGORIES)[number];

export type MiscMapEntry = { condensed: string; match: string };

export type Mappings = {
  Groceries: string[];
  Leisure: string[];
  Bills: string[];
  Gas: string[];
  Childcare: string[];
  "Credit Card Payments": string[];
  "Auto Save Transfer": string[];
  Savings: string[];
  MiscMap: MiscMapEntry[];
};

export type ClassificationSource = "rule" | "file" | "learned" | "llm" | "unmapped";
export type CategorizedTransaction = Transaction & {
  category: Category;
  source: ClassificationSource;
};
export type LearnedMap = Record<string, Category>;
