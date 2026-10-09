import type { Metadata } from "next";
import { BookView } from "@/components/home/BookView";

export const metadata: Metadata = {
  title: "Book a fitting, lesson or repair",
  description: "Request a club fitting, golf lesson or club repair / regrip at Tecumseh Golf. We'll call or email to confirm a time.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return <BookView />;
}
