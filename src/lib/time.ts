/** "5m ago", "3h ago", "Oct 2" — safe on server and client. */
export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 14 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};
