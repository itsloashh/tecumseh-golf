/** Builder's credit in the footer — links to loparo.ca. */
export function LoparoSignature() {
  return (
    <a
      href="https://www.loparo.ca"
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2.5 rounded-full border border-cream/15 py-1 pl-1 pr-3.5 text-cream/60 transition-colors hover:border-flag/60 hover:text-cream"
      aria-label="Website by Loparo"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <circle cx="12" cy="12" r="11.25" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="0.8 1.2" />
        <text x="12" y="15.6" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="10" fontStyle="italic" fill="currentColor">LP</text>
      </svg>
      <span className="text-[11.5px]">
        A product of{" "}
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-cream/85 transition-colors group-hover:text-flag">Loparo</span>
      </span>
    </a>
  );
}
