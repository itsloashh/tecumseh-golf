/**
 * Browser-side photo prep for uploads (same approach as LOASH): resize to three WebP widths,
 * make a blur placeholder. Big phone photos never pass through a server function.
 */
export const WIDTHS = [480, 828, 1170] as const;

export interface ProcessedImage {
  width: number;
  height: number;
  blur: string;
  previewUrl: string;
  renditions: { width: number; blob: Blob }[];
}

const toBlob = (c: HTMLCanvasElement, q = 0.85) =>
  new Promise<Blob>((res, rej) =>
    c.toBlob((b) => {
      if (b && b.type === "image/webp") return res(b);
      c.toBlob((j) => (j ? res(j) : rej(new Error("Couldn't encode image"))), "image/jpeg", q); // older Safari
    }, "image/webp", q),
  );

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This photo format can't be read here. Try a JPG or PNG.");
  }
  const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * scale), H = Math.round(bmp.height * scale);
  const work = document.createElement("canvas");
  work.width = W; work.height = H;
  work.getContext("2d")!.drawImage(bmp, 0, 0, W, H);

  const renditions: { width: number; blob: Blob }[] = [];
  for (const target of WIDTHS) {
    const w = Math.min(target, W), h = Math.round((H * w) / W);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(work, 0, 0, w, h);
    renditions.push({ width: target, blob: await toBlob(c) });
  }
  const tiny = document.createElement("canvas");
  tiny.width = 16; tiny.height = Math.max(1, Math.round((H * 16) / W));
  tiny.getContext("2d")!.drawImage(work, 0, 0, tiny.width, tiny.height);

  const finalW = Math.min(1170, W);
  return {
    width: finalW,
    height: Math.round((H * finalW) / W),
    blur: tiny.toDataURL("image/jpeg", 0.5),
    previewUrl: URL.createObjectURL(renditions[renditions.length - 1].blob),
    renditions,
  };
}

type Slots = { ok: true; data?: { key: string; slots: { width: number; path: string; token: string }[] } } | { ok: false; error: string };

/** Uploads the renditions through one-time signed URLs issued by a server action. */
export async function uploadProcessed(img: ProcessedImage, createSlots: (widths: number[]) => Promise<Slots>): Promise<string> {
  const res = await createSlots(img.renditions.map((r) => r.width));
  if (!res.ok || !res.data) throw new Error(res.ok ? "Upload failed." : res.error);
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  await Promise.all(
    res.data.slots.map(async (slot) => {
      const r = img.renditions.find((x) => x.width === slot.width)!;
      const { error } = await sb.storage.from("shop").uploadToSignedUrl(slot.path, slot.token, r.blob, { contentType: r.blob.type, cacheControl: "31536000" });
      if (error) throw new Error(`Upload failed: ${error.message}`);
    }),
  );
  return res.data.key;
}
