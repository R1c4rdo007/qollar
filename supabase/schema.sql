-- ============================================================
-- QOLLAR DATABASE SCHEMA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  phone text,
  email text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PETS
-- ============================================================
create table public.pets (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  qr_id text unique not null default 'QR-' || upper(substr(md5(random()::text), 1, 8)),
  name text not null,
  species text not null default 'dog' check (species in ('dog', 'cat', 'other')),
  breed text,
  color text,
  age integer,
  description text,
  photos text[] default '{}',
  contact_phone text,
  contact_email text,
  whatsapp text,
  is_lost boolean default false not null,
  reward_description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pets_updated_at
  before update on public.pets
  for each row execute procedure public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- SCAN EVENTS (when someone scans a QR)
-- ============================================================
create table public.scan_events (
  id uuid default uuid_generate_v4() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  qr_id text not null,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  device_info text,
  notified_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.scan_events enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Pets: owners can manage their pets
create policy "Owners can view own pets"
  on public.pets for select
  using (auth.uid() = owner_id);

create policy "Owners can insert pets"
  on public.pets for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own pets"
  on public.pets for update
  using (auth.uid() = owner_id);

create policy "Owners can delete own pets"
  on public.pets for delete
  using (auth.uid() = owner_id);

-- Pets: PUBLIC can view pet by qr_id (for QR scanning — no auth needed)
create policy "Public can view pet by qr_id"
  on public.pets for select
  using (true);

-- Scan events: anyone can insert (finder scanning QR)
create policy "Anyone can insert scan events"
  on public.scan_events for insert
  with check (true);

-- Scan events: only owner can view scan history of their pets
create policy "Owners can view scan events of own pets"
  on public.scan_events for select
  using (
    exists (
      select 1 from public.pets
      where pets.id = scan_events.pet_id
      and pets.owner_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('pet-photos', 'pet-photos', true);

create policy "Anyone can view pet photos"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

create policy "Authenticated users can upload pet photos"
  on storage.objects for insert
  with check (bucket_id = 'pet-photos' and auth.role() = 'authenticated');

create policy "Users can delete own pet photos"
  on storage.objects for delete
  using (bucket_id = 'pet-photos' and auth.uid()::text = (storage.foldername(name))[1]);
