import type { Metadata } from "next";
import { ServicesView } from "@/components/home/ServicesView";

export const metadata: Metadata = {
  title: "Range & Services",
  description: "Heated driving range bays, custom club fitting, golf lessons, regripping and club repairs at Tecumseh Golf on Manning Rd.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <ServicesView />;
}
