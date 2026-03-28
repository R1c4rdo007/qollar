-- ============================================================
-- QOLLAR DATABASE SCHEMA V2
-- Ejecutar DESPUÉS de schema.sql en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- UPDATE PROFILES: add points and admin flag
-- ============================================================
alter table public.profiles
  add column if not exists points integer default 0 not null,
  add column if not exists is_admin boolean default false not null;

-- ============================================================
-- QR PLATES (plaquitas físicas vendidas)
-- ============================================================
create table public.qr_plates (
  id uuid default uuid_generate_v4() primary key,
  plate_code text unique not null,  -- e.g. QLR-AB3F9E2C
  status text not null default 'inactive' check (status in ('inactive', 'active')),
  pet_id uuid references public.pets(id) on delete set null,
  batch_id text,                    -- para agrupar lotes generados
  created_by uuid references public.profiles(id),
  activated_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- POSTS (comunidad social)
-- ============================================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete set null,
  caption text,
  image_url text,
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- POST LIKES
-- ============================================================
create table public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

-- ============================================================
-- POST COMMENTS
-- ============================================================
create table public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,  -- 'pet_found', 'post_like', 'post_comment', 'points_earned', 'welcome'
  title text not null,
  message text not null,
  data jsonb default '{}',
  read boolean default false not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- POINT TRANSACTIONS
-- ============================================================
create table public.point_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null,  -- 'welcome', 'add_pet', 'found_pet', 'post', 'daily_login'
  reference_id uuid,     -- id del scan_event, post, etc.
  created_at timestamptz default now() not null
);

-- ============================================================
-- FUNCTIONS: award points
-- ============================================================
create or replace function public.award_points(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
)
returns void as $$
begin
  update public.profiles
  set points = points + p_amount
  where id = p_user_id;

  insert into public.point_transactions (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, p_reason, p_reference_id);

  insert into public.notifications (user_id, type, title, message, data)
  values (
    p_user_id,
    'points_earned',
    '🎉 ¡Ganaste puntos!',
    'Ganaste ' || p_amount || ' QollPoints por: ' || p_reason,
    jsonb_build_object('points', p_amount, 'reason', p_reason)
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- TRIGGER: auto like/comment count
-- ============================================================
create or replace function public.update_post_counts()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'post_likes' then
    if TG_OP = 'INSERT' then
      update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' then
      update public.posts set likes_count = likes_count - 1 where id = OLD.post_id;
    end if;
  elsif TG_TABLE_NAME = 'post_comments' then
    if TG_OP = 'INSERT' then
      update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' then
      update public.posts set comments_count = comments_count - 1 where id = OLD.post_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_counts();

create trigger post_comments_count
  after insert or delete on public.post_comments
  for each row execute procedure public.update_post_counts();

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.qr_plates enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.point_transactions enable row level security;

-- QR Plates
create policy "Admins can manage plates"
  on public.qr_plates for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can view inactive plates to activate"
  on public.qr_plates for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can activate plates"
  on public.qr_plates for update
  using (auth.role() = 'authenticated' and status = 'inactive')
  with check (status = 'active');

-- Posts: public read, auth write
create policy "Anyone can view posts"
  on public.posts for select using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Post likes
create policy "Anyone can view likes"
  on public.post_likes for select using (true);

create policy "Authenticated users can like"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- Post comments
create policy "Anyone can view comments"
  on public.post_comments for select using (true);

create policy "Authenticated users can comment"
  on public.post_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

-- Notifications: own only
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Point transactions: own only
create policy "Users can view own transactions"
  on public.point_transactions for select
  using (auth.uid() = user_id);

-- ============================================================
-- Set admin for Ricardo
-- (run this AFTER you have logged in at least once)
-- ============================================================
-- update public.profiles set is_admin = true where email = 'ricardo.var.webdev@gmail.com';
