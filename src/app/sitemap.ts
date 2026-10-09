import type { MetadataRoute } from "next";
import { getSnapshot } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getSnapshot();
  const pages = ["", "/shop", "/services", "/book", "/visit"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.8 : 1 }));
  return [...pages, ...products.map((p) => ({ url: `${SITE_URL}/shop/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }))];
}
