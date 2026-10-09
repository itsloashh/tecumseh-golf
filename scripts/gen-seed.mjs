// Regenerates supabase/seed.sql from src/lib/data/sample.ts  →  node scripts/gen-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync(new URL("../src/lib/data/sample.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
const { settings: s, categories, products, services } = mod;

const q = (v) => (v === null || v === undefined || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const a = (list) => `array[${list.map(q).join(",")}]::text[]`;

const out = [];
out.push("-- TECUMSEH GOLF — starter content (same as src/lib/data/sample.ts). Run AFTER 0001_init.sql.");
out.push("-- Safe to run once. Every product is flagged is_sample = true until you replace it in /admin.\n");
out.push(`insert into store_settings (id, name, tagline, address, city, province, postal, phone, email, hours, hours_note, hours_confirmed,
  announcement, announcement_on, hero_title, hero_sub, about, range_prices, range_note, google_rating, google_reviews, google_url,
  socials, tax_rate, pickup_note, online_payments) values (1, ${q(s.name)}, ${q(s.tagline)}, ${q(s.address)}, ${q(s.city)}, ${q(s.province)},
  ${q(s.postal)}, ${q(s.phone)}, ${q(s.email)}, ${j(s.hours)}, ${q(s.hoursNote)}, ${s.hoursConfirmed}, ${q(s.announcement)}, ${s.announcementOn},
  ${q(s.heroTitle)}, ${q(s.heroSub)}, ${a(s.about)}, ${j(s.rangePrices)}, ${q(s.rangeNote)}, ${s.googleRating ?? "null"}, ${s.googleReviews ?? "null"},
  ${q(s.googleUrl)}, ${j(s.socials)}, ${s.taxRate}, ${q(s.pickupNote)}, ${s.onlinePayments})
on conflict (id) do nothing;\n`);

out.push("insert into categories (slug, label, sort_order) values");
out.push(categories.map((c) => `  (${q(c.slug)}, ${q(c.label)}, ${c.order})`).join(",\n") + "\non conflict (slug) do nothing;\n");

out.push("insert into products (slug, name, brand, category, condition, description, price_cents, compare_at_cents, stock, options, featured, is_sample, sort_order) values");
out.push(products.map((p) => `  (${q(p.slug)}, ${q(p.name)}, ${q(p.brand)}, ${q(p.category)}, ${q(p.condition)}, ${q(p.description)}, ${p.priceCents}, ${p.compareAtCents ?? "null"}, ${p.stock ?? "null"}, ${j(p.options)}, ${p.featured}, true, ${p.order})`).join(",\n") + "\non conflict (slug) do nothing;\n");

out.push("insert into services (slug, title, summary, details, price_label, bookable, sort_order) values");
out.push(services.map((v) => `  (${q(v.slug)}, ${q(v.title)}, ${q(v.summary)}, ${a(v.details)}, ${q(v.priceLabel)}, ${v.bookable}, ${v.order})`).join(",\n") + "\non conflict (slug) do nothing;\n");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n"));
console.log("wrote supabase/seed.sql");
