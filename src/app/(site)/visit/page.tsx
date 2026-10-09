import type { Metadata } from "next";
import { VisitView } from "@/components/home/VisitView";

export const metadata: Metadata = {
  title: "Visit — hours & directions",
  description: "Tecumseh Golf hours, directions and contact. 366 Manning Rd, Tecumseh, Ontario.",
  alternates: { canonical: "/visit" },
};

export default function VisitPage() {
  return <VisitView />;
}
