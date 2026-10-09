import type { ImageAsset } from "./types";

export const RENDITIONS = [480, 828, 1170] as const;

/** Bundled images start with "/", anything else is a key in the public 'shop' bucket. */
export function base(key: string) {
  return key.startsWith("/") ? key : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/shop/${key}`;
}

/** Every uploaded photo exists at three widths: `${key}-480.webp` … `-1170.webp`. */
export function srcSet(img: ImageAsset) {
  return RENDITIONS.filter((w) => w <= Math.max(img.width, RENDITIONS[0])).map((w) => `${base(img.key)}-${w}.webp ${w}w`).join(", ");
}
export function src(img: ImageAsset, w: (typeof RENDITIONS)[number] = 828) {
  const ok = RENDITIONS.filter((r) => r <= Math.max(img.width, RENDITIONS[0]));
  return `${base(img.key)}-${ok.includes(w) ? w : ok[ok.length - 1]}.webp`;
}
