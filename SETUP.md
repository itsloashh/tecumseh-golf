# Tecumseh Golf — go-live steps

One path. Do them in order. Each grey box is one line to copy-paste.

---

## 1. Put the code on your desktop

Unzip `tecumseh-golf.zip` so the folder is:

```
C:\Users\skers\Desktop\tecumseh-golf
```

Open a terminal in that folder:

```
cd C:\Users\skers\Desktop\tecumseh-golf
```

```
npm install
```

```
npm run dev
```

Open http://localhost:3000 — the site runs on sample data. Press `Ctrl + C` to stop it.

---

## 2. Create the GitHub repo and push

On github.com → **New repository** → name it `tecumseh-golf` → **Create** (leave README/gitignore unticked).

Back in the terminal, one line at a time:

```
git init
```

```
git add .
```

```
git commit -m "Tecumseh Golf v1"
```

```
git branch -M main
```

```
git remote add origin https://github.com/itsloashh/tecumseh-golf.git
```

```
git push -u origin main
```

---

## 3. Create the Supabase project

1. supabase.com → **New project** → name it `tecumseh-golf`, region **Canada (Central)**.
2. **SQL Editor** → New query → paste all of `supabase/migrations/0001_init.sql` → **Run**.
3. New query → paste all of `supabase/seed.sql` → **Run**.
4. **Authentication → Users → Add user** → your email + a password → tick **Auto Confirm User** → Create.
5. **Project Settings → API** → keep this tab open; you'll copy the URL, `anon` key and `service_role` key in step 4.

---

## 4. Create the Vercel project

1. vercel.com → **Add New → Project** → import `itsloashh/tecumseh-golf`.
2. Before clicking Deploy, open **Environment Variables** and add these five:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (secret) |
| `ADMIN_EMAILS` | the email you created in step 3.4 (this is the owner/manager login) |
| `NEXT_PUBLIC_SITE_URL` | `https://tecumseh-golf.vercel.app` (change to `https://tecumsehgolf.com` once the domain is connected) |

3. Click **Deploy**.

From now on it's the same as Yard$ and Lo Paro: **git push → Vercel deploys automatically.**

---

## 5. Point Supabase sign-in emails at the site

Supabase → **Authentication → URL Configuration**:

- **Site URL:** your `NEXT_PUBLIC_SITE_URL` value
- **Redirect URLs → Add:** the same address followed by `/auth/confirm` (e.g. `https://tecumseh-golf.vercel.app/auth/confirm`)

---

## 6. Sign in to the dashboard

Go to `/admin` on the live site and sign in with the email + password from step 3.4.
The **Home** screen has a "Before launch" checklist — work through it (hours, real products + photos, service prices).
Then open **Team & access** to add the shop's employees and tick what each one can use.

---

## Later (optional)

**Email alerts** (new orders, bookings and low stock to the shop; receipts + "ready for pickup" to customers): make a free
resend.com account, verify `tecumsehgolf.com`, then add Vercel env vars `RESEND_API_KEY` and `NOTIFY_FROM`
(e.g. `Tecumseh Golf <orders@tecumsehgolf.com>`) and redeploy. Who gets alerts, and which ones, is set in the dashboard
under **Notifications**.

**Card payments:** Stripe → Developers → Webhooks → Add endpoint `https://<site>/api/stripe/webhook` with events
`checkout.session.completed` and `checkout.session.expired`. Add Vercel env vars `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`, redeploy, then turn on **Store → Take card payments online** in the dashboard.

**Domain:** Vercel → Project → Settings → Domains → add `tecumsehgolf.com`, follow the DNS steps, then update
`NEXT_PUBLIC_SITE_URL` and the two Supabase URLs from step 5.
