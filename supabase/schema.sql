-- ============================================================
-- Notemark – Supabase Schema with Row Level Security
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. note_states table ─────────────────────────────────────────────────
-- One row per user; stores the entire notes state as JSONB columns.
-- auth.users is managed by Supabase Auth – we only need this table.

create table if not exists public.note_states (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  files         jsonb not null default '{}',
  folders       jsonb not null default '{}',
  root          jsonb not null default '[]',
  active_file_id text,
  updated_at    timestamptz not null default now(),

  constraint note_states_user_id_key unique (user_id)   -- one row per user
);

-- Index for fast user lookups
create index if not exists note_states_user_id_idx on public.note_states(user_id);

-- Auto-update updated_at on every write
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_note_states_updated_at on public.note_states;
create trigger set_note_states_updated_at
  before update on public.note_states
  for each row execute function public.handle_updated_at();

-- ── 2. profiles table (optional but recommended) ─────────────────────────
-- Stores username alongside auth.users (which only has email).
-- Populated by a trigger when a new user signs up.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  email      text not null,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create a profile row when a Supabase Auth user signs up.
-- Username is seeded from user_metadata.username (set during signUp).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. Row Level Security ─────────────────────────────────────────────────

-- note_states: each user sees and modifies ONLY their own row
alter table public.note_states enable row level security;

drop policy if exists "Users can read their own note state"   on public.note_states;
drop policy if exists "Users can insert their own note state" on public.note_states;
drop policy if exists "Users can update their own note state" on public.note_states;
drop policy if exists "Users can delete their own note state" on public.note_states;

create policy "Users can read their own note state"
  on public.note_states for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own note state"
  on public.note_states for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own note state"
  on public.note_states for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users can delete their own note state"
  on public.note_states for delete
  using ( auth.uid() = user_id );

-- profiles: users can read their own profile; inserts happen via trigger only
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- ── 4. Grant permissions ──────────────────────────────────────────────────
-- The anon role is used for unauthenticated requests (e.g. sign-in page).
-- The authenticated role is used after Supabase Auth issues a JWT.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on public.note_states to authenticated;

grant select, update
  on public.profiles to authenticated;

-- ── Done ──────────────────────────────────────────────────────────────────
-- To verify RLS is active:
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public';
