-- ════════════════════════════════════════════════════════════════
-- TECUMSEH GOLF — full schema (shop, orders, accounts, services, admin)
-- Run in Supabase → SQL Editor BEFORE pushing the code. Then run seed.sql.
-- Public site reads with the anon key (RLS: published rows only).
-- Every write happens server-side with the service-role key.
-- ════════════════════════════════════════════════════════════════

create type order_status   as enum ('awaiting_payment', 'new', 'ready', 'completed', 'cancelled');
create type payment_method as enum ('pickup', 'card');
create type request_status as enum ('new', 'contacted', 'scheduled', 'completed', 'cancelled');

-- ── Store settings (single row) ──────────────────────────────────
create table store_settings (
  id                int primary key default 1 check (id = 1),
  name              text not null default 'Tecumseh Golf',
  tagline           text,
  address           text,
  city              text,
  province          text,
  postal            text,
  phone             text,
  email             text,
  hours             jsonb not null default '[]'::jsonb,   -- [{day:0-6, open:'09:00', close:'19:00', closed:false}]
  hours_note        text,
  hours_confirmed   boolean not null default false,       -- false shows "confirm hours" in the admin checklist
  announcement      text,
  announcement_on   boolean not null default false,
  hero_title        text,
  hero_sub          text,
  about             text[] not null default '{}',
  range_prices      jsonb not null default '[]'::jsonb,   -- [{label, detail, price}]
  range_note        text,
  google_rating     numeric(2,1),
  google_reviews    int,
  google_url        text,
  socials           jsonb not null default '[]'::jsonb,   -- [{label, href}]
  tax_rate          numeric(5,4) not null default 0.13,   -- Ontario HST
  pickup_note       text,
  online_payments   boolean not null default false,       -- needs STRIPE_SECRET_KEY too
  updated_at        timestamptz not null default now()
);

-- ── Catalogue ────────────────────────────────────────────────────
create table categories (
  slug       text primary key,
  label      text not null,
  sort_order int not null default 0
);

create table products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  brand             text,
  category          text references categories(slug) on update cascade on delete set null,
  condition         text not null default 'new' check (condition in ('new', 'used')),
  description       text,
  price_cents       int not null check (price_cents >= 0),
  compare_at_cents  int check (compare_at_cents is null or compare_at_cents >= 0),  -- "was" price → shows as sale
  stock             int check (stock is null or stock >= 0),                        -- null = not tracked
  options           jsonb not null default '[]'::jsonb,   -- [{name:'Size', values:['S','M','L']}]
  images            jsonb not null default '[]'::jsonb,   -- [{key, width, height, blur}] (renditions -480/-828/-1170.webp in 'shop')
  featured          boolean not null default false,
  published         boolean not null default true,
  is_sample         boolean not null default false,
  sort_order        int not null default 0,               -- higher = first
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on products (published, sort_order desc);
create index on products (category);

-- ── Services: range, fitting, lessons, repairs ───────────────────
create table services (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  summary       text,
  details       text[] not null default '{}',
  price_label   text,
  bookable      boolean not null default true,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Shopper accounts ─────────────────────────────────────────────
create table customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  phone       text,
  marketing   boolean not null default false,
  created_at  timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into customers (id, email, name, phone)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ── Orders ───────────────────────────────────────────────────────
create sequence order_number_seq start 1001;

create table orders (
  id                 uuid primary key default gen_random_uuid(),
  number             int unique not null default nextval('order_number_seq'),
  token              uuid unique not null default gen_random_uuid(),   -- the shopper's private link /order/<token>
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  status             order_status not null default 'new',
  payment            payment_method not null default 'pickup',
  paid               boolean not null default false,
  customer_id        uuid references customers(id) on delete set null,
  name               text not null,
  email              text not null,
  phone              text,
  note               text,
  subtotal_cents     int not null,
  tax_cents          int not null,
  total_cents        int not null,
  stripe_session_id  text unique,
  internal_notes     text
);
create index on orders (status, created_at desc);
create index on orders (customer_id, created_at desc);

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  option      text,
  unit_cents  int not null,
  qty         int not null check (qty > 0)
);
create index on order_items (order_id);

-- ── Service requests (fittings, lessons, repairs) ────────────────
create table service_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  status          request_status not null default 'new',
  service_slug    text,
  service_title   text not null,
  preferred_date  date,
  preferred_time  text,
  name            text not null,
  email           text not null,
  phone           text,
  details         text,
  customer_id     uuid references customers(id) on delete set null,
  internal_notes  text
);
create index on service_requests (status, created_at desc);

-- ── Admins ───────────────────────────────────────────────────────
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ── updated_at ───────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on products for each row execute function touch_updated_at();
create trigger orders_touch before update on orders for each row execute function touch_updated_at();
create trigger requests_touch before update on service_requests for each row execute function touch_updated_at();
create trigger settings_touch before update on store_settings for each row execute function touch_updated_at();

-- ════════════════ Order placement (atomic) ════════════════
-- Prices always come from the products table, never from the browser.
-- Stock is checked and taken in the same transaction, so two shoppers can't buy the last one.
create or replace function place_order(
  p_items jsonb,            -- [{product_id, qty, option}]
  p_name text, p_email text, p_phone text, p_note text,
  p_payment payment_method, p_customer uuid
) returns table (id uuid, number int, token uuid, total_cents int)
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod products; q int;
  v_order uuid; v_sub int := 0; v_tax int; v_rate numeric;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Your cart is empty.'; end if;
  select tax_rate into v_rate from store_settings where store_settings.id = 1;
  v_rate := coalesce(v_rate, 0.13);

  insert into orders (name, email, phone, note, payment, customer_id, status, subtotal_cents, tax_cents, total_cents)
  values (p_name, p_email, p_phone, p_note, p_payment, p_customer,
          case when p_payment = 'card' then 'awaiting_payment'::order_status else 'new'::order_status end, 0, 0, 0)
  returning orders.id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    q := greatest(1, least(20, coalesce((it->>'qty')::int, 1)));
    select * into prod from products where products.id = (it->>'product_id')::uuid and published for update;
    if not found then raise exception 'An item in your cart is no longer available.'; end if;
    if prod.stock is not null then
      if prod.stock = 0 then
        raise exception '% just sold out — remove it from your cart to continue.', prod.name;
      elsif prod.stock < q then
        raise exception 'Only % left of % — lower the quantity to continue.', prod.stock, prod.name;
      end if;
      update products set stock = stock - q where products.id = prod.id;
    end if;
    insert into order_items (order_id, product_id, name, option, unit_cents, qty)
    values (v_order, prod.id, prod.name, nullif(it->>'option', ''), prod.price_cents, q);
    v_sub := v_sub + prod.price_cents * q;
  end loop;

  v_tax := round(v_sub * v_rate);
  update orders set subtotal_cents = v_sub, tax_cents = v_tax, total_cents = v_sub + v_tax where orders.id = v_order;
  return query select o.id, o.number, o.token, o.total_cents from orders o where o.id = v_order;
end $$;

-- Cancelling puts tracked stock back (only once).
create or replace function cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare st order_status;
begin
  select status into st from orders where id = p_order for update;
  if st is null or st = 'cancelled' then return; end if;
  update products p set stock = p.stock + oi.qty
    from order_items oi where oi.order_id = p_order and oi.product_id = p.id and p.stock is not null;
  update orders set status = 'cancelled' where id = p_order;
end $$;

revoke all on function place_order(jsonb, text, text, text, text, payment_method, uuid) from public, anon, authenticated;
revoke all on function cancel_order(uuid) from public, anon, authenticated;
grant execute on function place_order(jsonb, text, text, text, text, payment_method, uuid) to service_role;
grant execute on function cancel_order(uuid) to service_role;

-- ════════════════ Row Level Security ════════════════
alter table store_settings   enable row level security;
alter table categories       enable row level security;
alter table products         enable row level security;
alter table services         enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table service_requests enable row level security;
alter table admins           enable row level security;

create policy "public read settings"   on store_settings for select using (true);
create policy "public read categories" on categories     for select using (true);
create policy "public read products"   on products       for select using (published);
create policy "public read services"   on services       for select using (published);

-- Shoppers see and edit only their own account, and see only their own orders
create policy "own customer read"   on customers for select using (auth.uid() = id);
create policy "own customer update" on customers for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own orders read"     on orders    for select using (auth.uid() = customer_id);
create policy "own order items"     on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
);
-- service_requests, admins: no public policies → service role only.

-- ════════════════ Storage ════════════════
insert into storage.buckets (id, name, public) values ('shop', 'shop', true) on conflict (id) do nothing;
-- Public bucket: files are served at /storage/v1/object/public/shop/… ; uploads use signed URLs from the server.
