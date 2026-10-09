import { getSnapshot } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { StoreProvider } from "@/lib/store";
import { SiteShell } from "@/components/shell/SiteShell";

// Public pages are static and refresh every 5 minutes; admin saves also revalidate instantly.
export const revalidate = 300;

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getSnapshot();
  const s = snapshot.settings;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportingGoodsStore",
    name: "Tecumseh Golf Centre",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/og.jpg`,
    telephone: s.phone,
    email: s.email,
    address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.city, addressRegion: s.province, postalCode: s.postal, addressCountry: "CA" },
    openingHoursSpecification: s.hours.filter((h) => !h.closed).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY[h.day], opens: h.open, closes: h.close })),
    ...(s.googleRating && s.googleReviews ? { aggregateRating: { "@type": "AggregateRating", ratingValue: s.googleRating, reviewCount: s.googleReviews } } : {}),
  };
  return (
    <StoreProvider snapshot={snapshot}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteShell>{children}</SiteShell>
    </StoreProvider>
  );
}
