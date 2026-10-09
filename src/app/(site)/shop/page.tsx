import type { Metadata } from "next";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop",
  description: "Golf clubs, putters, balls, bags, gloves, apparel and pre-owned clubs from Tecumseh Golf. Order online and pick up in store on Manning Rd.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <ShopView />;
}
