const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
/** 4999 → "$49.99" */
export const money = (cents: number) => fmt.format(cents / 100);
/** "49.99" | "$49" → 4999 (null if not a price) */
export function parseMoney(s: string): number | null {
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  if (!String(s).trim() || !Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
export const centsToInput = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2));
