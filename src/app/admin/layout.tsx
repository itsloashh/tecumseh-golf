import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Staff", template: "%s · Tecumseh Golf Staff" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
