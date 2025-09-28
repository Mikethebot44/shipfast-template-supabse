-- Indie Ad Swap Network - Core Tables and Policies
-- Safe to run multiple times (idempotent via IF NOT EXISTS and DO blocks)

-- Extensions
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

create table if not exists public.ads_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  tagline text not null,
  platform text not null,
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ads_products_user_id on public.ads_products(user_id);
create index if not exists idx_ads_products_created_at on public.ads_products(created_at desc);

create table if not exists public.ads_swaps (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  target_product_id uuid not null references public.ads_products(id) on delete cascade,
  platform text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint ads_swaps_status_check check (status in ('pending','completed'))
);

create index if not exists idx_ads_swaps_requester on public.ads_swaps(requester_user_id);
create index if not exists idx_ads_swaps_target on public.ads_swaps(target_user_id);
create index if not exists idx_ads_swaps_product on public.ads_swaps(target_product_id);
create index if not exists idx_ads_swaps_status on public.ads_swaps(status);

create table if not exists public.ads_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 0,
  updated_at timestamptz not null default now()
);

-- =========================
-- Triggers
-- =========================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger set_ads_products_updated_at
  before update on public.ads_products
  for each row
  execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_ads_credits_updated_at
  before update on public.ads_credits
  for each row
  execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

-- =========================
-- Row Level Security and Policies
-- =========================

alter table public.ads_products enable row level security;
alter table public.ads_swaps enable row level security;
alter table public.ads_credits enable row level security;

-- ads_products policies
do $$ begin
  create policy "ads_products_select_auth" on public.ads_products
    for select to authenticated
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ads_products_insert_own" on public.ads_products
    for insert to authenticated
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ads_products_update_own" on public.ads_products
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ads_swaps policies
do $$ begin
  create policy "ads_swaps_select_participants" on public.ads_swaps
    for select to authenticated
    using (requester_user_id = auth.uid() or target_user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ads_swaps_insert_requester" on public.ads_swaps
    for insert to authenticated
    with check (requester_user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ads_swaps_update_participants" on public.ads_swaps
    for update to authenticated
    using (requester_user_id = auth.uid() or target_user_id = auth.uid())
    with check (requester_user_id = auth.uid() or target_user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ads_credits policies
do $$ begin
  create policy "ads_credits_select_own" on public.ads_credits
    for select to authenticated
    using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ads_credits_upsert_own" on public.ads_credits
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

