-- City Of — first database schema (Supabase / Postgres 15)
-- Areas → cities → listings (experiences and stays) run by partners.
-- Customers send booking requests; partners accept or decline each line; we (admin) run the rest.
-- Every table has Row Level Security on. Read docs/backend.md before changing it.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ───────────────────────── enums ─────────────────────────
create type app_role        as enum ('customer', 'partner', 'admin');
create type city_status     as enum ('draft', 'soon', 'live');
create type partner_kind    as enum ('boat', 'food', 'guide', 'driver', 'hotel', 'house', 'other');
create type partner_status  as enum ('lead', 'onboarding', 'active', 'paused', 'ended');
create type listing_kind    as enum ('experience', 'stay');
create type listing_status  as enum ('draft', 'review', 'published', 'archived');
create type price_unit      as enum ('per_person', 'per_group', 'per_boat', 'per_car', 'per_night');
create type booking_status  as enum (
  'requested',          -- the customer asked
  'partner_confirmed',  -- every line accepted by its partner
  'deposit_pending',    -- we sent the deposit link (phase 2)
  'confirmed',          -- deposit paid, or confirmed by hand in phase 1
  'completed',
  'cancelled_customer', 'cancelled_weather', 'cancelled_partner', 'declined');
create type item_status     as enum ('pending', 'accepted', 'declined', 'cancelled');
create type payment_kind    as enum ('deposit', 'refund');
create type payment_status  as enum ('pending', 'paid', 'failed', 'refunded');
create type channel         as enum ('web', 'whatsapp', 'email', 'phone', 'agency');

-- ───────────────────────── people ─────────────────────────
-- One row per signed-in user (customers, partner staff, us). Created by the trigger below.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        app_role not null default 'customer',
  full_name   text,
  phone       text,
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

-- Customers can book without an account; when they sign in with the same email the rows link up.
create table customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  email       citext not null unique,
  full_name   text,
  phone       text,
  country     text,
  marketing_ok boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── geography ─────────────────────────
-- Area = one public site (e.g. "Amalfi Coast"). Cities are sections of an area.
create table areas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  status      city_status not null default 'draft',
  created_at  timestamptz not null default now()
);

create table cities (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid not null references areas(id) on delete restrict,
  slug        text not null unique,
  name        text not null,
  status      city_status not null default 'draft',
  helm_slot   smallint check (helm_slot between 0 and 5),   -- handle on the helm (6 per area)
  accent      text not null default '#F2B705',
  coords      text,                                         -- "40°37′N · 14°22′E"
  lat         double precision,
  lng         double precision,
  tagline     text,
  intro       text,
  hero_path   text,                                         -- storage path
  created_at  timestamptz not null default now(),
  unique (area_id, helm_slot)
);

-- Which cities go well together ("see also" on a city page): travel time and how to get there.
create table city_links (
  city_id     uuid not null references cities(id) on delete cascade,
  near_id     uuid not null references cities(id) on delete cascade,
  minutes     int,
  how         text,                                         -- "ferry 25 min", "car 45 min"
  rank        smallint not null default 0,
  primary key (city_id, near_id),
  check (city_id <> near_id)
);

-- Groups of cities we recommend as one trip (e.g. "Amalfi Coast complete", "The islands").
create table city_groups (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid references areas(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  summary     text,
  days_min    smallint,
  days_max    smallint,
  status      listing_status not null default 'draft',
  created_at  timestamptz not null default now()
);
create table city_group_members (
  group_id    uuid not null references city_groups(id) on delete cascade,
  city_id     uuid not null references cities(id) on delete cascade,
  position    smallint not null default 0,
  optional    boolean not null default false,               -- the customer may switch it off
  primary key (group_id, city_id)
);

-- ───────────────────────── partners ─────────────────────────
create table partners (
  id              uuid primary key default gen_random_uuid(),
  kind            partner_kind not null,
  name            text not null,
  legal_name      text,
  vat_id          text,
  status          partner_status not null default 'lead',
  commission_pct  numeric(5,2) not null default 20.00 check (commission_pct between 0 and 100),
  contact_name    text,
  contact_email   citext,
  contact_phone   text,                                     -- never shown on the public site
  notes           text,                                     -- internal
  created_at      timestamptz not null default now()
);
create table partner_cities (
  partner_id  uuid not null references partners(id) on delete cascade,
  city_id     uuid not null references cities(id) on delete cascade,
  primary key (partner_id, city_id)
);
-- People who can log in to the partner area for a partner.
create table partner_members (
  partner_id  uuid not null references partners(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  is_owner    boolean not null default false,
  primary key (partner_id, user_id)
);

-- ───────────────────────── catalogue ─────────────────────────
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,                         -- boat-tours, food, walks, transfers, hotels, houses
  name        text not null,
  kind        listing_kind not null,
  position    smallint not null default 0
);

-- A listing is anything bookable: an experience (boat, class, guide, transfer) or a stay (hotel, house).
create table listings (
  id            uuid primary key default gen_random_uuid(),
  kind          listing_kind not null,
  partner_id    uuid not null references partners(id) on delete restrict,
  city_id       uuid not null references cities(id) on delete restrict,
  category_id   uuid references categories(id) on delete set null,
  slug          text not null,
  title         text not null,
  summary       text,                                       -- one line for cards
  body_md       text,                                       -- the page text
  why_we_picked text,
  includes      text[] not null default '{}',
  excludes      text[] not null default '{}',
  paid_on_site  text[] not null default '{}',               -- grotto tickets, port fees…
  duration_min  int,                                        -- experiences
  capacity_max  int,
  meeting_point text,
  price_cents   int check (price_cents >= 0),                 -- null = not confirmed with the partner yet
  price_unit    price_unit not null,
  currency      char(3) not null default 'EUR',
  min_nights    smallint,                                   -- stays
  check_in      time,
  check_out     time,
  stay_details  jsonb not null default '{}'::jsonb,         -- bedrooms, sleeps, amenities
  status        listing_status not null default 'draft',
  position      smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (city_id, slug)
);
create index listings_city_idx on listings (city_id, status);
create index listings_partner_idx on listings (partner_id);

create table listing_photos (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  path        text not null,                                -- storage bucket "listings"
  alt         text not null default '',
  credit      text,
  position    smallint not null default 0
);

-- Dates and times that can be booked. Stays use one row per night (starts_at = date, units = rooms).
create table slots (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  capacity    int not null check (capacity >= 0),
  booked      int not null default 0 check (booked >= 0),
  price_cents int,                                          -- override for this date
  closed      boolean not null default false,
  unique (listing_id, starts_at)
);

-- Curated packages built on a city group: default items per city, the customer can change them.
create table packages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references city_groups(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  summary     text,
  discount_pct numeric(5,2) not null default 0,
  status      listing_status not null default 'draft'
);
create table package_items (
  package_id  uuid not null references packages(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  day_index   smallint,
  is_default  boolean not null default true,
  primary key (package_id, listing_id)
);

-- ───────────────────────── bookings ─────────────────────────
create table bookings (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  customer_id   uuid not null references customers(id) on delete restrict,
  package_id    uuid references packages(id) on delete set null,
  status        booking_status not null default 'requested',
  channel       channel not null default 'web',
  people        smallint not null check (people > 0),
  starts_on     date,
  ends_on       date,
  notes         text,                                       -- from the customer
  internal_notes text,                                      -- ours
  total_cents   int not null default 0,
  deposit_cents int not null default 0,                     -- = our commission
  currency      char(3) not null default 'EUR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index bookings_status_idx on bookings (status, created_at desc);

-- One line per listing in the booking; each partner answers only for its own lines.
create table booking_items (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  listing_id    uuid not null references listings(id) on delete restrict,
  partner_id    uuid not null references partners(id) on delete restrict,
  slot_id       uuid references slots(id) on delete set null,
  starts_at     timestamptz,
  nights        smallint,
  people        smallint not null check (people > 0),
  unit_cents    int,                                        -- null = price to be confirmed
  line_cents    int,
  commission_cents int not null default 0,
  status        item_status not null default 'pending',
  partner_note  text,
  responded_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index booking_items_partner_idx on booking_items (partner_id, status);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete restrict,
  kind          payment_kind not null,
  status        payment_status not null default 'pending',
  amount_cents  int not null,
  currency      char(3) not null default 'EUR',
  provider      text not null default 'stripe',
  provider_ref  text,
  created_at    timestamptz not null default now()
);

-- Outbox: every email/WhatsApp message to send. An Edge Function reads it and marks it sent.
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references bookings(id) on delete cascade,
  audience      app_role not null,                          -- customer, partner, admin
  partner_id    uuid references partners(id) on delete cascade,
  template      text not null,                              -- booking_requested, item_accepted, …
  to_address    text,
  payload       jsonb not null default '{}'::jsonb,
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);
create index notifications_unsent_idx on notifications (created_at) where sent_at is null;

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_item_id uuid not null unique references booking_items(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  body          text,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  data        jsonb,
  at          timestamptz not null default now()
);

-- ───────────────────────── helpers ─────────────────────────
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_partner_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select partner_id from partner_members where user_id = auth.uid();
$$;

create or replace function my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from customers where user_id = auth.uid();
$$;

-- New auth user → profile; link an existing customer row with the same email.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  update customers set user_id = new.id where email = new.email and user_id is null;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger listings_touch before update on listings for each row execute function touch_updated_at();
create trigger bookings_touch before update on bookings for each row execute function touch_updated_at();

-- Status changes queue the right messages (sent by the "notify" Edge Function).
create or replace function queue_booking_notifications() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (booking_id, audience, template) values
      (new.id, 'customer', 'booking_requested'),
      (new.id, 'admin',    'booking_requested');
  elsif new.status is distinct from old.status then
    insert into notifications (booking_id, audience, template)
      values (new.id, 'customer', 'booking_' || new.status), (new.id, 'admin', 'booking_' || new.status);
  end if;
  return new;
end $$;
create trigger bookings_notify after insert or update of status on bookings
  for each row execute function queue_booking_notifications();

create or replace function queue_item_notifications() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (booking_id, audience, partner_id, template)
      values (new.booking_id, 'partner', new.partner_id, 'item_new');
  elsif new.status is distinct from old.status then
    insert into notifications (booking_id, audience, template)
      values (new.booking_id, 'admin', 'item_' || new.status);
    -- every line accepted → the booking is confirmed by the partners
    if new.status = 'accepted' and not exists (
         select 1 from booking_items where booking_id = new.booking_id and status <> 'accepted') then
      update bookings set status = 'partner_confirmed' where id = new.booking_id and status = 'requested';
    end if;
  end if;
  return new;
end $$;
create trigger booking_items_notify after insert or update of status on booking_items
  for each row execute function queue_item_notifications();

-- Partners may only change the answer on their lines, nothing else.
create or replace function guard_partner_item_update() returns trigger language plpgsql as $$
begin
  if is_admin() then return new; end if;
  if (new.listing_id, new.partner_id, new.booking_id, new.unit_cents, new.line_cents, new.people, new.starts_at)
     is distinct from (old.listing_id, old.partner_id, old.booking_id, old.unit_cents, old.line_cents, old.people, old.starts_at) then
    raise exception 'partners can only accept or decline';
  end if;
  new.responded_at = now();
  return new;
end $$;
create trigger booking_items_guard before update on booking_items
  for each row execute function guard_partner_item_update();

-- Public entry point: create a booking request (guest or signed in). Prices come from the database.
create or replace function request_booking(
  p_email text, p_name text, p_phone text, p_people int, p_notes text,
  p_items jsonb,       -- [{ "city": "sorrento", "slug": "private-boat-capri", "starts_on": "2027-06-12", "nights": null }]
  p_starts_on date default null, p_ends_on date default null,
  p_package_slug text default null, p_channel channel default 'web'
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid; v_booking uuid; v_code text; it jsonb; l listings; v_line int; v_total int := 0; v_comm int := 0; v_pct numeric; v_pkg uuid;
begin
  if p_email is null or position('@' in p_email) < 2 then raise exception 'email'; end if;
  if p_people is null or p_people < 1 or p_people > 50 then raise exception 'people'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 or jsonb_array_length(p_items) > 30 then raise exception 'items'; end if;

  insert into customers (email, full_name, phone, user_id)
  values (lower(p_email), p_name, p_phone, auth.uid())
  on conflict (email) do update set full_name = coalesce(customers.full_name, excluded.full_name),
                                    phone = coalesce(customers.phone, excluded.phone)
  returning id into v_customer;

  select id into v_pkg from packages where slug = p_package_slug;
  insert into bookings (customer_id, package_id, people, starts_on, ends_on, notes, channel)
  values (v_customer, v_pkg, p_people, p_starts_on, p_ends_on, p_notes, p_channel) returning id, code into v_booking, v_code;

  for it in select * from jsonb_array_elements(p_items) loop
    select l2.* into l from listings l2 join cities c on c.id = l2.city_id
     where c.slug = it->>'city' and l2.slug = it->>'slug' and l2.status = 'published';
    if not found then raise exception 'listing not available: %/%', it->>'city', it->>'slug'; end if;
    select commission_pct into v_pct from partners where id = l.partner_id;
    v_line := case
                when l.price_cents is null then null
                when l.price_unit = 'per_person' then l.price_cents * p_people
                when l.price_unit = 'per_night'  then l.price_cents * greatest(coalesce((it->>'nights')::int, 1), coalesce(l.min_nights, 1))
                else l.price_cents end;
    insert into booking_items (booking_id, listing_id, partner_id, starts_at, nights, people, unit_cents, line_cents, commission_cents)
    values (v_booking, l.id, l.partner_id, (it->>'starts_on')::timestamptz, (it->>'nights')::smallint, p_people,
            l.price_cents, v_line, coalesce(round(v_line * v_pct / 100), 0));
    v_total := v_total + coalesce(v_line, 0);
    v_comm  := v_comm + coalesce(round(v_line * v_pct / 100), 0);
  end loop;

  update bookings set total_cents = v_total, deposit_cents = v_comm where id = v_booking;
  return v_code;
end $$;
grant execute on function request_booking to anon, authenticated;

-- ───────────────────────── row level security ─────────────────────────
alter table profiles            enable row level security;
alter table customers           enable row level security;
alter table areas               enable row level security;
alter table cities              enable row level security;
alter table city_links          enable row level security;
alter table city_groups         enable row level security;
alter table city_group_members  enable row level security;
alter table partners            enable row level security;
alter table partner_cities      enable row level security;
alter table partner_members     enable row level security;
alter table categories          enable row level security;
alter table listings            enable row level security;
alter table listing_photos      enable row level security;
alter table slots               enable row level security;
alter table packages            enable row level security;
alter table package_items       enable row level security;
alter table bookings            enable row level security;
alter table booking_items       enable row level security;
alter table payments            enable row level security;
alter table notifications       enable row level security;
alter table reviews             enable row level security;
alter table audit_log           enable row level security;

-- Admin: everything, everywhere.
do $$
declare t text;
begin
  foreach t in array array['profiles','customers','areas','cities','city_links','city_groups','city_group_members',
    'partners','partner_cities','partner_members','categories','listings','listing_photos','slots','packages',
    'package_items','bookings','booking_items','payments','notifications','reviews','audit_log']
  loop
    execute format('create policy admin_all on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Public site (anyone): only what is live or published.
create policy public_read on areas              for select using (status <> 'draft');
create policy public_read on cities             for select using (status <> 'draft');
create policy public_read on city_links         for select using (true);
create policy public_read on city_groups        for select using (status = 'published');
create policy public_read on city_group_members for select using (true);
create policy public_read on categories         for select using (true);
create policy public_read on listings           for select using (status = 'published');
create policy public_read on listing_photos     for select using (exists (select 1 from listings l where l.id = listing_id and l.status = 'published'));
create policy public_read on slots              for select using (not closed and exists (select 1 from listings l where l.id = listing_id and l.status = 'published'));
create policy public_read on packages           for select using (status = 'published');
create policy public_read on package_items      for select using (true);
create policy public_read on reviews            for select using (published);
-- Public partner card: name and kind only, via a view (contacts stay private).
create view public_partners with (security_invoker = false) as
  select id, kind, name from partners where status = 'active';
grant select on public_partners to anon, authenticated;

-- Everyone: their own profile.
create policy own_profile on profiles for select using (id = auth.uid());
create policy own_profile_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- Customer area: their own customer row, bookings, lines, payments, reviews.
create policy customer_self on customers for select using (user_id = auth.uid());
create policy customer_bookings on bookings for select using (customer_id = my_customer_id());
create policy customer_items on booking_items for select using (booking_id in (select id from bookings where customer_id = my_customer_id()));
create policy customer_payments on payments for select using (booking_id in (select id from bookings where customer_id = my_customer_id()));
create policy customer_reviews on reviews for insert with check (
  booking_item_id in (select bi.id from booking_items bi join bookings b on b.id = bi.booking_id
                      where b.customer_id = my_customer_id() and b.status = 'completed'));

-- Partner area: their partner record, listings, photos, slots, and the booking lines addressed to them.
create policy partner_self on partners for select using (id in (select my_partner_ids()));
create policy partner_members_self on partner_members for select using (user_id = auth.uid());
create policy partner_listings_read on listings for select using (partner_id in (select my_partner_ids()));
create policy partner_listings_write on listings for update using (partner_id in (select my_partner_ids()))
  with check (partner_id in (select my_partner_ids()) and status in ('draft', 'review'));   -- publishing is ours
create policy partner_listings_insert on listings for insert with check (partner_id in (select my_partner_ids()) and status = 'draft');
create policy partner_photos on listing_photos for all
  using (listing_id in (select id from listings where partner_id in (select my_partner_ids())))
  with check (listing_id in (select id from listings where partner_id in (select my_partner_ids())));
create policy partner_slots on slots for all
  using (listing_id in (select id from listings where partner_id in (select my_partner_ids())))
  with check (listing_id in (select id from listings where partner_id in (select my_partner_ids())));
create policy partner_items_read on booking_items for select using (partner_id in (select my_partner_ids()));
create policy partner_items_answer on booking_items for update using (partner_id in (select my_partner_ids()))
  with check (partner_id in (select my_partner_ids()) and status in ('accepted', 'declined'));
-- Partners see the booking header (people, dates, customer first name) of bookings that include them.
create policy partner_bookings_read on bookings for select using (
  id in (select booking_id from booking_items where partner_id in (select my_partner_ids())));

-- ───────────────────────── storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('listings', 'listings', true), ('cities', 'cities', true)
on conflict (id) do nothing;
create policy "public photos" on storage.objects for select using (bucket_id in ('listings', 'cities'));
create policy "admin photos" on storage.objects for all using (is_admin()) with check (is_admin());
-- Partners upload under listings/<partner_id>/...
create policy "partner photos" on storage.objects for insert with check (
  bucket_id = 'listings' and (storage.foldername(name))[1]::uuid in (select my_partner_ids()));
