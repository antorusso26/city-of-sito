-- City Of — hardening, part 2: RLS rewritten after the advisors (see 20261114010000_harden.sql).
-- One policy per table, role and action; helpers in schema private; no recursion bookings ↔ booking_items.
-- Run once, after part 1. Safe on a database that has only the first schema's policies.

-- ───────────── policies: drop the first version ─────────────
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;
drop policy if exists "public photos" on storage.objects;
drop policy if exists "admin photos" on storage.objects;
drop policy if exists "partner photos" on storage.objects;

drop function public.is_admin();
drop function public.my_partner_ids();
drop function public.my_customer_id();

-- Admin writes on every table (one policy per action, authenticated only).
do $$
declare t text;
begin
  foreach t in array array['profiles','customers','areas','cities','city_links','city_groups','city_group_members',
    'partners','partner_cities','partner_members','categories','listings','listing_photos','slots','packages',
    'package_items','bookings','booking_items','payments','notifications','reviews','audit_log']
  loop
    if t not in ('listings', 'listing_photos', 'slots', 'reviews') then
      execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select private.is_admin()))', t);
    end if;
    if t not in ('profiles', 'listings', 'listing_photos', 'slots', 'booking_items') then
      execute format('create policy admin_update on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    end if;
    if t not in ('listing_photos', 'slots') then
      execute format('create policy admin_delete on public.%I for delete to authenticated using ((select private.is_admin()))', t);
    end if;
  end loop;
end $$;

-- Read: admin only.
create policy admin_read on partner_cities  for select to authenticated using ((select private.is_admin()));
create policy admin_read on notifications   for select to authenticated using ((select private.is_admin()));
create policy admin_read on audit_log       for select to authenticated using ((select private.is_admin()));

-- Read: public site (anon) and signed-in users (who also see drafts if admin).
create policy anon_read on areas  for select to anon using (status <> 'draft');
create policy auth_read on areas  for select to authenticated using (status <> 'draft' or (select private.is_admin()));
create policy anon_read on cities for select to anon using (status <> 'draft');
create policy auth_read on cities for select to authenticated using (status <> 'draft' or (select private.is_admin()));
create policy public_read on city_links         for select to anon, authenticated using (true);
create policy public_read on city_group_members for select to anon, authenticated using (true);
create policy public_read on categories         for select to anon, authenticated using (true);
create policy public_read on package_items      for select to anon, authenticated using (true);
create policy anon_read on city_groups for select to anon using (status = 'published');
create policy auth_read on city_groups for select to authenticated using (status = 'published' or (select private.is_admin()));
create policy anon_read on packages    for select to anon using (status = 'published');
create policy auth_read on packages    for select to authenticated using (status = 'published' or (select private.is_admin()));

-- Profiles: own row; nobody promotes themselves.
create policy auth_read on profiles for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy auth_update on profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check ((select private.is_admin()) or (id = (select auth.uid()) and role = (select private.my_role())));

-- Customers.
create policy auth_read on customers for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Partners: anon sees active partners (only id, kind, name: column grants below); partners see their own record.
create policy anon_read on partners for select to anon using (status = 'active');
create policy auth_read on partners for select to authenticated
  using (id in (select private.my_partner_ids()) or (select private.is_admin()));
create policy auth_read on partner_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Listings.
create policy anon_read on listings for select to anon using (status = 'published');
create policy auth_read on listings for select to authenticated
  using (status = 'published' or partner_id in (select private.my_partner_ids()) or (select private.is_admin()));
create policy auth_insert on listings for insert to authenticated
  with check ((select private.is_admin()) or (partner_id in (select private.my_partner_ids()) and status = 'draft'));
create policy auth_update on listings for update to authenticated
  using ((select private.is_admin()) or partner_id in (select private.my_partner_ids()))
  with check ((select private.is_admin()) or (partner_id in (select private.my_partner_ids()) and status in ('draft', 'review')));

-- Photos and slots: public when the listing is published; partners manage their own.
create policy anon_read on listing_photos for select to anon
  using (listing_id in (select id from public.listings where status = 'published'));
create policy auth_read on listing_photos for select to authenticated
  using (listing_id in (select id from public.listings where status = 'published' or partner_id in (select private.my_partner_ids()))
         or (select private.is_admin()));
create policy auth_insert on listing_photos for insert to authenticated
  with check ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));
create policy auth_update on listing_photos for update to authenticated
  using ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())))
  with check ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));
create policy auth_delete on listing_photos for delete to authenticated
  using ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));

create policy anon_read on slots for select to anon
  using (not closed and listing_id in (select id from public.listings where status = 'published'));
create policy auth_read on slots for select to authenticated
  using ((not closed and listing_id in (select id from public.listings where status = 'published'))
         or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids()))
         or (select private.is_admin()));
create policy auth_insert on slots for insert to authenticated
  with check ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));
create policy auth_update on slots for update to authenticated
  using ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())))
  with check ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));
create policy auth_delete on slots for delete to authenticated
  using ((select private.is_admin()) or listing_id in (select id from public.listings where partner_id in (select private.my_partner_ids())));

-- Bookings: customers see theirs, partners see the bookings that include them, admin everything.
-- Inserts go through request_booking (security definer).
create policy auth_read on bookings for select to authenticated
  using ((select private.is_admin()) or id in (select private.my_booking_ids()) or id in (select private.partner_booking_ids()));
create policy auth_read on booking_items for select to authenticated
  using ((select private.is_admin()) or booking_id in (select private.my_booking_ids()) or partner_id in (select private.my_partner_ids()));
create policy auth_update on booking_items for update to authenticated
  using ((select private.is_admin()) or partner_id in (select private.my_partner_ids()))
  with check ((select private.is_admin()) or (partner_id in (select private.my_partner_ids()) and status in ('accepted', 'declined')));
create policy auth_read on payments for select to authenticated
  using ((select private.is_admin()) or booking_id in (select private.my_booking_ids()));

-- Reviews: published ones are public; customers write one after a completed booking.
create policy anon_read on reviews for select to anon using (published);
create policy auth_read on reviews for select to authenticated using (published or (select private.is_admin()));
create policy auth_insert on reviews for insert to authenticated with check (
  (select private.is_admin()) or booking_item_id in (
    select bi.id from public.booking_items bi
    where bi.booking_id in (select private.my_booking_ids())
      and exists (select 1 from public.bookings b where b.id = bi.booking_id and b.status = 'completed')));

-- ───────────── public partner card ─────────────
-- Anon may read only these columns of partners; contacts, VAT, notes and commission stay private.
revoke select on partners from anon;
grant select (id, kind, name, status) on partners to anon;
drop view if exists public_partners;
create view public_partners with (security_invoker = true) as
  select id, kind, name from partners where status = 'active';
grant select on public_partners to anon, authenticated;

-- ───────────── storage ─────────────
-- Buckets are public: files are served by URL without a policy, and nobody can list them.
create policy "admin photos read"   on storage.objects for select to authenticated using (bucket_id in ('listings', 'cities') and (select private.is_admin()));
create policy "admin photos insert" on storage.objects for insert to authenticated with check (bucket_id in ('listings', 'cities') and (select private.is_admin()));
create policy "admin photos update" on storage.objects for update to authenticated using (bucket_id in ('listings', 'cities') and (select private.is_admin()));
create policy "admin photos delete" on storage.objects for delete to authenticated using (bucket_id in ('listings', 'cities') and (select private.is_admin()));
-- Partners upload under listings/<partner_id>/...
create policy "partner photos insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'listings' and (storage.foldername(name))[1] in (select id::text from private.my_partner_ids() as id));

