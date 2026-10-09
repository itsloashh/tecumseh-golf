"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { Scorecard } from "./HomeView";
import { OpenPill } from "@/components/shell/SiteShell";
import { ProductArt } from "@/components/ui/ProductArt";
import { IconCal, IconPhone } from "@/components/ui/primitives";

const ART: Record<string, string> = { range: "balls", fitting: "clubs", lessons: "putters", repairs: "gloves" };

export function ServicesView() {
  const { snapshot } = useStore();
  const { services, settings: s } = snapshot;
  const tel = s.phone.replace(/[^0-9+]/g, "");
  return (
    <>
      <section className="dimples text-cream">
        <div className="stripes">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="label text-flag">Range & services</p>
            <h1 className="display display-i mt-3 max-w-3xl text-[3.4rem] leading-[0.86] sm:text-[5.2rem]">More than a pro shop.</h1>
            <p className="mt-5 max-w-xl text-[16.5px] text-cream/80">Hit balls year-round in heated bays, get fitted with real launch data, take a lesson, or drop your clubs off for new grips.</p>
            <div className="mt-6"><span className="rounded-full bg-black/25 px-3 py-1.5"><OpenPill dark /></span></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-12 sm:px-6">
        {services.map((v, i) => (
          <motion.section
            key={v.id}
            id={v.slug}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55 }}
            className="card grid scroll-mt-28 overflow-hidden md:grid-cols-[320px_1fr]"
          >
            <div className="aspect-[16/10] md:aspect-auto"><ProductArt category={ART[v.slug] ?? "accessories"} seed={`svc-${v.slug}-${i}`} /></div>
            <div className="p-6 sm:p-8">
              <h2 className="display text-[2.4rem] sm:text-[2.8rem]">{v.title}</h2>
              <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink/80">{v.summary}</p>
              <ul className="mt-5 grid gap-2 text-[14.5px] sm:grid-cols-2">
                {v.details.map((d) => <li key={d} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-flag-deep" />{d}</li>)}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {v.bookable ? (
                  <Link href={`/book?service=${v.slug}`} className="btn btn-green"><IconCal size={18} /> Request a time</Link>
                ) : (
                  <span className="rounded-full bg-leaf px-4 py-2.5 text-[14px] font-semibold text-green">Walk in — no booking needed</span>
                )}
                {tel && <a href={`tel:${tel}`} className="btn btn-ghost"><IconPhone size={18} /> {s.phone}</a>}
                {v.priceLabel && <span className="price ml-auto text-[1.3rem]">{v.priceLabel}</span>}
              </div>
              {v.slug === "range" && <div className="mt-8 max-w-xl"><Scorecard /></div>}
            </div>
          </motion.section>
        ))}
      </div>
    </>
  );
}
