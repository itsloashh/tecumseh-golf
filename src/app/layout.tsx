import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/archivo/wdth-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/styles/globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Tecumseh Golf — Pro Shop, Heated Range & Club Fitting · Tecumseh, ON";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Tecumseh Golf" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Tecumseh Golf", "Tecumseh Golf Centre", "golf shop Windsor", "pro shop Tecumseh", "heated driving range Windsor", "club fitting Windsor Essex", "regripping", "golf lessons Tecumseh"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Tecumseh Golf" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  icons: { icon: "/brand/icon.png", apple: "/brand/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f4efe3",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body>{children}</body>
    </html>
  );
}
