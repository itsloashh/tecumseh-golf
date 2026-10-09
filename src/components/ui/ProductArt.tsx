/**
 * Stand-in artwork for products that don't have a photo yet: one bold illustration per category
 * on a brand-coloured tile. Real photos uploaded in /admin replace it automatically.
 */
const PALETTES = [
  { bg: "#d9e7d6", fg: "#03632f", ac: "#f2c230", dim: "rgba(3,99,47,0.09)" },
  { bg: "#e8e0cc", fg: "#0d3b24", ac: "#03632f", dim: "rgba(13,59,36,0.08)" },
  { bg: "#0d3b24", fg: "#f4efe3", ac: "#f2c230", dim: "rgba(0,0,0,0.22)" },
  { bg: "#f2c230", fg: "#0d3b24", ac: "#fbf9f3", dim: "rgba(13,59,36,0.1)" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ProductArt({ category, seed, className }: { category: string | null; seed: string; className?: string }) {
  const p = PALETTES[hash(seed) % PALETTES.length];
  const id = `d${hash(seed) % 100000}`;
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="" className={className} style={{ width: "100%", height: "100%", display: "block", background: p.bg }}>
      <defs>
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2.4" fill={p.dim} />
          <circle cx="10.5" cy="10.5" r="2.4" fill={p.dim} />
        </pattern>
      </defs>
      <rect width="200" height="200" fill={`url(#${id})`} />
      <g transform="translate(100 104)">{art(category, p)}</g>
    </svg>
  );
}

type Pal = (typeof PALETTES)[number];

function art(category: string | null, { fg, ac, bg }: Pal) {
  switch (category) {
    case "balls":
      return (
        <g>
          <path d="M-6 30 L6 30 L3 58 L-3 58 Z" fill={ac} />
          <circle r="34" cy="-6" fill={bg === "#f4efe3" ? "#fff" : "#fffdf7"} stroke={fg} strokeWidth="4" />
          {[...Array(19)].map((_, i) => {
            const a = (i / 19) * Math.PI * 2, r = i % 2 ? 22 : 12;
            return <circle key={i} cx={+(Math.cos(a) * r).toFixed(2)} cy={+(-6 + Math.sin(a) * r).toFixed(2)} r="3.2" fill={fg} opacity="0.18" />;
          })}
          <circle cx="0" cy="-6" r="3.2" fill={fg} opacity="0.18" />
        </g>
      );
    case "putters":
      return (
        <g transform="rotate(-18)">
          <rect x="-3.5" y="-78" width="7" height="104" rx="3.5" fill={fg} />
          <rect x="-5.5" y="-82" width="11" height="30" rx="4" fill={ac} />
          <path d="M-4 22 H40 a8 8 0 0 1 8 8 v10 a6 6 0 0 1 -6 6 H-30 a6 6 0 0 1 -6 -6 v-8 a10 10 0 0 1 10 -10 Z" fill={fg} />
          <rect x="-20" y="30" width="44" height="3.5" rx="1.75" fill={ac} />
        </g>
      );
    case "bags":
      return (
        <g>
          <rect x="-26" y="-50" width="52" height="102" rx="14" fill={fg} />
          <rect x="-26" y="-50" width="52" height="16" rx="8" fill={ac} />
          <rect x="-16" y="-14" width="32" height="40" rx="6" fill={ac} opacity="0.9" />
          <path d="M26 -30 C 52 -20, 52 30, 26 40" stroke={ac} strokeWidth="5" fill="none" />
          <path d="M-18 -50 L-24 -74 M-4 -50 L-2 -78 M12 -50 L20 -72" stroke={fg} strokeWidth="6" strokeLinecap="round" />
          <path d="M-22 52 L-34 68 M22 52 L34 68" stroke={fg} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case "gloves":
      return (
        <g>
          <path d="M-30 50 V-6 a7 7 0 0 1 14 0 V-40 a7 7 0 0 1 14 0 V-48 a7 7 0 0 1 14 0 V-42 a7 7 0 0 1 14 0 V-20 a7 7 0 0 1 14 -4 L 34 16 C 30 36, 22 50, 12 54 Z" fill={fg} />
          <rect x="-32" y="40" width="48" height="14" rx="4" fill={ac} />
          <circle cx="-8" cy="47" r="3" fill={fg} />
        </g>
      );
    case "apparel":
      return (
        <g>
          <path d="M-22 -50 L-50 -38 L-58 -6 L-38 0 L-36 54 H36 L38 0 L58 -6 L50 -38 L22 -50 C 16 -38, -16 -38, -22 -50 Z" fill={fg} />
          <path d="M-22 -50 L0 -30 L22 -50 C 16 -38 -16 -38 -22 -50Z" fill={ac} />
          <path d="M0 -30 V-8" stroke={ac} strokeWidth="3" />
          <circle cx="0" cy="-20" r="2.5" fill={ac} />
          <circle cx="-22" cy="-14" r="6" fill={ac} />
        </g>
      );
    case "accessories":
      return (
        <g>
          <path d="M-8 -60 V52" stroke={fg} strokeWidth="5" strokeLinecap="round" />
          <path d="M-6 -60 L40 -46 L-6 -32 Z" fill={ac} />
          <ellipse cx="-8" cy="54" rx="34" ry="8" fill={fg} opacity="0.25" />
          <path d="M22 18 L30 18 L28 46 L24 46 Z" fill={fg} />
          <circle cx="26" cy="9" r="10" fill="#fffdf7" stroke={fg} strokeWidth="3" />
        </g>
      );
    case "clubs":
    default:
      return (
        <g transform="rotate(24)">
          <rect x="-3" y="-86" width="6" height="104" rx="3" fill={fg} />
          <rect x="-5" y="-90" width="10" height="34" rx="4" fill={ac} />
          <path d="M-2 14 C 22 8, 50 16, 52 34 C 54 50, 30 56, 4 50 C -12 46, -14 22, -2 14 Z" fill={fg} />
          <path d="M8 26 C 24 24, 40 28, 42 36" stroke={ac} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}
