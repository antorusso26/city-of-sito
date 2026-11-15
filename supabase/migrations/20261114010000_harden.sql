-- City Of — hardening after the first load (Supabase security and performance advisors, 14 Nov 2026).
-- 1. Helper functions move to a private schema (not exposed by the API); trigger functions can't be called over RPC.
-- 2. RLS rewritten: see 20261114010100_harden_policies.sql.
-- 3. public_partners and storage policies: see 20261114010100_harden_policies.sql.
-- 4. Indexes on every foreign key. citext moved out of public.
-- 5. listings: stay_details → details (display fields for both kinds), is_sample flag for example content.

-- ───────────── extensions ─────────────
create schema if not exists extensions;
alter extension citext set schema extensions;

-- ───────────── listings: display details and sample flag ─────────────
alter table listings rename column stay_details to details;   -- {format, duration, groupSize, departure, faq, sleeps…}
alter table listings add column is_sample boolean not null default false;  -- example content, not verified with a partner
comment on column listings.is_sample is 'Example content: prices null and partner [PARTNER] until confirmed. Never present as real.';
comment on column listings.details is 'Display fields from the editorial file: format, duration, groupSize, departure, faq (array of {q,a}), sleeps.';

-- ───────────── private helpers ─────────────
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
create or replace function private.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;
create or replace function private.my_partner_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select partner_id from public.partner_members where user_id = (select auth.uid());
$$;
create or replace function private.my_customer_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.customers where user_id = (select auth.uid());
$$;
-- Bookings of the signed-in customer, and bookings that include a line of one of my partners.
create or replace function private.my_booking_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select b.id from public.bookings b join public.customers c on c.id = b.customer_id where c.user_id = (select auth.uid());
$$;
create or replace function private.partner_booking_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select distinct bi.booking_id from public.booking_items bi
  join public.partner_members m on m.partner_id = bi.partner_id where m.user_id = (select auth.uid());
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;

-- Trigger functions: fixed search_path; nobody calls them over the API.
create or replace function touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create or replace function guard_partner_item_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if private.is_admin() then return new; end if;
  if (new.listing_id, new.partner_id, new.booking_id, new.unit_cents, new.line_cents, new.people, new.starts_at)
     is distinct from (old.listing_id, old.partner_id, old.booking_id, old.unit_cents, old.line_cents, old.people, old.starts_at) then
    raise exception 'partners can only accept or decline';
  end if;
  new.responded_at = now();
  return new;
end $$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  update public.customers set user_id = new.id where email::text = lower(new.email) and user_id is null;
  return new;
end $$;

-- request_booking stays public on purpose (guests book without an account). Search path pinned.
alter function request_booking(text, text, text, int, text, jsonb, date, date, text, channel) set search_path = public, extensions;
alter function queue_booking_notifications() set search_path = public;
alter function queue_item_notifications() set search_path = public;

revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function queue_booking_notifications() from public, anon, authenticated;
revoke execute on function queue_item_notifications() from public, anon, authenticated;
revoke execute on function touch_updated_at() from public, anon, authenticated;
revoke execute on function guard_partner_item_update() from public, anon, authenticated;
revoke execute on function rls_auto_enable() from public, anon, authenticated;
revoke execute on function request_booking(text, text, text, int, text, jsonb, date, date, text, channel) from public;
grant execute on function request_booking(text, text, text, int, text, jsonb, date, date, text, channel) to anon, authenticated;

-- ───────────── indexes on foreign keys ─────────────
create index if not exists booking_items_booking_idx   on booking_items (booking_id);
create index if not exists booking_items_listing_idx   on booking_items (listing_id);
create index if not exists booking_items_slot_idx      on booking_items (slot_id);
create index if not exists bookings_customer_idx       on bookings (customer_id);
create index if not exists bookings_package_idx        on bookings (package_id);
create index if not exists city_group_members_city_idx on city_group_members (city_id);
create index if not exists city_groups_area_idx        on city_groups (area_id);
create index if not exists city_links_near_idx         on city_links (near_id);
create index if not exists listing_photos_listing_idx  on listing_photos (listing_id, position);
create index if not exists listings_category_idx       on listings (category_id);
create index if not exists notifications_booking_idx   on notifications (booking_id);
create index if not exists notifications_partner_idx   on notifications (partner_id);
create index if not exists package_items_listing_idx   on package_items (listing_id);
create index if not exists packages_group_idx          on packages (group_id);
create index if not exists partner_cities_city_idx     on partner_cities (city_id);
create index if not exists partner_members_user_idx    on partner_members (user_id);
create index if not exists payments_booking_idx        on payments (booking_id);
