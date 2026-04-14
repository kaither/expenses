import type { Category } from "./types";

export async function classifyMerchants(
  merchants: string[],
): Promise<Record<string, Category>> {
  if (merchants.length === 0) return {};
  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ merchants }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`classify failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return (data.classifications || {}) as Record<string, Category>;
}
