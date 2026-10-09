import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/data";
import { src } from "@/lib/images";
import { SITE_URL } from "@/lib/site";
import { ProductView } from "@/components/shop/ProductView";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { products } = await getSnapshot();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getSnapshot()).products.find((x) => x.slug === slug);
  if (!p) return { title: "Not found" };
  const desc = (p.description || `${p.name} at Tecumseh Golf`).slice(0, 160);
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: p.images[0] ? [{ url: src(p.images[0], 1170) }] : ["/og.jpg"] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = (await getSnapshot()).products.find((x) => x.slug === slug);
  if (!p) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    image: p.images.map((i) => src(i, 1170)),
    itemCondition: p.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${p.slug}`,
      priceCurrency: "CAD",
      price: (p.priceCents / 100).toFixed(2),
      availability: p.stock != null && p.stock <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStoreOnly",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView product={p} />
    </>
  );
}
