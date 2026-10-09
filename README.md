# Tecumseh Golf — pro shop, range & services

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Motion · Supabase (auth + database + storage) · Stripe (optional) · Vercel

Built on the same framework as **Lo Paro / LOASH** (`itsloashh/loparo`) with the shopper-account and
Stripe patterns from **Yard$** (`itsloashh/yards-app`): one data snapshot feeds every public page, every admin
save goes through a server action that re-checks the session and revalidates the site, photos are resized in the
browser and uploaded straight to Supabase Storage, and the whole thing runs on sample data until Supabase is connected.

## Run it

```bash
npm install
npm run dev                  # http://localhost:3000 — sample data, no keys needed
ADMIN_DEMO=1 npm run dev     # also opens /admin on sample data (saving disabled)
npm run build
```

## What's where

```
src/
  app/(site)/            Public site — home, shop, shop/[slug], checkout, order/[token], services, book, visit, account
  app/admin/             Staff dashboard — login + Home, Orders, Products, Bookings, Customers, Store
    actions.ts           Every admin write (auth-checked, then revalidates the public site)
  app/api/orders         Places an order (prices + stock checked in the database), starts Stripe if paying by card
  app/api/requests       Fitting / lesson / repair requests
  app/api/stripe/webhook Marks card orders paid; cancels + restocks abandoned ones
  app/auth/confirm       Landing spot for account-confirm and password-reset emails
  components/            Views + UI (shell, home, shop, account, admin)
  lib/
    data/sample.ts       Starter content (⚠ products are SAMPLES, hours from public listings)
    data/supabase.ts     Clients + mappers
    store.tsx            Cart (kept in the browser), cart drawer, signed-in shopper
    hours.ts             Open-now logic in the shop's time zone
supabase/
  migrations/0001_init.sql   Tables, RLS, place_order / cancel_order functions, storage bucket
  seed.sql                   Same content as sample.ts (regenerate: node scripts/gen-seed.mjs)
public/brand/                Logo cut from the old "coming soon" page
```

## How the shop works

- **Shoppers** browse, add to cart, and **reserve for pickup** (pay in store). If Stripe is on, they can also **pay now by card**.
- Every order gets a private link (`/order/<token>`) showing **Received → Ready for pickup → Picked up**.
- **Accounts** are optional: sign up / sign in / reset password, order history, saved details. Guest orders placed with
  the same email show up in the account automatically.
- **Prices and stock always come from the database** — the `place_order` function checks and takes stock in one
  transaction, so two people can't buy the last one. Cancelling an order puts the stock back.

## Staff dashboard (/admin)

Works on a phone. Every save goes live immediately (no redeploy).

| Screen | What staff can do |
|---|---|
| **Home** | New orders, waiting for pickup, new booking requests, low stock, last-7-days sales, a "before launch" checklist |
| **Orders** | Pickup queue by status, tap-to-call/email, mark Ready (emails the customer), Picked up, mark paid, cancel (restocks), staff notes |
| **Products** | Add from the camera roll (up to 8 photos), price + "was" price (sale), stock with quick +/−, options (size, hand, flex…), new/pre-owned, feature on homepage, hide, move to front, categories |
| **Bookings** | Fitting / lesson / repair requests: New → Contacted → Scheduled → Done, notes |
| **Customers** | Accounts, order counts, lifetime spend, email opt-ins (copy the list) |
| **Store** | Announcement bar, homepage headline, hours, range prices, services + prices, contact, Google rating, about text, tax rate, card payments on/off |

## ⚠ Replace before launch (all editable in /admin — the Home checklist tracks these)

- [ ] **Hours** — taken from public listings (Mon–Fri 9–7, Sat 9–4, Sun 9–3). Confirm, then tick "These hours are correct".
- [ ] **Products** — all 16 are samples ("Sample" tag). Edit or delete them; editing one clears its tag.
- [ ] **Range bucket prices** and **service prices**
- [ ] **About text** — a draft; rewrite in the shop's own words
- [ ] **Logo** — cut from a ~450px screenshot. A vector/PNG export of the original mascot + wordmark will be sharper.
- [ ] **Google rating** (4.5 · 161 reviews at build time) — update now and then

## Going live

Follow **SETUP.md** — one path, one step at a time.
