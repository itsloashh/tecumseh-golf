import type { Metadata } from "next";
import { ServicesView } from "@/components/home/ServicesView";

export const metadata: Metadata = {
  title: "Fitting, Lessons & Repairs",
  description: "Custom club fitting, golf lessons, regripping, re-shafting and club repairs at Tecumseh Golf on Manning Rd.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <ServicesView />;
}
