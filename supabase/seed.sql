-- TECUMSEH GOLF — starter content (same as src/lib/data/sample.ts). Run AFTER 0001_init.sql.
-- Safe to run once. Every product is flagged is_sample = true until you replace it in /admin.

insert into store_settings (id, name, tagline, address, city, province, postal, phone, email, hours, hours_note, hours_confirmed,
  announcement, announcement_on, hero_title, hero_sub, about, home_sections, notifications, google_rating, google_reviews, google_url,
  socials, tax_rate, pickup_note, online_payments) values (1, 'Tecumseh Golf', 'Pro shop · Club fitting · Lessons · Repairs', '366 Manning Rd', 'Tecumseh', 'ON',
  'N8N 4W5', '519-735-8933', 'info@tecumsehgolf.com', '[{"day":0,"open":"09:00","close":"15:00","closed":false},{"day":1,"open":"09:00","close":"19:00","closed":false},{"day":2,"open":"09:00","close":"19:00","closed":false},{"day":3,"open":"09:00","close":"19:00","closed":false},{"day":4,"open":"09:00","close":"19:00","closed":false},{"day":5,"open":"09:00","close":"19:00","closed":false},{"day":6,"open":"09:00","close":"16:00","closed":false}]'::jsonb, 'Hours can change with the season and the weather — give us a call if you''re unsure.', false, 'Our new website is live — shop online and pick up in store.', true,
  'Your local golf pro shop.', 'Clubs, balls, bags, apparel and pre-owned gear — plus custom club fitting, lessons and repairs, all under one roof on Manning Rd.', array['Tecumseh Golf is the Windsor–Essex golfer''s neighbourhood pro shop: family-run, stocked with the gear you actually play, and staffed by people who know the game.','Get fitted for your next driver, book a lesson, have a shaft or grip replaced, or just stop in and talk golf. Online orders are held at the counter for pickup.']::text[], '{"featured":true,"categories":true,"workshop":true,"preowned":true,"visit":true}'::jsonb, '{"recipients":[],"newOrder":true,"newBooking":true,"lowStock":true,"lowStockAt":2,"customerReceipt":true,"customerReady":true}'::jsonb, 4.5, 161,
  'https://www.google.com/maps/search/?api=1&query=Tecumseh+Golf+Centre+366+Manning+Rd+Tecumseh+ON', '[]'::jsonb, 0.13, 'We''ll hold your order at the counter and let you know when it''s ready — usually the same day.', false)
on conflict (id) do nothing;

insert into categories (slug, label, sort_order) values
  ('clubs', 'Clubs', 1),
  ('putters', 'Putters', 2),
  ('balls', 'Balls', 3),
  ('bags', 'Bags', 4),
  ('gloves', 'Gloves', 5),
  ('apparel', 'Apparel', 6),
  ('accessories', 'Accessories', 7)
on conflict (slug) do nothing;

insert into products (slug, name, brand, category, condition, description, price_cents, compare_at_cents, stock, options, featured, is_sample, sort_order) values
  ('tour-distance-balls-dozen', 'Tour Distance Golf Balls — Dozen', 'Sample Brand', 'balls', 'new', 'Three-piece urethane-cover ball with a soft feel around the greens and low spin off the driver. Sold by the dozen.', 4999, null, 24, '[]'::jsonb, true, true, 120),
  ('soft-feel-balls-dozen', 'Soft Feel Golf Balls — Dozen', 'Sample Brand', 'balls', 'new', 'Low-compression two-piece ball for straighter, softer shots. A great everyday ball.', 2999, 3499, 30, '[]'::jsonb, false, true, 110),
  ('460cc-driver', '460cc Adjustable Driver', 'Sample Brand', 'clubs', 'new', 'Forgiving adjustable driver with a 460cc head. Book a fitting and we''ll dial in loft, lie and shaft before you buy.', 54999, null, 3, '[{"name":"Hand","values":["Right","Left"]},{"name":"Flex","values":["Regular","Stiff","Senior"]}]'::jsonb, true, true, 100),
  ('game-improvement-irons', 'Game-Improvement Iron Set (5–PW)', 'Sample Brand', 'clubs', 'new', 'Cavity-back irons built for height and forgiveness. Fitted in store at no extra charge.', 89999, null, 2, '[{"name":"Hand","values":["Right","Left"]},{"name":"Shaft","values":["Steel","Graphite"]}]'::jsonb, false, true, 95),
  ('used-blade-putter', 'Pre-Owned Blade Putter', 'Sample Brand', 'putters', 'used', 'Classic blade putter in good condition, 34". Fresh grip installed. One only.', 8999, null, 1, '[]'::jsonb, true, true, 90),
  ('used-hybrid-22', 'Pre-Owned 22° Hybrid', 'Sample Brand', 'clubs', 'used', 'Lightly used hybrid, regular flex graphite shaft. Easy to launch from the rough.', 7999, null, 1, '[]'::jsonb, false, true, 85),
  ('mallet-putter', 'High-MOI Mallet Putter', 'Sample Brand', 'putters', 'new', 'Stable mallet head with an alignment line that frames the ball.', 24999, null, 4, '[{"name":"Length","values":["33\"","34\"","35\""]}]'::jsonb, false, true, 80),
  ('lightweight-stand-bag', 'Lightweight Stand Bag', 'Sample Brand', 'bags', 'new', '14-way top, dual straps and a waterproof valuables pocket. Under 2 kg.', 24999, null, 5, '[{"name":"Colour","values":["Fairway Green","Black","White"]}]'::jsonb, true, true, 75),
  ('cart-bag', 'Cart Bag', 'Sample Brand', 'bags', 'new', 'Full-length dividers, cooler pocket and a cart-strap pass-through.', 29999, 34999, 2, '[]'::jsonb, false, true, 70),
  ('cabretta-leather-glove', 'Cabretta Leather Glove', 'Sample Brand', 'gloves', 'new', 'Soft, thin premium leather for maximum feel.', 2499, null, 40, '[{"name":"Hand","values":["Left (for RH golfer)","Right (for LH golfer)"]},{"name":"Size","values":["S","M","ML","L","XL"]}]'::jsonb, true, true, 65),
  ('winter-mitts', 'Winter Golf Mitts (Pair)', 'Sample Brand', 'gloves', 'new', 'Fleece-lined mitts that slip on between shots. Made for cold spring and fall rounds.', 3499, null, 10, '[]'::jsonb, false, true, 60),
  ('tg-logo-polo', 'Tecumseh Golf Logo Polo', 'Tecumseh Golf', 'apparel', 'new', 'Moisture-wicking performance polo with the Tecumseh Golf mascot on the chest.', 5499, null, null, '[{"name":"Size","values":["S","M","L","XL","XXL"]}]'::jsonb, true, true, 55),
  ('tg-rope-cap', 'Tecumseh Golf Rope Cap', 'Tecumseh Golf', 'apparel', 'new', 'Structured cap with a rope front and embroidered logo. One size.', 3499, null, 15, '[]'::jsonb, false, true, 50),
  ('rangefinder', 'Laser Rangefinder with Slope', 'Sample Brand', 'accessories', 'new', '6x magnification, flag-lock vibration and a switchable slope mode.', 29999, null, 3, '[]'::jsonb, false, true, 45),
  ('tee-pack', 'Bamboo Tees — Pack of 50', 'Sample Brand', 'accessories', 'new', 'Durable 2¾" bamboo tees.', 899, null, null, '[]'::jsonb, false, true, 40),
  ('towel-divot-kit', 'Towel & Divot Tool Kit', 'Sample Brand', 'accessories', 'new', 'Waffle towel, magnetic ball marker and a two-prong divot tool.', 2499, null, 0, '[]'::jsonb, false, true, 35)
on conflict (slug) do nothing;

insert into services (slug, title, summary, details, price_label, bookable, sort_order) values
  ('fitting', 'Club fitting', 'Get dialled in on loft, lie, length and shaft before you buy, so your next clubs actually fit your swing.', array['Driver, iron, wedge and putter fittings','Loft, lie, length & shaft matched to you','Try before you buy']::text[], null, true, 3),
  ('lessons', 'Golf lessons', 'One-on-one coaching for every level — from first swings to shaving strokes off a single-digit handicap.', array['Private and series lessons','Video swing feedback','Juniors welcome']::text[], null, true, 2),
  ('repairs', 'Repairs & regripping', 'New grips, new shafts, loft and lie adjustments — bring your clubs in and we''ll get them playing like new.', array['Regripping (most sets turned around quickly)','Shaft replacement & re-shafting','Loft & lie adjustments']::text[], null, true, 1)
on conflict (slug) do nothing;
